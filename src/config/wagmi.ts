import { http, createConfig } from 'wagmi'
import { zksyncSepoliaTestnet } from 'wagmi/chains'
import { callPolicy, zksyncSsoConnector } from 'zksync-sso/connector'
import {parseEther} from 'viem'

import {typing_game_abi} from './abis'

export const config = createConfig({
  chains: [zksyncSepoliaTestnet],
  
  connectors: [
    // ZKsync SSO connector for biometric authentication
    zksyncSsoConnector({
      metadata: {
        name: 'Onchain Typing Race',
        icon: `https://code.zksync.io/_ipx/w_240&q_90/logos/zksync-icon.svg`
      },
      // Session configuration for gasless transactions
      session: {
        expiry: '1 hour', // 1 hour session
        feeLimit: parseEther('0.1'), // Maximum ETH that can be spent on gas
        // Allow calls to specific contracts
        contractCalls: [
          callPolicy({
            address: '0xcfBB4e9Ecb15F34B2eD38E79bE9739f64609C481', // Typing game
            abi: typing_game_abi,
            functionName: 'startGame'
          }),
          callPolicy({
            address: '0xcfBB4e9Ecb15F34B2eD38E79bE9739f64609C481', //   Typing game
            abi: typing_game_abi,
            functionName: 'submitLetter'
          }),callPolicy({
            address: '0xcfBB4e9Ecb15F34B2eD38E79bE9739f64609C481', // Typing game
            abi: typing_game_abi,
            functionName: 'completeGame'
          }),
          

        ]
       
      },
    }),
  ],
  transports: {
    [zksyncSepoliaTestnet.id]: http('https://sepolia.era.zksync.dev'),
  },
  // Disable auto-connection to prevent MetaMask from connecting automatically
  ssr: false,
  multiInjectedProviderDiscovery: false,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
