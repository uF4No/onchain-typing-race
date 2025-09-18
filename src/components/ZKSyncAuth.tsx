import React, { useEffect } from 'react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import './ZKSyncAuth.css';

interface ZKSyncAuthProps {
  onAuthSuccess: (address: string, sessionKey: string) => void;
  onAuthError: (error: string) => void;
}

const ZKSyncAuth: React.FC<ZKSyncAuthProps> = ({ onAuthSuccess, onAuthError }) => {
  const { connectors, connect, status, error } = useConnect();
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();

  // Handle successful connection
  useEffect(() => {
    if (isConnected && address) {
      // Generate a session key for the authenticated user
      const sessionKey = `session_${Date.now()}`;
      onAuthSuccess(address, sessionKey);
    }
  }, [isConnected, address, onAuthSuccess]);

  // Handle connection errors
  useEffect(() => {
    if (error) {
      onAuthError(error.message);
    }
  }, [error, onAuthError]);

  const handleLogout = () => {
    disconnect();
  };

  if (isConnected && address) {
    return (
      <div className="auth-container authenticated">
        <div className="auth-success">
          <div className="auth-icon">✅</div>
          <h2>Authenticated Successfully</h2>
          <div className="auth-details">
            <p><strong>Address:</strong> {address.slice(0, 6)}...{address.slice(-4)}</p>
            <p><strong>Connector:</strong> {connector?.name || 'Unknown'}</p>
            <p><strong>Session:</strong> Active</p>
          </div>
          <button 
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">⌨️💨</div>
          <h1>Welcome to Onchain Typing Race</h1>
          <p>Experience 200ms block times through typing!</p>
        </div>

              <div className="game-preview">
            <h3>🎯 How It Works</h3>
            <div className="preview-demo">
              <div className="demo-typing">
                <div className="demo-word">
                  <span className="demo-char typed">h</span>
                  <span className="demo-char typed">e</span>
                  <span className="demo-char typed">l</span>
                  <span className="demo-char current">l</span>
                  <span className="demo-char">o</span>
                </div>
                <div className="demo-arrow">→</div>
                <div className="demo-transaction">
                  <span className="tx-icon">📝</span>
                  <span>Letter "l" → Blockchain</span>
                </div>
              </div>
              <div className="demo-stats">
                <div className="demo-stat">
                  <span className="stat-value">42</span>
                  <span className="stat-label">Letters</span>
                </div>
                <div className="demo-stat">
                  <span className="stat-value">1.4</span>
                  <span className="stat-label">TPS</span>
                </div>
                <div className="demo-stat">
                  <span className="stat-value">30s</span>
                  <span className="stat-label">Time</span>
                </div>
              </div>
            </div>
            <p className="preview-description">
              Type words as fast as you can! Each correct letter triggers a real blockchain transaction. 
              Experience ZKsync's 200ms block times in real-time.
            </p>
          </div>

        <div className="auth-content">
          <h2>Create an account to start</h2>

    

          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              <span>{error.message}</span>
            </div>
          )}

          <div className="connector-buttons">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                className="auth-button"
                onClick={() => connect({ connector })}
                disabled={status === 'pending'}
              >
                {status === 'pending' ? (
                  <>
                    <span className="loading-spinner"></span>
                    Connecting...
                  </>
                ) : (
                  <>
                    <span className="auth-button-icon">🔐</span>
                    Signup with ZKsync SSO
                  </>
                )}
              </button>
            ))}
          </div>


          <div className="auth-info">
            <p>
              <strong>About ZKsync:</strong><br />
              ZKsync offers fast, low-cost transactions with advanced security features. 
              Connect your wallet to experience 200ms block times!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZKSyncAuth;
