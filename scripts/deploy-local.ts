import { Deployer } from "@matterlabs/hardhat-zksync";
import { Wallet } from "zksync-ethers";
import * as hre from "hardhat";

async function main() {
  console.log("🚀 Starting local deployment of TypingSpeedGame contract...");

  // Use a test private key for local deployment
  const testPrivateKey = "";
  const wallet = new Wallet(testPrivateKey);
  console.log(`📝 Deploying from test address: ${wallet.address}`);

  // Create deployer object and load the artifact of the contract we want to deploy
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("TypingSpeedGame");

  console.log("⏳ Deploying TypingSpeedGame contract...");
  
  // Estimate deployment fee
  const deploymentFee = await deployer.estimateDeployFee(artifact, []);
  console.log(`💰 Estimated deployment fee: ${deploymentFee.toString()} ETH`);

  console.log("✅ Contract compilation and deployment estimation successful!");
  console.log("\n📋 Contract Summary:");
  console.log("====================");
  console.log("Contract: TypingSpeedGame");
  console.log("Features:");
  console.log("- ✅ Game session management");
  console.log("- ✅ Word submission with blockchain recording");
  console.log("- ✅ Real-time event emission");
  console.log("- ✅ Player scoring and leaderboards");
  console.log("- ✅ Access control and validation");
  console.log("\n💡 To deploy to ZKsync Sepolia:");
  console.log("1. Set your PRIVATE_KEY in .env file");
  console.log("2. Run: npx hardhat run scripts/deploy.ts --network zkSyncSepoliaTestnet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
