import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTypingGameQueue } from '../hooks/useTypingGameQueue';
import { SAMPLE_WORDS, GAME_DURATION } from '../utils/constants';
import type { GameResults, GameTransaction } from '../types/game';
import './TypingGame.css';

interface TypingGameProps {
  isGameActive: boolean;
  onGameStateChange: (active: boolean) => void;
  onTransactionUpdate: (transactions: GameTransaction[]) => void;
  onClearHistory?: () => void;
  onGameComplete?: (results: GameResults) => void;
  onGameStart?: () => void;
  userAddress: string | null;
  sessionKey: string | null;
}

interface LocalGameState {
  currentWordIndex: number;
  typedInput: string;
  wordsCompleted: string[];
  gameWords: string[];
  totalLettersTyped: number;
}

const TypingGame: React.FC<TypingGameProps> = ({ 
  onGameStateChange, 
  onTransactionUpdate, 
  onGameComplete,
  onGameStart
}) => {
  const [localGameState, setLocalGameState] = useState<LocalGameState>({
    currentWordIndex: 0,
    typedInput: '',
    wordsCompleted: [],
    gameWords: [],
    totalLettersTyped: 0,
  });


  const inputRef = useRef<HTMLInputElement>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameCompletedRef = useRef<boolean>(false);
  const completeGameRef = useRef<(() => void) | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);

  // Use the optimistic transaction queue
  const {
    gameState,
    transactions,
    startGame,
    submitLetter,
    completeWord,
    completeGame,
    resetGame,
    cleanup,
    pendingOps,
    stats,
    isConnected,
  } = useTypingGameQueue();

  // Keep completeGame ref updated
  useEffect(() => {
    completeGameRef.current = completeGame;
  }, [completeGame]);

  // Generate random words for the game
  const generateGameWords = useCallback(() => {
    const shuffled = [...SAMPLE_WORDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 50);
  }, []);

  // Update parent component with transactions
  useEffect(() => {
    const convertedTx = transactions.map(tx => ({
      id: tx.id,
      type: tx.type as 'letter' | 'word' | 'startGame' | 'completeGame',
      data: tx.type === 'letter' ? tx.letter || '' : 
            tx.type === 'startGame' ? 'Game Started' :
            tx.type === 'completeGame' ? 'Game Completed' : 'Transaction',
      timestamp: tx.timestamp,
      hash: tx.hash,
      status: tx.status,
      error: tx.error,
    }));
    onTransactionUpdate(convertedTx);
  }, [transactions, onTransactionUpdate]);

  // Monitor game completion and calculate results
  const wasCompletingRef = useRef(false);
  useEffect(() => {
    // Track when game transitions from completing to not completing
    if (wasCompletingRef.current && !gameState.isCompleting && timeRemaining === 0) {
      // Game just finished - calculate results
      const totalLetters = gameState.localLetterCount;
      const totalWords = gameState.localWordCount;
      const totalTransactions = totalLetters; // Only count letter transactions for TPS calculation
      const gameTime = GAME_DURATION; // 30 seconds
      const tps = totalTransactions / gameTime;
      const wpm = (totalWords / gameTime) * 60; // words per minute
      
      const results: GameResults = {
        totalLetters,
        totalWords,
        totalTransactions,
        tps,
        wpm,
        gameTime,
        timestamp: Date.now(),
      };
      
      console.log('📊 Game results calculated:', results);
      
      // Emit results to parent
      if (onGameComplete) {
        onGameComplete(results);
      }
    }
    
    // Update the ref for next time
    wasCompletingRef.current = gameState.isCompleting;
  }, [gameState.isCompleting, gameState.localLetterCount, gameState.localWordCount, timeRemaining, onGameComplete]);

  // Handle game state changes
  useEffect(() => {
    onGameStateChange(gameState.isActive);
  }, [gameState.isActive, onGameStateChange]); // Removed onGameStateChange to prevent loops

  // Start game with countdown
  const handleStartGame = useCallback(() => {
    if (!isConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    // Notify parent that game is starting (to clear previous results)
    if (onGameStart) {
      onGameStart();
    }

    // Reset completion flag
    gameCompletedRef.current = false;

    // Generate words and reset local state
    const words = generateGameWords();
    setLocalGameState({
      currentWordIndex: 0,
      typedInput: '',
      wordsCompleted: [],
      gameWords: words,
      totalLettersTyped: 0,
    });

    setTimeRemaining(GAME_DURATION);
    
    // Start the blockchain game session
    startGame();
    
    // Focus input after countdown
    setTimeout(() => {
      inputRef.current?.focus();
    }, 3100); // After 3-second countdown
  }, [isConnected, generateGameWords, startGame, onGameStart]);

  // Start game timer when game becomes active
  useEffect(() => {
    if (gameState.isActive && gameState.countdown === 0) {
      // Clear any existing timer first
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
      
      // Reset completion flag when game starts
      gameCompletedRef.current = false;
      
      // Start the game timer
      gameTimerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1 && !gameCompletedRef.current) {
            // Game ended - complete the game (only once)
            gameCompletedRef.current = true;
            setTimeout(() => {
              if (completeGameRef.current) {
                completeGameRef.current();
              }
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
        gameTimerRef.current = null;
      }
    };
  }, [gameState.isActive, gameState.countdown]);

  // Handle input change with optimistic letter submissions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!gameState.isActive || gameState.countdown > 0 || gameState.isCompleting) return;

    const value = e.target.value;
    
    // Use functional state updates to get current values
    setLocalGameState(prev => {
      const currentWord = prev.gameWords[prev.currentWordIndex];
      
      if (!currentWord) return prev;

      const prevLength = prev.typedInput.length;
      const newLength = value.length;
      
      // Handle new letters being typed
      if (newLength > prevLength && newLength <= currentWord.length) {
        const newLetter = value[newLength - 1];
        const expectedLetter = currentWord[newLength - 1];
        
        // Only submit correct letters to blockchain
        if (newLetter === expectedLetter) {
          submitLetter(newLetter);
        }
      }
      
      // Check if word is completed
      if ((value.endsWith(' ') && value.trim() === currentWord) || value === currentWord) {
        const completedWord = value.endsWith(' ') ? value.trim() : value;
        
        console.log('🎯 Word completed!', { 
          completedWord, 
          currentIndex: prev.currentWordIndex, 
          nextIndex: prev.currentWordIndex + 1,
          totalWords: prev.gameWords.length 
        });
        
        // Complete word locally and on blockchain
        completeWord();
        
        // Move to next word
        const nextIndex = prev.currentWordIndex + 1;
        if (nextIndex < prev.gameWords.length) {
          return {
            ...prev,
            currentWordIndex: nextIndex,
            typedInput: '',
            wordsCompleted: [...prev.wordsCompleted, completedWord],
            totalLettersTyped: prev.totalLettersTyped + (newLength > prevLength ? 1 : 0),
          };
        } else {
          // No more words, but game continues until timer ends
          return {
            ...prev,
            typedInput: '',
            wordsCompleted: [...prev.wordsCompleted, completedWord],
            totalLettersTyped: prev.totalLettersTyped + (newLength > prevLength ? 1 : 0),
          };
        }
      }
      
      // Regular input update
      return {
        ...prev,
        typedInput: value,
        totalLettersTyped: prev.totalLettersTyped + (newLength > prevLength ? 1 : 0),
      };
    });
  }, [gameState.isActive, gameState.countdown, gameState.isCompleting, submitLetter, completeWord]);

  // Handle key press for better UX
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !gameState.isActive) {
      handleStartGame();
    }
    
    // Allow Enter or Space to complete word
    if ((e.key === 'Enter' || e.key === ' ') && gameState.isActive && gameState.countdown === 0 && !gameState.isCompleting) {
      setLocalGameState(prev => {
        const currentWord = prev.gameWords[prev.currentWordIndex];
        const trimmedInput = prev.typedInput.trim();
        
        if (trimmedInput === currentWord) {
          e.preventDefault();
          
          // Complete word
          completeWord();
          
          // Move to next word
          const nextIndex = prev.currentWordIndex + 1;
          if (nextIndex < prev.gameWords.length) {
            return {
              ...prev,
              currentWordIndex: nextIndex,
              typedInput: '',
              wordsCompleted: [...prev.wordsCompleted, trimmedInput],
            };
          } else {
            return {
              ...prev,
              typedInput: '',
              wordsCompleted: [...prev.wordsCompleted, trimmedInput],
            };
          }
        }
        
        return prev;
      });
    }
  }, [gameState.isActive, gameState.countdown, gameState.isCompleting, handleStartGame, completeWord]);



  // Reset game
  const handleResetGame = useCallback(() => {
    gameCompletedRef.current = false;
    resetGame();
    setLocalGameState({
      currentWordIndex: 0,
      typedInput: '',
      wordsCompleted: [],
      gameWords: [],
      totalLettersTyped: 0,
    });
    setTimeRemaining(GAME_DURATION);
    
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
  }, [resetGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, [cleanup]); // Empty dependency array since this should only run on mount/unmount

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  const getInputClassName = () => {
    if (!localGameState.typedInput) return 'typing-input';
    
    const currentWord = localGameState.gameWords[localGameState.currentWordIndex];
    const trimmedInput = localGameState.typedInput.trim();
    if (currentWord && currentWord.startsWith(trimmedInput)) {
      return 'typing-input correct';
    } else {
      return 'typing-input incorrect';
    }
  };

  const renderWordQueue = () => {
    const wordsToShow = 5;
    const startIndex = localGameState.currentWordIndex;
    const wordsQueue = localGameState.gameWords.slice(startIndex, startIndex + wordsToShow);
    
    return (
      <div className="word-queue">
        {wordsQueue.map((word, index) => {
          const isCurrentWord = index === 0;
          const input = isCurrentWord ? localGameState.typedInput.trim() : '';
          
          return (
            <div key={startIndex + index} className={`word-item ${isCurrentWord ? 'current' : 'upcoming'}`}>
              <div className="word-display">
                {word.split('').map((char, charIndex) => {
                  let className = 'char';
                  if (isCurrentWord && charIndex < input.length) {
                    className += input[charIndex] === char ? ' correct' : ' incorrect';
                  } else if (isCurrentWord && charIndex === input.length) {
                    className += ' cursor';
                  }
                  return (
                    <span key={charIndex} className={className}>
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Show countdown
  if (gameState.countdown > 0) {
    return (
      <div className="typing-game">
        <div className="game-countdown">
          <h2>Get Ready!</h2>
          <div className="countdown-number">{gameState.countdown}</div>
          <p>Starting game session on blockchain...</p>
          <div className="countdown-info">
            <p>✅ Game session transaction sent</p>
            <p>⏳ Waiting for confirmation...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show start screen
  if (!gameState.isActive) {
    return (
      <div className="typing-game">
        <div className="game-start">
          <h2>Ready to test blockchain speed?</h2>
          <p>Type as fast as you can. Each correct <strong>letter</strong> triggers a blockchain transaction!</p>
          <p>You have <strong>30 seconds</strong> to maximize your TPS (Transactions Per Second).</p>
          <p className="speed-note">Experience 200ms block times in real-time!</p>
          
          {!isConnected ? (
            <div className="connection-required">
              <p className="error">⚠️ Please connect your wallet to play</p>
            </div>
          ) : (
            <>
              <button onClick={handleStartGame} className="start-button">
                Start Game
              </button>
            </>
          )}
          
          {stats.total > 0 && (
            <div className="previous-stats">
              <h4>Previous Session Stats:</h4>
              <p>Total Transactions: {stats.total}</p>
              <p>Confirmed: {stats.confirmed} | Pending: {stats.pending} | Failed: {stats.failed}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show completing screen (waiting for transactions)
  if (timeRemaining === 0 && gameState.isCompleting) {
    return (
      <div className="typing-game">
        <div className="game-completing">
          <h2>Processing Results...</h2>
          <div className="completion-status">
            <div className="spinner">⏳</div>
            <p>Waiting for all blockchain transactions to complete</p>
            <div className="pending-info">
              <p>Pending Transactions: <strong>{pendingOps}</strong></p>
              <p>Confirmed: <strong>{stats.confirmed}</strong></p>
              <p>Failed: <strong>{stats.failed}</strong></p>
            </div>
            <p className="completion-note">
              Your final score will be displayed once all transactions are processed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show game ended screen (only when all transactions are complete)
  if (timeRemaining === 0 && !gameState.isCompleting) {
    const totalTx = gameState.localLetterCount + gameState.localWordCount;
    const tps = totalTx / GAME_DURATION;
    
    return (
      <div className="typing-game">
        <div className="game-end">
          <h2>Game Complete!</h2>
          <div className="final-stats">
            <p>Words Completed: <strong>{gameState.localWordCount}</strong></p>
            <p>Letters Typed: <strong>{gameState.localLetterCount}</strong></p>
            <p>Total Transactions: <strong>{totalTx}</strong></p>
            <p className="tps-highlight">
              Your TPS: <strong>{tps.toFixed(2)}</strong> transactions/second
            </p>
            <p>Blockchain Status:</p>
            <ul>
              <li>Pending: <strong>{pendingOps}</strong></li>
              <li>Confirmed: <strong>{stats.confirmed}</strong></li>
              <li>Failed: <strong>{stats.failed}</strong></li>
            </ul>
          </div>
          <div className="game-actions">
            <button onClick={handleStartGame} className="start-button">
              Play Again
            </button>
            <button onClick={handleResetGame} className="reset-button">
              Reset All
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show active game
  return (
    <div className="typing-game">
      <div className="game-header">
        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Time</span>
            <span className="stat-value">{formatTime(timeRemaining)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Words</span>
            <span className="stat-value">{gameState.localWordCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Letters</span>
            <span className="stat-value">{gameState.localLetterCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">TPS</span>
            <span className="stat-value">
              {gameState.localLetterCount > 0 ? 
                Math.round((gameState.localLetterCount + gameState.localWordCount) / (GAME_DURATION - timeRemaining) * 10) / 10 : 0}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Pending</span>
            <span className="stat-value pending">{pendingOps}</span>
          </div>
        </div>
      </div>

      <div className="game-area">
        <div className="word-queue-section">
          <h3>Type the highlighted word:</h3>
          {renderWordQueue()}
        </div>

        <div className="input-section">
          <input
            ref={inputRef}
            type="text"
            value={localGameState.typedInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={getInputClassName()}
            placeholder="Start typing..."
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {localGameState.wordsCompleted.length > 0 && (
          <div className="completed-words">
            <h4>Recently Completed:</h4>
            <div className="words-list">
              {localGameState.wordsCompleted.slice(-5).map((word, index) => (
                <span key={index} className="completed-word">
                  {word}
                </span>
              ))}
              {localGameState.wordsCompleted.length > 5 && (
                <span className="more-words">
                  +{localGameState.wordsCompleted.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default TypingGame;
