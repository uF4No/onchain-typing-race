import { useState, useCallback, useRef, useEffect } from 'react';
import { useWalletClient, useAccount, usePublicClient } from 'wagmi';
import type { Hash } from 'viem';
import {eip712WalletActions, getGeneralPaymasterInput} from 'viem/zksync'

// Typing game contract ABI (key functions)
const TYPING_GAME_ABI = [
  {
    "inputs": [],
    "name": "startGame",
    "outputs": [{"internalType": "uint256", "name": "gameSession", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes1", "name": "letter", "type": "bytes1"},
      {"internalType": "uint256", "name": "gameSession", "type": "uint256"}
    ],
    "name": "submitLetter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "totalLetters", "type": "uint256"},
      {"internalType": "uint256", "name": "totalWords", "type": "uint256"},
      {"internalType": "uint256", "name": "gameSession", "type": "uint256"}
    ],
    "name": "completeGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Get contract address from environment
const TYPING_GAME_ADDRESS = (import.meta.env.VITE_TYPING_GAME_CONTRACT_ADDRESS || '') as `0x${string}`;

export interface LetterTransaction {
  id: string;
  type: 'letter' | 'startGame' | 'completeGame';
  letter?: string;
  hash?: Hash;
  status: 'pending' | 'sent' | 'confirmed' | 'failed';
  timestamp: number;
  error?: string;
  gameSession?: number;
  fastForwarded?: boolean; // Flag to indicate if this was fast-forwarded for UI
}

export interface GameState {
  isActive: boolean;
  isCompleting: boolean; // New state for waiting for transactions to complete
  gameSession: number | null;
  localLetterCount: number;
  localWordCount: number;
  startTime: number | null;
  countdown: number; // 3-second countdown before game starts
}

export const useTypingGameQueue = () => {
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    isCompleting: false,
    gameSession: null,
    localLetterCount: 0,
    localWordCount: 0,
    startTime: null,
    countdown: 0,
  });
  
  const [transactions, setTransactions] = useState<LetterTransaction[]>([]);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartRef = useRef<NodeJS.Timeout | null>(null);
  const nonceRef = useRef<number | null>(null);
  
  const { data: walletClient } = useWalletClient();
  // extend client to support native paymasters
  walletClient?.extend(eip712WalletActions());

  const { address } = useAccount();
  const publicClient = usePublicClient();
  // extend client to support native paymasters
  publicClient.extend(eip712WalletActions())

  // Monitor all sent transactions for confirmation
  useEffect(() => {
    const sentTransactions = transactions.filter(tx => tx.hash && tx.status === 'sent');
    
    if (sentTransactions.length === 0 || !publicClient) return;

    const monitorTransactions = async () => {
      for (const tx of sentTransactions) {
        if (!tx.hash) continue;
        
        try {
          // Check if transaction is confirmed
          const receipt = await publicClient.getTransactionReceipt({ hash: tx.hash });
          
          if (receipt) {
            console.log(`✅ Transaction actually confirmed on-chain: ${tx.hash}`);
            setTransactions(prev => prev.map(t => 
              t.hash === tx.hash 
                ? { ...t, status: 'confirmed' as const, fastForwarded: false }
                : t
            ));
          }
        } catch (error) {
          // Transaction might not be mined yet, or could have failed
          console.log(`⏳ Transaction still pending: ${tx.hash}`);
        }
      }
    };

    // Monitor transactions every 200ms
    const interval = setInterval(monitorTransactions, 200);
    
    // Also check immediately
    monitorTransactions();

    return () => clearInterval(interval);
  }, [transactions, publicClient]);

  // Monitor completion state - finish when all transactions are done
  useEffect(() => {
    if (!gameState.isCompleting) return;

    const pendingTransactions = transactions.filter(tx => 
      tx.status === 'pending' || tx.status === 'sent'
    );

    // If no pending transactions and we're completing, finish the game
    if (pendingTransactions.length === 0) {
      console.log('🎉 All transactions completed, finishing game!');
      setGameState(prev => ({ 
        ...prev, 
        isCompleting: false,
        gameSession: null,
        startTime: null 
      }));
    }
  }, [gameState.isCompleting, transactions]);

  // Get and increment nonce for transaction ordering
  const getNextNonce = useCallback(async () => {
    if (!publicClient || !address) return undefined;
    
    if (nonceRef.current === null) {
      // Get initial nonce from network
      const currentNonce = await publicClient.getTransactionCount({
        address: address,
        blockTag: 'pending'
      });
      nonceRef.current = currentNonce;
    } else {
      // Increment local nonce
      nonceRef.current += 1;
    }
    
    return nonceRef.current;
  }, [publicClient, address]);

  // Simulate fast confirmation for demo purposes (while still sending real transactions)
  const simulateConfirmation = useCallback((txId: string, delay: number = 300) => {
    setTimeout(() => {
      setTransactions(prev => prev.map(tx => 
        tx.id === txId 
          ? { ...tx, status: 'confirmed' as const, fastForwarded: true }
          : tx
      ));
    }, delay);
  }, []);

  // Fire-and-forget transaction sender with nonce management
  const sendTransactionAsync = useCallback(async (
    txId: string,
    functionName: 'startGame' | 'submitLetter' | 'completeGame',
    args: unknown[] = []
  ) => {
    if (!walletClient || !publicClient || !TYPING_GAME_ADDRESS || !address) {
      console.error('Wallet client, public client, contract address, or address not available');
      return;
    }

    try {
      let hash: Hash;
      const nonce = await getNextNonce();
      
      console.log(`🔢 Using nonce ${nonce} for ${functionName}`);
      
      if (functionName === 'startGame') {
        // For startGame, we need to simulate first to get the return value
        const { result } = await publicClient.simulateContract({
          address: TYPING_GAME_ADDRESS,
          abi: TYPING_GAME_ABI,
          functionName: 'startGame',
          account: walletClient.account,
        });
        
        hash = await walletClient.writeContract({
          address: TYPING_GAME_ADDRESS,
          abi: TYPING_GAME_ABI,
          functionName: 'startGame',
          nonce,
          paymaster: '0xBFf8C6E939E96741d750AF459167Ffa80252a3Ae',
          paymasterInput: getGeneralPaymasterInput({innerInput: '0x'})
        });
        
        // Update game state with the actual game session from contract
        const actualGameSession = Number(result);
        setGameState(prev => ({
          ...prev,
          gameSession: actualGameSession,
        }));
        
        // Update the transaction with the actual game session and mark as sent
        setTransactions(prev => prev.map(tx => 
          tx.id === txId 
            ? { ...tx, hash, status: 'sent' as const, gameSession: actualGameSession }
            : tx
        ));
        
        // Simulate fast confirmation after 500ms (startGame is important, show a bit more delay)
        simulateConfirmation(txId, 500);
        
        console.log(`Game started with session ID: ${actualGameSession}`);
        
      } else if (functionName === 'submitLetter') {
        const [letter, gameSession] = args;
        hash = await walletClient.writeContract({
          address: TYPING_GAME_ADDRESS,
          abi: TYPING_GAME_ABI,
          functionName: 'submitLetter',
          args: [letter as `0x${string}`, gameSession as bigint],
          nonce,
          paymaster: '0xBFf8C6E939E96741d750AF459167Ffa80252a3Ae',
          paymasterInput: getGeneralPaymasterInput({innerInput: '0x'})

        });
        
        // Update status to sent
        setTransactions(prev => prev.map(tx => 
          tx.id === txId 
            ? { ...tx, hash, status: 'sent' as const }
            : tx
        ));
        
        // Simulate fast confirmation after 200-400ms (showcase the 200ms block times!)
        const confirmationDelay = 200 + Math.random() * 200; // 200-400ms
        simulateConfirmation(txId, confirmationDelay);
        
      } else if (functionName === 'completeGame') {
        const [totalLetters, totalWords, gameSession] = args;
        hash = await walletClient.writeContract({
          address: TYPING_GAME_ADDRESS,
          abi: TYPING_GAME_ABI,
          functionName: 'completeGame',
          args: [totalLetters as bigint, totalWords as bigint, gameSession as bigint],
          nonce,
          paymaster: '0xBFf8C6E939E96741d750AF459167Ffa80252a3Ae',
          paymasterInput: getGeneralPaymasterInput({innerInput: '0x'})
        });
        
        // Update status to sent
        setTransactions(prev => prev.map(tx => 
          tx.id === txId 
            ? { ...tx, hash, status: 'sent' as const }
            : tx
        ));
        
        // Simulate fast confirmation after 400ms (completion is important)
        simulateConfirmation(txId, 150);
        
      } else {
        throw new Error(`Unknown function: ${functionName}`);
      }

      console.log(`${functionName} transaction sent: ${hash} (nonce: ${nonce}) - will simulate confirmation shortly`);
    } catch (error) {
      console.error(`${functionName} transaction failed:`, error);
      
      // If nonce error, reset nonce to let it re-sync
      if (error instanceof Error && error.message.includes('nonce')) {
        console.log('🔄 Resetting nonce due to nonce error');
        nonceRef.current = null;
      }
      
      // Mark transaction as failed and handle rollback
      setTransactions(prev => prev.map(tx => {
        if (tx.id === txId) {
          // Handle specific rollbacks based on transaction type
          if (tx.type === 'startGame') {
            setGameState(prevState => ({
              ...prevState,
              isActive: false,
              gameSession: null,
              countdown: 0,
            }));
          } else if (tx.type === 'letter') {
            setGameState(prevState => ({
              ...prevState,
              localLetterCount: Math.max(0, prevState.localLetterCount - 1),
            }));
          }
          
          return { 
            ...tx, 
            status: 'failed' as const, 
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
        return tx;
      }));
    }
  }, [walletClient, publicClient, address, getNextNonce, simulateConfirmation]);

  // Start game with 3-second countdown
  const startGame = useCallback(() => {
    console.log('🎮 startGame called', { 
      isActive: gameState.isActive, 
      countdown: gameState.countdown,
      walletClient: !!walletClient,
      publicClient: !!publicClient,
      contractAddress: TYPING_GAME_ADDRESS
    });
    
    if (gameState.isActive || gameState.countdown > 0) return;

    // Reset nonce tracking for new game session
    nonceRef.current = null;

    // Start countdown
    setGameState(prev => ({ ...prev, countdown: 3 }));
    
    // Add start game transaction (gameSession will be set by sendTransactionAsync)
    const txId = `start_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newTx: LetterTransaction = {
      id: txId,
      type: 'startGame',
      status: 'pending',
      timestamp: Date.now(),
    };
    
    setTransactions(prev => [...prev, newTx]);
    
    // Send start game transaction immediately
    sendTransactionAsync(txId, 'startGame');
    
    // Countdown timer
    let count = 3;
    countdownRef.current = setInterval(() => {
      count--;
      setGameState(prev => ({ ...prev, countdown: count }));
      
      if (count <= 0) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        
        // Start the game after countdown (gameSession should be set by now)
        setGameState(prev => ({
          ...prev,
          isActive: true,
          localLetterCount: 0,
          localWordCount: 0,
          startTime: Date.now(),
          countdown: 0,
        }));
      }
    }, 1000);
    
    return txId;
  }, [gameState.isActive, gameState.countdown, walletClient, publicClient, sendTransactionAsync]);

  // Submit a letter (optimistic)
  const submitLetter = useCallback((letter: string) => {
    if (!gameState.isActive || !gameState.gameSession) return;
    
    const txId = `letter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Optimistic update - increment letter count immediately
    setGameState(prev => ({
      ...prev,
      localLetterCount: prev.localLetterCount + 1,
    }));
    
    // Add to transaction queue
    const newTx: LetterTransaction = {
      id: txId,
      type: 'letter',
      letter,
      status: 'pending',
      timestamp: Date.now(),
      gameSession: gameState.gameSession,
    };
    
    setTransactions(prev => [...prev, newTx]);
    
    // Convert letter to bytes1 format for Solidity
    const letterBytes = `0x${letter.charCodeAt(0).toString(16).padStart(2, '0')}` as `0x${string}`;
    
    // Send transaction asynchronously
    sendTransactionAsync(txId, 'submitLetter', [letterBytes, BigInt(gameState.gameSession)]);
    
    return txId;
  }, [gameState.isActive, gameState.gameSession, sendTransactionAsync]);

  // Complete word (local state update)
  const completeWord = useCallback(() => {
    if (!gameState.isActive) return;
    
    setGameState(prev => ({
      ...prev,
      localWordCount: prev.localWordCount + 1,
    }));
  }, [gameState.isActive]);

  // Fast-forward all pending transactions to showcase blockchain speed
  const fastForwardTransactions = useCallback(() => {
    console.log('⚡ Fast-forwarding all pending transactions to showcase blockchain speed!');
    
    setTransactions(prev => {
      const pendingTxs = prev.filter(tx => tx.status === 'pending' || tx.status === 'sent');
      
      // Convert all pending/sent transactions to confirmed with staggered timing
      const fastForwardedTxs = pendingTxs.map((tx) => ({
        ...tx,
        status: 'confirmed' as const,
        hash: tx.hash || `0x${'f'.repeat(64)}` as Hash, // Mock hash if none exists
        fastForwarded: true, // Mark as fast-forwarded
      }));
      
      // Apply the updates with a slight delay to show the "processing" effect
      setTimeout(() => {
        fastForwardedTxs.forEach((tx, index) => {
          setTimeout(() => {
            setTransactions(current => current.map(t => 
              t.id === tx.id ? tx : t
            ));
          }, index * 100); // 100ms between each confirmation
        });
      }, 200);
      
      return prev; // Return original for now, updates will come from setTimeout
    });
  }, []);

  // Complete game
  const completeGame = useCallback(() => {
    if (!gameState.isActive || !gameState.gameSession || gameState.isCompleting) return;

    console.log('🏁 Starting game completion process:', gameState.gameSession);
    
    const txId = `complete_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Stop the game and set completing state
    const finalLetters = gameState.localLetterCount;
    const finalWords = gameState.localWordCount;
    
    setGameState(prev => ({
      ...prev,
      isActive: false,
      isCompleting: true,
    }));
    
    // Add to transaction queue
    const newTx: LetterTransaction = {
      id: txId,
      type: 'completeGame',
      status: 'pending',
      timestamp: Date.now(),
      gameSession: gameState.gameSession,
    };
    
    setTransactions(prev => [...prev, newTx]);
    
    // Send complete game transaction (will auto-simulate confirmation)
    sendTransactionAsync(txId, 'completeGame', [BigInt(finalLetters), BigInt(finalWords), BigInt(gameState.gameSession)]);
    
    // Fast-forward any remaining pending transactions for end-game showcase
    setTimeout(() => {
      fastForwardTransactions();
      
      // After fast-forward, finish the game completion
      setTimeout(() => {
        setGameState(prev => ({ 
          ...prev, 
          isCompleting: false,
          gameSession: null,
          startTime: null 
        }));
      }, 1000); // Give time for the fast-forward animation
    }, 600); // Small delay to let the completeGame transaction simulate first
    
    console.log('✅ Game completion transaction queued with simulated confirmation');
    
    return txId;
  }, [gameState.isActive, gameState.gameSession, gameState.isCompleting, gameState.localLetterCount, gameState.localWordCount, sendTransactionAsync, fastForwardTransactions]);

  // Reset game state
  const resetGame = useCallback(() => {
    // Clear any running timers
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (gameStartRef.current) {
      clearTimeout(gameStartRef.current);
      gameStartRef.current = null;
    }
    
    // Reset nonce tracking
    nonceRef.current = null;
    
    setGameState({
      isActive: false,
      isCompleting: false,
      gameSession: null,
      localLetterCount: 0,
      localWordCount: 0,
      startTime: null,
      countdown: 0,
    });
  }, []);

  // Clear completed transactions
  const clearCompleted = useCallback(() => {
    setTransactions(prev => prev.filter(tx => 
      tx.status === 'pending' || tx.status === 'sent'
    ));
  }, []);

  // Get pending operations count
  const pendingOps = transactions.filter(tx => 
    tx.status === 'pending' || tx.status === 'sent'
  ).length;

  // Get stats
  const stats = {
    total: transactions.length,
    pending: transactions.filter(tx => tx.status === 'pending').length,
    sent: transactions.filter(tx => tx.status === 'sent').length,
    confirmed: transactions.filter(tx => tx.status === 'confirmed').length,
    failed: transactions.filter(tx => tx.status === 'failed').length,
  };

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    if (gameStartRef.current) {
      clearTimeout(gameStartRef.current);
    }
    // Reset nonce tracking
    nonceRef.current = null;
  }, []);

  return {
    gameState,
    transactions,
    startGame,
    submitLetter,
    completeWord,
    completeGame,
    fastForwardTransactions,
    resetGame,
    clearCompleted,
    cleanup,
    pendingOps,
    stats,
    isConnected: !!address,
    contractAddress: TYPING_GAME_ADDRESS,
  };
};
