import { Deployer } from "@matterlabs/hardhat-zksync";
import { Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as hre from "hardhat";

export default async function deployGamePaymaster(hre: HardhatRuntimeEnvironment) {
  console.log("🚀 Starting deployment of GamePaymaster contract...");

  // Get the private key from environment variables
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error("❌ Private key not found in environment variables");
  }

  // Get the game contract address
  const GAME_CONTRACT_ADDRESS = process.env.VITE_TYPING_GAME_CONTRACT_ADDRESS;
  if (!GAME_CONTRACT_ADDRESS) {
    throw new Error("❌ Game contract address not found. Deploy TypingSpeedGame first.");
  }

  // Initialize the wallet
  const wallet = new Wallet(PRIVATE_KEY);
  console.log(`📝 Deploying from address: ${wallet.address}`);
  console.log(`🎮 Game contract address: ${GAME_CONTRACT_ADDRESS}`);

  // Create deployer object and load the artifact of the contract we want to deploy
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("GamePaymaster");

  // Deploy the paymaster contract
  console.log("⏳ Deploying GamePaymaster contract...");
  const gamePaymaster = await deployer.deploy(artifact, [GAME_CONTRACT_ADDRESS]);

  // Wait for the deployment to be mined
  await gamePaymaster.waitForDeployment();

  const paymasterAddress = await gamePaymaster.getAddress();
  console.log(`✅ GamePaymaster deployed to: ${paymasterAddress}`);

  // Fund the paymaster with some ETH for gas sponsorship
  // SKIPPED

  // Verify the contract (optional, but recommended)
  // console.log("🔍 Verifying contract...");
  // try {
  //   await hre.run("verify:verify", {
  //     address: paymasterAddress,
  //     constructorArguments: [GAME_CONTRACT_ADDRESS],
  //   });
  //   console.log("✅ Contract verified successfully");
  // } catch (error) {
  //   console.log("⚠️  Contract verification failed:", error);
  // }

  // Get paymaster stats
  try {
    const [balance, totalSponsored, txCount] = await gamePaymaster.getStats();
    console.log("\n📊 Paymaster Statistics:");
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);
    console.log(`Total Sponsored: ${hre.ethers.formatEther(totalSponsored)} ETH`);
    console.log(`Transactions Sponsored: ${txCount}`);
  } catch (error) {
    console.log("⚠️  Could not fetch paymaster stats:", error);
  }

  // Display deployment summary
  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  console.log(`Contract: GamePaymaster`);
  console.log(`Address: ${paymasterAddress}`);
  console.log(`Game Contract: ${GAME_CONTRACT_ADDRESS}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${wallet.address}`);
  
  console.log("\n💡 Next steps:");
  console.log(`1. Add VITE_PAYMASTER_CONTRACT_ADDRESS=${paymasterAddress} to your .env file`);
  console.log(`2. Test the paymaster with game transactions`);
  console.log(`3. Monitor paymaster balance and refund as needed`);
  console.log(`4. Update frontend to use paymaster for gasless transactions`);

  return paymasterAddress;
}

// Allow script to be run directly
if (require.main === module) {
  deployGamePaymaster(hre)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}
