# Blockchain Speed Game

A typing speed test game that demonstrates ZKsync's 200ms block time capability through real-time blockchain interactions.

## Features

- 30-second typing speed test
- Each correct word triggers a blockchain transaction
- Real-time transaction and block monitoring
- ZKsync SSO authentication with passkeys
- Gasless transactions via paymaster
- Live performance metrics

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Blockchain**: ZKsync Sepolia Testnet
- **Smart Contracts**: Solidity with Hardhat
- **Web3 Library**: Viem
- **Authentication**: ZKsync SSO (Passkeys)

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Compile smart contracts:
   ```bash
   npm run compile
   ```

## Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions and constants
├── types/         # TypeScript type definitions
contracts/         # Smart contracts
scripts/          # Deployment scripts
```

## Smart Contracts

- **TypingSpeedGame.sol**: Main game contract for word submissions
- **Paymaster.sol**: Handles gasless transactions

## Deployment

1. Set up your private key in `.env`
2. Deploy contracts: `npm run deploy`
3. Update contract addresses in `.env`
4. Verify contracts: `npm run verify`
