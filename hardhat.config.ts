import { HardhatUserConfig } from "hardhat/config";
import "@matterlabs/hardhat-zksync";

require("dotenv").config();


const config: HardhatUserConfig = {
  zksolc: {
    version: "1.5.15",
    settings: {
      // find all available options in the official documentation
      // https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-solc.html#configuration
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    zkSyncSepoliaTestnet: {
      url: "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia",
      zksync: true,
      verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    zkVirtual:{
      url: `https://virtual.zksync-sepolia.eu.rpc.tenderly.co/d9c7c4e7-0bf1-446f-b2d0-599efd997275`,
      ethNetwork: 'sepolia',
      zksync: true,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],

    },
    hardhat: {
      zksync: false, // Disable ZKsync for local testing
    },
    zkSyncLocal: {
      url: "http://localhost:3050",
      ethNetwork: "http://localhost:8545",
      zksync: true,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  solidity: {
    version: "0.8.24",
  },
  mocha: {
    timeout: 40000,
  },
  paths: {
    tests: "./test",
  },
};

export default config;
