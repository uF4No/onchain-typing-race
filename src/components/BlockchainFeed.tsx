import React from 'react';
import type { GameTransaction } from '../types/game';
import './BlockchainFeed.css';

interface BlockchainFeedProps {
  isGameActive: boolean;
  transactions: GameTransaction[];
  onClearHistory?: () => void;
}

const BlockchainFeed: React.FC<BlockchainFeedProps> = ({ isGameActive, transactions, onClearHistory }) => {
  // Calculate stats
  const stats = {
    letters: transactions.filter(tx => tx.type === 'letter').length,
    pending: transactions.filter(tx => tx.status === 'pending' || tx.status === 'sent').length,
    confirmed: transactions.filter(tx => tx.status === 'confirmed').length,
    failed: transactions.filter(tx => tx.status === 'failed').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'sent':
        return '⏳';
      case 'confirmed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  return (
    <div className="blockchain-feed">
      <div className="feed-header">
        <h3>📊 Transaction Queue</h3>
        <div className="status-indicator">
          <span className={`status-dot ${isGameActive ? 'active' : 'inactive'}`}></span>
          <span>ZKsync Sepolia</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{stats.letters}</span>
          <span className="stat-label">Letters</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.confirmed}</span>
          <span className="stat-label">Confirmed</span>
        </div>
      </div>

      <div className="transaction-list">
        <div className="list-header">
          <h4>Transaction History ({transactions.length})</h4>
          {transactions.length > 0 && onClearHistory && (
            <button className="clear-btn" onClick={onClearHistory}>
              Clear
            </button>
          )}
        </div>
        
        <div className="transactions">
          {transactions.length === 0 ? (
            <div className="empty-message">
              {isGameActive ? 'Transactions will appear as you type!' : 'Start a game to see transactions!'}
            </div>
          ) : (
            transactions.slice().reverse().map((tx) => (
              <div key={tx.hash || tx.id || `${tx.type}-${tx.timestamp}`} className="transaction">
                <span className="tx-icon">{getStatusIcon(tx.status)}</span>
                <span className="tx-description">
                  {tx.type === 'letter' ? `"${tx.data}"` : 
                   tx.type === 'startGame' ? 'Game Start' : 
                   tx.type === 'completeGame' ? 'Game End' : 'Transaction'}
                </span>
                <span className={`tx-status ${tx.status}`}>
                  {tx.status === 'pending' || tx.status === 'sent' ? 'Pending' : 
                   tx.status === 'confirmed' ? 'Confirmed' : 'Failed'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {stats.pending > 0 && (
        <div className="processing-indicator">
          <div className="pulse-dot"></div>
          <span>Processing {stats.pending} transaction{stats.pending !== 1 ? 's' : ''}...</span>
        </div>
      )}
    </div>
  );
};

export default BlockchainFeed;
