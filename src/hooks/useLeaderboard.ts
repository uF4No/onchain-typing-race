import { useState, useEffect, useCallback } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { typing_game_abi } from '../config/abis';

// Get contract address from environment
const TYPING_GAME_ADDRESS = (import.meta.env.VITE_TYPING_GAME_CONTRACT_ADDRESS || '') as `0x${string}`;

export interface LeaderboardEntry {
  address: string;
  bestLettersPerGame: number;
  totalLetters: number;
  gamesPlayed: number;
  position: number;
  isCurrentUser?: boolean;
}

export interface PlayerStats {
  totalLetters: number;
  totalWords: number;
  bestLettersPerGame: number;
  gamesPlayed: number;
  leaderboardPosition: number;
}

export interface ContractStats {
  totalLetters: number;
  totalWords: number;
  totalGames: number;
  currentSession: number;
}

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [contractStats, setContractStats] = useState<ContractStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(false);

  const publicClient = usePublicClient();
  const { address } = useAccount();

  // Rate limiting: minimum 5 seconds between fetches
  const MIN_FETCH_INTERVAL = 5000;

  const fetchLeaderboard = useCallback(async () => {
    if (!publicClient || !TYPING_GAME_ADDRESS || isFetching) return;

    // Rate limiting check
    const now = Date.now();
    if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
      console.log('Skipping fetch due to rate limiting');
      return;
    }

    // Mock mode for development (when contract address is not set)
    if (!TYPING_GAME_ADDRESS || TYPING_GAME_ADDRESS.length === 0) {
      console.log('Using mock leaderboard data');
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLeaderboard([
        { address: '0x1234...5678', bestLettersPerGame: 45, totalLetters: 180, gamesPlayed: 4, position: 1, isCurrentUser: false },
        { address: '0x9876...4321', bestLettersPerGame: 42, totalLetters: 168, gamesPlayed: 4, position: 2, isCurrentUser: false },
        { address: '0xabcd...efgh', bestLettersPerGame: 38, totalLetters: 152, gamesPlayed: 4, position: 3, isCurrentUser: true },
      ]);
      
      setPlayerStats({
        totalLetters: 152,
        totalWords: 38,
        bestLettersPerGame: 38,
        gamesPlayed: 4,
        leaderboardPosition: 3,
      });
      
      setContractStats({
        totalLetters: 500,
        totalWords: 125,
        totalGames: 12,
        currentSession: 15,
      });
      
      setIsLoading(false);
      return;
    }

    try {
      setIsFetching(true);
      setIsLoading(true);
      setError(null);
      setLastFetchTime(now);

      // Fetch top players from contract leaderboard (this gives us active players)
      const [players] = await publicClient.readContract({
        address: TYPING_GAME_ADDRESS,
        abi: typing_game_abi,
        functionName: 'getLeaderboard',
        args: [BigInt(50)], // Get more players to sort by best game
      }) as [string[], bigint[]];

      // Fetch individual player stats for each player to get bestLettersPerGame
      const playerStatsPromises = players.map(async (playerAddress) => {
        const playerScore = await publicClient.readContract({
          address: TYPING_GAME_ADDRESS,
          abi: typing_game_abi,
          functionName: 'getPlayerScore',
          args: [playerAddress as `0x${string}`],
        }) as {
          player: string;
          totalLetters: bigint;
          totalWords: bigint;
          bestLettersPerGame: bigint;
          gamesPlayed: bigint;
        };

        return {
          address: playerAddress,
          bestLettersPerGame: Number(playerScore.bestLettersPerGame),
          totalLetters: Number(playerScore.totalLetters),
          gamesPlayed: Number(playerScore.gamesPlayed),
          isCurrentUser: address ? playerAddress.toLowerCase() === address.toLowerCase() : false,
        };
      });

      const playerStats = await Promise.all(playerStatsPromises);

      // Sort by bestLettersPerGame (descending) and take top 10
      const sortedPlayers = playerStats
        .filter(player => player.bestLettersPerGame > 0) // Only include players who have completed at least one game
        .sort((a, b) => b.bestLettersPerGame - a.bestLettersPerGame)
        .slice(0, 10)
        .map((player, index) => ({
          ...player,
          position: index + 1,
        }));

      setLeaderboard(sortedPlayers);

      // Fetch current player's stats if connected
      if (address) {
        const [playerScore, playerPosition] = await Promise.all([
          publicClient.readContract({
            address: TYPING_GAME_ADDRESS,
            abi: typing_game_abi,
            functionName: 'getPlayerScore',
            args: [address],
          }) as Promise<{
            player: string;
            totalLetters: bigint;
            totalWords: bigint;
            bestLettersPerGame: bigint;
            gamesPlayed: bigint;
          }>,
          publicClient.readContract({
            address: TYPING_GAME_ADDRESS,
            abi: typing_game_abi,
            functionName: 'getPlayerLeaderboardPosition',
            args: [address],
          }) as Promise<bigint>,
        ]);

        setPlayerStats({
          totalLetters: Number(playerScore.totalLetters),
          totalWords: Number(playerScore.totalWords),
          bestLettersPerGame: Number(playerScore.bestLettersPerGame),
          gamesPlayed: Number(playerScore.gamesPlayed),
          leaderboardPosition: Number(playerPosition),
        });
      }

      // Fetch contract stats
      const [totalLettersContract, totalWordsContract, totalGamesContract, currentSessionContract] = await publicClient.readContract({
        address: TYPING_GAME_ADDRESS,
        abi: typing_game_abi,
        functionName: 'getContractStats',
      }) as [bigint, bigint, bigint, bigint];

      setContractStats({
        totalLetters: Number(totalLettersContract),
        totalWords: Number(totalWordsContract),
        totalGames: Number(totalGamesContract),
        currentSession: Number(currentSessionContract),
      });

    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      
      // Handle rate limiting errors specifically
      if (err instanceof Error && err.message.includes('429')) {
        setError('Rate limited. Please wait a moment before refreshing.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [publicClient, address, lastFetchTime, isFetching]);

  // Fetch leaderboard on mount and when address changes
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Refresh leaderboard function with rate limiting
  const refreshLeaderboard = useCallback(() => {
    const now = Date.now();
    if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
      console.log('Refresh blocked due to rate limiting');
      setError(`Please wait ${Math.ceil((MIN_FETCH_INTERVAL - (now - lastFetchTime)) / 1000)} seconds before refreshing again.`);
      return;
    }
    fetchLeaderboard();
  }, [fetchLeaderboard, lastFetchTime]);

  return {
    leaderboard,
    playerStats,
    contractStats,
    isLoading,
    error,
    refreshLeaderboard,
  };
};
