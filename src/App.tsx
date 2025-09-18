import { useState, useEffect, useRef } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import TypingGame from './components/TypingGame'
import BlockchainFeed from './components/BlockchainFeed'
import ZKSyncAuth from './components/ZKSyncAuth'
import GameResultsComponent from './components/GameResults'
import Leaderboard from './components/Leaderboard'
import type { GameResults, GameTransaction } from './types/game'
import './App.css'

type ViewMode = 'game' | 'results' | 'leaderboard';

function App() {
  const [isGameActive, setIsGameActive] = useState(false)
  const [transactions, setTransactions] = useState<GameTransaction[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('game') // Default to game view
  const [copySuccess, setCopySuccess] = useState(false)
  const [lastGameResults, setLastGameResults] = useState<GameResults | null>(null)
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleTransactionUpdate = (newTransactions: GameTransaction[]) => {
    setTransactions(newTransactions)
  }

  const handleGameComplete = (results: GameResults) => {
    setLastGameResults(results)
    // Switch to results view to show inline results
    setViewMode('results')
  }

  const handleGameStart = () => {
    // Clear previous results when starting a new game
    setLastGameResults(null)
    // Switch back to game view
    setViewMode('game')
  }

  const handleClearHistory = () => {
    setTransactions([])
    // The TypingGame component will handle clearing its internal state
  }

  const handleAuthSuccess = (address: string, sessionKey: string) => {
    console.log('Authentication successful:', { address, sessionKey })
    // Authentication state is now managed by wagmi
  }

  const handleAuthError = (error: string) => {
    console.error('Authentication error:', error)
    // Could show a toast notification here
  }



  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000) // Reset after 2 seconds
      } catch (err) {
        console.error('Failed to copy address:', err)
      }
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  // Show authentication screen if not authenticated
  if (!isConnected) {
    return (
      <ZKSyncAuth 
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
      />
    )
  }

  // Show the game once authenticated
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>⚡ Onchain Type Race</h1>
            <p>Experience 200ms block times through typing!</p>
          </div>
          <div className="header-auth">
            <div className="nav-buttons">
              <button 
                onClick={() => setViewMode('game')}
                className={`nav-button ${viewMode === 'game' ? 'active' : ''}`}
              >
                🎮 Game
              </button>
              
              <button 
                onClick={() => setViewMode('leaderboard')}
                className={`nav-button ${viewMode === 'leaderboard' ? 'active' : ''}`}
              >
                🏆 Leaderboard
              </button>
            </div>
            
            <div className="account-dropdown" ref={dropdownRef}>
              <div className="auth-status">
                <span className="auth-indicator">🟢</span>
                <button 
                  className="auth-text address-button"
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  title="Account menu"
                >
                  {copySuccess ? '✅ Copied!' : `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                  <span className="dropdown-arrow">▼</span>
                </button>
              </div>
              
              {showAccountDropdown && (
                <div className="dropdown-menu">
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      handleCopyAddress()
                      setShowAccountDropdown(false)
                    }}
                  >
                    📋 Copy Address
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      handleDisconnect()
                      setShowAccountDropdown(false)
                    }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="app-main">

        
        {viewMode === 'results' && lastGameResults && (
          <div className="results-view">
            <GameResultsComponent 
              results={lastGameResults}
              onPlayAgain={() => setViewMode('game')}
              onViewLeaderboard={() => setViewMode('leaderboard')}
              userAddress={address}
            />
          </div>
        )}

        {viewMode === 'leaderboard' && (
          <div className="leaderboard-view">
            <Leaderboard />
          </div>
        )}
        
        {viewMode === 'game' && (
          <div className="game-view">
            <div className="game-container">
              <TypingGame 
                isGameActive={isGameActive}
                onGameStateChange={setIsGameActive}
                onTransactionUpdate={handleTransactionUpdate}
                onClearHistory={handleClearHistory}
                onGameComplete={handleGameComplete}
                onGameStart={handleGameStart}
                userAddress={address || null}
                sessionKey={null}
              />
            </div>
            
            <div className="">
              <BlockchainFeed 
                isGameActive={isGameActive} 
                transactions={transactions}
                onClearHistory={handleClearHistory}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
