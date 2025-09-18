import React from 'react';
import type { GameResults } from '../types/game';
import './GameResults.css';

interface GameResultsProps {
  results: GameResults;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
  userAddress?: string;
}

const GameResultsComponent: React.FC<GameResultsProps> = ({ 
  results, 
  onPlayAgain, 
  onViewLeaderboard,
  userAddress
}) => {
  return (
    <div className="game-results">
      <div className="results-header">
        <h2>🎉 Game Complete!</h2>
        <p>Your blockchain typing performance:</p>
      </div>

      <div className="results-grid">
        <div className="result-card primary">
          <span className="result-number">{results.totalLetters}</span>
          <span className="result-label">Letters Typed</span>
        </div>
        <div className="result-card primary">
          <span className="result-number">{results.totalWords}</span>
          <span className="result-label">Words Completed</span>
        </div>
        <div className="result-card highlight">
          <span className="result-number">{results.tps.toFixed(2)}</span>
          <span className="result-label">TPS (Transactions/sec)</span>
        </div>
        <div className="result-card highlight">
          <span className="result-number">{results.wpm.toFixed(0)}</span>
          <span className="result-label">WPM (Words/min)</span>
        </div>
        <div className="result-card secondary">
          <span className="result-number">{results.totalTransactions}</span>
          <span className="result-label">Total Blockchain Txs</span>
        </div>
        <div className="result-card secondary">
          <span className="result-number">{results.gameTime}s</span>
          <span className="result-label">Game Duration</span>
        </div>
      </div>

      <div className="results-achievements">
        <div className="">
          <span className="achievement-icon">🔗</span>
          {userAddress ? (
            <a 
              href={`https://sepolia.explorer.zksync.io/address/${userAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
            >
              See all your transactions on the explorer
            </a>
          ) : (
            <span className="achievement-text">All transactions confirmed on ZKsync!</span>
          )}
        </div>
      </div>

      <div className="results-actions">
        <button 
          className="play-again-btn primary"
          onClick={onPlayAgain}
        >
          🎮 Play Again
        </button>
        <button 
          className="leaderboard-btn secondary"
          onClick={onViewLeaderboard}
        >
          🏆 View Leaderboard
        </button>
      </div>
    </div>
  );
};

export default GameResultsComponent;
