import { Deployer } from "@matterlabs/hardhat-zksync";
import { Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as hre from "hardhat";

async function main() {
  console.log("🚀 Starting deployment of TypingSpeedGame contract...");

  // Get the private key from environment variables
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error("❌ Private key not found in environment variables");
  }

  // Initialize the wallet
  const wallet = new Wallet(PRIVATE_KEY);
  console.log(`📝 Deploying from address: ${wallet.address}`);

  // Create deployer object and load the artifact of the contract we want to deploy
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("TypingSpeedGame");

  // Deploy the contract
  console.log("⏳ Deploying TypingSpeedGame contract...");
  const typingSpeedGame = await deployer.deploy(artifact, []);

  // Wait for the deployment to be mined
  await typingSpeedGame.waitForDeployment();

  const contractAddress = await typingSpeedGame.getAddress();
  console.log(`✅ TypingSpeedGame deployed to: ${contractAddress}`);

  // Verify the contract (optional, but recommended)
  console.log("🔍 Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified successfully");
  } catch (error) {
    console.log("⚠️  Contract verification failed:", error);
  }

  // Display deployment summary
  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  console.log(`Contract: TypingSpeedGame`);
  console.log(`Address: ${contractAddress}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${wallet.address}`);
  
  console.log("\n💡 Next steps:");
  console.log(`1. Add VITE_TYPING_GAME_CONTRACT_ADDRESS=${contractAddress} to your .env file`);
  console.log(`2. Deploy the Paymaster contract`);
  console.log(`3. Update your frontend configuration`);

  return contractAddress;
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
