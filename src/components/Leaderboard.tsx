import React from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import './Leaderboard.css';

interface LeaderboardProps {
  onRefresh?: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onRefresh }) => {
  const { 
    leaderboard, 
    playerStats, 
    contractStats, 
    isLoading, 
    error, 
    refreshLeaderboard 
  } = useLeaderboard();

  const handleRefresh = () => {
    refreshLeaderboard();
    onRefresh?.();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${position}`;
    }
  };

  const calculateTPS = (bestLettersPerGame: number) => {
    // TPS = letters per 30-second game
    return (bestLettersPerGame / 30).toFixed(2);
  };

  if (error) {
    return (
      <div className="leaderboard">
        <div className="leaderboard-header">
          <h3>🏆 Leaderboard</h3>
          <button onClick={handleRefresh} className="refresh-btn">
            🔄 Retry
          </button>
        </div>
        <div className="error-state">
          <p>❌ Failed to load leaderboard</p>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h3>🏆 Global Leaderboard</h3>
        <button 
          onClick={handleRefresh} 
          className="refresh-btn"
          disabled={isLoading}
        >
          {isLoading ? '⏳' : '🔄'} Refresh
        </button>
      </div>



      {/* Contract Stats */}
      {contractStats && (
        <div className="contract-stats">
          <div className="stat-item">
            <span className="stat-label">Total Games</span>
            <span className="stat-value">{contractStats.totalGames.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Letters</span>
            <span className="stat-value">{contractStats.totalLetters.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Words</span>
            <span className="stat-value">{contractStats.totalWords.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Player Stats */}
      {playerStats && playerStats.gamesPlayed > 0 && (
        <div className="player-stats">
          <h4>📊 Your Stats</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{playerStats.gamesPlayed}</span>
              <span className="stat-label">Games Played</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{playerStats.totalLetters}</span>
              <span className="stat-label">Total Letters</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{playerStats.bestLettersPerGame}</span>
              <span className="stat-label">Best Game</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{calculateTPS(playerStats.bestLettersPerGame)}</span>
              <span className="stat-label">Best TPS</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {playerStats.leaderboardPosition > 0 ? `#${playerStats.leaderboardPosition}` : 'Unranked'}
              </span>
              <span className="stat-label">Global Rank</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="leaderboard-table">
        <h4>🎯 Top Players</h4>
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-state">
            <p>🎮 No games played yet!</p>
            <p>Be the first to set a record!</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            {leaderboard.map((entry) => (
              <div 
                key={entry.address} 
                className={`leaderboard-entry ${entry.isCurrentUser ? 'current-user' : ''}`}
              >
                <div className="rank">
                  <span className="rank-icon">{getRankIcon(entry.position)}</span>
                </div>
                <div className="player-info">
                  <span className="player-address">
                    {formatAddress(entry.address)}
                    {entry.isCurrentUser && <span className="you-badge">YOU</span>}
                  </span>
                </div>
                <div className="player-stats-summary">
                  <div className="stat">
                    <span className="stat-value">{entry.bestLettersPerGame}</span>
                    <span className="stat-label">Best Game</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">
                      {calculateTPS(entry.bestLettersPerGame)}
                    </span>
                    <span className="stat-label">TPS</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{entry.gamesPlayed}</span>
                    <span className="stat-label">Games</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="leaderboard-footer">
        <p className="update-note">
          📡 Data updates automatically after each game
        </p>
        <p className="blockchain-note">
          🔗 All scores verified on ZKsync blockchain
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
