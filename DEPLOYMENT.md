# Deployment Instructions

## Smart Contract Status

✅ **TypingSpeedGame.sol** - Successfully compiled and ready for deployment

### Contract Features
- Game session management with unique session IDs
- Word submission with blockchain recording
- Real-time event emission for frontend integration
- Player scoring and best score tracking
- Access control and input validation
- Gas-optimized for frequent transactions

### Contract Functions
- `startGame()` - Initialize a new 30-second game session
- `submitWord(word, gameSession)` - Submit a correctly typed word
- `completeGame(finalScore, gameSession)` - Finalize game with score
- `getPlayerBestScore(player)` - Retrieve player's best score
- `getGameSessionWords(gameSession)` - Get all words from a session
- `getRecentWords(count)` - Get recent words for real-time feed

## Deployment Steps

### Prerequisites
1. Set up your private key in `.env`:
   ```
   PRIVATE_KEY=your_private_key_here
   ```

2. Ensure you have ZKsync Sepolia testnet ETH for deployment

### Deploy to ZKsync Sepolia

#### Step 1: Deploy Game Contract
```bash
# Compile contracts
npm run compile

# Deploy the game contract
npx hardhat run scripts/deploy.ts --network zkSyncSepoliaTestnet
```

#### Step 2: Deploy Paymaster Contract
```bash
# Add game contract address to .env
VITE_TYPING_GAME_CONTRACT_ADDRESS=0x...

# Deploy the paymaster contract
npx hardhat run scripts/deploy-paymaster.ts --network zkSyncSepoliaTestnet
```

### After Deployment
1. Copy both contract addresses from deployment output
2. Add to your `.env` file:
   ```
   VITE_TYPING_GAME_CONTRACT_ADDRESS=0x...
   VITE_PAYMASTER_CONTRACT_ADDRESS=0x...
   ```
3. The paymaster is automatically funded with 0.1 ETH during deployment

## Contract Events
The contract emits these events for frontend integration:
- `GameStarted(player, gameSession, timestamp)`
- `WordTyped(player, word, timestamp, gameSession, blockNumber)`
- `GameCompleted(player, score, gameSession, duration)`

## Testing
Run contract tests:
```bash
npx hardhat test
```

## Paymaster Management

### GamePaymaster Contract Features
✅ **Gasless Transactions** - Sponsors gas fees for game functions
✅ **Access Control** - Only sponsors approved game contract functions  
✅ **Fund Management** - Owner can fund, withdraw, and monitor balance
✅ **Transaction Validation** - Validates function calls and gas limits
✅ **Statistics Tracking** - Tracks sponsored transactions and costs

### Supported Functions
The paymaster sponsors these game contract functions:
- `startGame()` - Start a new typing game session
- `submitWord(string,uint256)` - Submit a correctly typed word
- `completeGame(uint256,uint256)` - Complete a game session

### Paymaster Management Commands
```bash
# Check paymaster status
npx hardhat run scripts/paymaster-utils.ts --network zkSyncSepoliaTestnet

# Fund paymaster with additional ETH
# (Add funding logic to paymaster-utils.ts)

# Monitor paymaster balance
# (Set up monitoring alerts for low balance)
```

### Configuration
- **Max Gas Per Transaction**: 1,000,000 gas
- **Initial Funding**: 0.1 ETH
- **Owner**: Deployer address
- **Game Contract**: TypingSpeedGame contract address

### Security Features
- Only sponsors transactions to the designated game contract
- Validates function selectors to prevent abuse
- Owner-only administrative functions
- Gas limit protection to prevent expensive transactions
