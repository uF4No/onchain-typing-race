// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TypingSpeedGame
 * @dev Smart contract for a typing speed game with letter-based transactions and optimistic updates
 */
contract TypingSpeedGame {
    struct LetterEntry {
        address player;
        bytes1 letter;
        uint256 timestamp;
        uint256 blockNumber;
        uint256 gameSession;
    }

    struct GameSession {
        address player;
        uint256 startTime;
        uint256 endTime;
        uint256 totalLetters;
        uint256 totalWords;
        bool completed;
    }

    struct PlayerScore {
        address player;
        uint256 totalLetters;
        uint256 totalWords;
        uint256 bestLettersPerGame;
        uint256 gamesPlayed;
    }

    // State variables
    mapping(address => PlayerScore) public playerScores;
    mapping(uint256 => LetterEntry[]) public gameSessionLetters;
    mapping(uint256 => GameSession) public gameSessions;

    uint256 public currentGameSession;
    uint256 public totalLettersSubmitted;
    uint256 public totalWordsSubmitted;
    uint256 public totalGamesPlayed;

    // Scoreboard - top players by total letters
    address[] public leaderboard;
    mapping(address => uint256) public leaderboardPosition;
    uint256 public constant MAX_LEADERBOARD_SIZE = 100;

    // Events
    event LetterTyped(
        address indexed player,
        bytes1 letter,
        uint256 timestamp,
        uint256 gameSession,
        uint256 blockNumber
    );

    event GameStarted(
        address indexed player,
        uint256 gameSession,
        uint256 timestamp
    );

    event GameCompleted(
        address indexed player,
        uint256 totalLetters,
        uint256 totalWords,
        uint256 gameSession,
        uint256 duration
    );

    event ScoreboardUpdated(
        address indexed player,
        uint256 newPosition,
        uint256 totalLetters
    );

    // Modifiers
    modifier validGameSession(uint256 gameSession) {
        require(
            gameSession > 0 && gameSession <= currentGameSession,
            "Invalid game session"
        );
        _;
    }

    modifier onlyGamePlayer(uint256 gameSession) {
        require(
            gameSessions[gameSession].player == msg.sender,
            "Not the game player"
        );
        _;
    }

    /**
     * @dev Start a new game session
     * @return gameSession The new game session ID
     */
    function startGame() external returns (uint256 gameSession) {
        currentGameSession++;
        gameSession = currentGameSession;

        gameSessions[gameSession] = GameSession({
            player: msg.sender,
            startTime: block.timestamp,
            endTime: 0,
            totalLetters: 0,
            totalWords: 0,
            completed: false
        });

        emit GameStarted(msg.sender, gameSession, block.timestamp);
        return gameSession;
    }

    /**
     * @dev Submit a correct letter during the game
     * @param letter The letter that was typed correctly
     * @param gameSession The current game session ID
     */
    function submitLetter(
        bytes1 letter,
        uint256 gameSession
    ) external validGameSession(gameSession) onlyGamePlayer(gameSession) {
        require(!gameSessions[gameSession].completed, "Game already completed");
        require(letter != 0x00, "Letter cannot be empty");

        // Check if game is still within time limit (30 seconds as per requirements + 3 of countdown)
        require(
            block.timestamp <= gameSessions[gameSession].startTime + 33,
            "Game time expired"
        );

        LetterEntry memory newLetter = LetterEntry({
            player: msg.sender,
            letter: letter,
            timestamp: block.timestamp,
            blockNumber: block.number,
            gameSession: gameSession
        });

        gameSessionLetters[gameSession].push(newLetter);
        totalLettersSubmitted++;

        emit LetterTyped(
            msg.sender,
            letter,
            block.timestamp,
            gameSession,
            block.number
        );
    }

    /**
     * @dev Complete the current game and set final scores
     * @param totalLetters The total number of correct letters typed
     * @param totalWords The total number of correct words completed
     * @param gameSession The game session to complete
     */
    function completeGame(
        uint256 totalLetters,
        uint256 totalWords,
        uint256 gameSession
    ) external validGameSession(gameSession) onlyGamePlayer(gameSession) {
        require(!gameSessions[gameSession].completed, "Game already completed");

        GameSession storage session = gameSessions[gameSession];
        session.endTime = block.timestamp;
        session.totalLetters = totalLetters;
        session.totalWords = totalWords;
        session.completed = true;

        // Update player's overall statistics
        PlayerScore storage playerScore = playerScores[msg.sender];
        playerScore.player = msg.sender;
        playerScore.totalLetters += totalLetters;
        playerScore.totalWords += totalWords;
        playerScore.gamesPlayed++;

        // Update best letters per game if this is better
        if (totalLetters > playerScore.bestLettersPerGame) {
            playerScore.bestLettersPerGame = totalLetters;
        }

        totalWordsSubmitted += totalWords;
        totalGamesPlayed++;

        // Update leaderboard
        _updateLeaderboard(msg.sender);

        uint256 duration = session.endTime - session.startTime;
        emit GameCompleted(
            msg.sender,
            totalLetters,
            totalWords,
            gameSession,
            duration
        );
    }

    /**
     * @dev Internal function to update the leaderboard
     * @param player The player whose score was updated
     */
    function _updateLeaderboard(address player) internal {
        uint256 playerTotalLetters = playerScores[player].totalLetters;
        uint256 currentPosition = leaderboardPosition[player];

        // If player is not on leaderboard yet
        if (currentPosition == 0) {
            // Add to leaderboard if there's space or if score is high enough
            if (leaderboard.length < MAX_LEADERBOARD_SIZE) {
                leaderboard.push(player);
                leaderboardPosition[player] = leaderboard.length;
                _bubbleUp(leaderboard.length - 1);
            } else {
                // Check if player's score is higher than the lowest on leaderboard
                address lastPlayer = leaderboard[leaderboard.length - 1];
                if (
                    playerTotalLetters > playerScores[lastPlayer].totalLetters
                ) {
                    // Replace the last player
                    leaderboardPosition[lastPlayer] = 0;
                    leaderboard[leaderboard.length - 1] = player;
                    leaderboardPosition[player] = leaderboard.length;
                    _bubbleUp(leaderboard.length - 1);
                }
            }
        } else {
            // Player is already on leaderboard, bubble up if needed
            _bubbleUp(currentPosition - 1);
        }

        emit ScoreboardUpdated(
            player,
            leaderboardPosition[player],
            playerTotalLetters
        );
    }

    /**
     * @dev Internal function to maintain leaderboard order (bubble up)
     * @param index The index to start bubbling up from
     */
    function _bubbleUp(uint256 index) internal {
        while (index > 0) {
            address currentPlayer = leaderboard[index];
            address parentPlayer = leaderboard[index - 1];

            if (
                playerScores[currentPlayer].totalLetters >
                playerScores[parentPlayer].totalLetters
            ) {
                // Swap positions
                leaderboard[index] = parentPlayer;
                leaderboard[index - 1] = currentPlayer;

                // Update position mappings
                leaderboardPosition[parentPlayer] = index + 1;
                leaderboardPosition[currentPlayer] = index;

                index--;
            } else {
                break;
            }
        }
    }

    /**
     * @dev Get player's score details
     * @param player The player's address
     * @return PlayerScore struct with all player statistics
     */
    function getPlayerScore(
        address player
    ) external view returns (PlayerScore memory) {
        return playerScores[player];
    }

    /**
     * @dev Get all letters from a specific game session
     * @param gameSession The game session ID
     * @return Array of LetterEntry structs
     */
    function getGameSessionLetters(
        uint256 gameSession
    )
        external
        view
        validGameSession(gameSession)
        returns (LetterEntry[] memory)
    {
        return gameSessionLetters[gameSession];
    }

    /**
     * @dev Get game session details
     * @param gameSession The game session ID
     * @return GameSession struct with session details
     */
    function getGameSession(
        uint256 gameSession
    ) external view validGameSession(gameSession) returns (GameSession memory) {
        return gameSessions[gameSession];
    }

    /**
     * @dev Get the number of letters submitted in a game session
     * @param gameSession The game session ID
     * @return Number of letters submitted
     */
    function getGameSessionLetterCount(
        uint256 gameSession
    ) external view validGameSession(gameSession) returns (uint256) {
        return gameSessionLetters[gameSession].length;
    }

    /**
     * @dev Get recent letters across all games (for real-time feed)
     * @param count Number of recent letters to retrieve
     * @return Array of recent LetterEntry structs
     */
    function getRecentLetters(
        uint256 count
    ) external view returns (LetterEntry[] memory) {
        if (totalLettersSubmitted == 0) {
            return new LetterEntry[](0);
        }

        uint256 actualCount = count > totalLettersSubmitted
            ? totalLettersSubmitted
            : count;
        LetterEntry[] memory recentLetters = new LetterEntry[](actualCount);
        uint256 foundLetters = 0;

        // Search backwards through game sessions to find recent letters
        for (
            uint256 session = currentGameSession;
            session > 0 && foundLetters < actualCount;
            session--
        ) {
            LetterEntry[] storage sessionLetters = gameSessionLetters[session];

            for (
                uint256 i = sessionLetters.length;
                i > 0 && foundLetters < actualCount;
                i--
            ) {
                recentLetters[foundLetters] = sessionLetters[i - 1];
                foundLetters++;
            }
        }

        return recentLetters;
    }

    /**
     * @dev Get the current leaderboard
     * @param count Number of top players to retrieve (max MAX_LEADERBOARD_SIZE)
     * @return players Array of player addresses in order of rank
     * @return totalLetters Array of corresponding total letters for each player
     */
    function getLeaderboard(
        uint256 count
    )
        external
        view
        returns (address[] memory players, uint256[] memory totalLetters)
    {
        uint256 actualCount = count > leaderboard.length
            ? leaderboard.length
            : count;
        players = new address[](actualCount);
        totalLetters = new uint256[](actualCount);

        for (uint256 i = 0; i < actualCount; i++) {
            players[i] = leaderboard[i];
            totalLetters[i] = playerScores[leaderboard[i]].totalLetters;
        }

        return (players, totalLetters);
    }

    /**
     * @dev Get a player's leaderboard position
     * @param player The player's address
     * @return position The player's position (1-based, 0 if not on leaderboard)
     */
    function getPlayerLeaderboardPosition(
        address player
    ) external view returns (uint256 position) {
        return leaderboardPosition[player];
    }

    /**
     * @dev Get contract statistics
     * @return totalLetters Total letters submitted across all games
     * @return totalWords Total words completed across all games
     * @return totalGames Total games played
     * @return currentSession Current game session number
     */
    function getContractStats()
        external
        view
        returns (
            uint256 totalLetters,
            uint256 totalWords,
            uint256 totalGames,
            uint256 currentSession
        )
    {
        return (
            totalLettersSubmitted,
            totalWordsSubmitted,
            totalGamesPlayed,
            currentGameSession
        );
    }
}
