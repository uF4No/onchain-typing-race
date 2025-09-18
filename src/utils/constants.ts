// Game Configuration
export const GAME_DURATION = 30; // seconds (as per requirements)
export const WORDS_PER_GAME = 50; // maximum words to show

// ZKsync Configuration
export const ZKSYNC_SEPOLIA_CHAIN_ID = 300;
export const ZKSYNC_SEPOLIA_RPC_URL = import.meta.env.VITE_ZKSYNC_SEPOLIA_RPC_URL || 'https://sepolia.era.zksync.dev';

// Contract Addresses (will be set after deployment)
export const TYPING_GAME_CONTRACT_ADDRESS = import.meta.env.VITE_TYPING_GAME_CONTRACT_ADDRESS as `0x${string}`;
export const PAYMASTER_CONTRACT_ADDRESS = import.meta.env.VITE_PAYMASTER_CONTRACT_ADDRESS as `0x${string}`;

// Sample words for the typing game
export const SAMPLE_WORDS = [
  'blockchain', 'transaction', 'speed', 'fast', 'quick', 'type', 'word', 'game',
  'zksync', 'ethereum', 'smart', 'contract', 'web3', 'crypto', 'digital',
  'network', 'protocol', 'consensus', 'validator', 'block', 'hash', 'proof',
  'decentralized', 'distributed', 'immutable', 'transparent', 'secure',
  'scalable', 'efficient', 'innovative', 'technology', 'future', 'finance',
  'defi', 'nft', 'token', 'wallet', 'address', 'signature', 'verification',
  'confirmation', 'pending', 'success', 'error', 'retry', 'connect', 'deploy'
];
