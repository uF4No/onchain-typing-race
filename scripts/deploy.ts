import { ethers } from "hardhat";
import * as hre from "hardhat";

async function main() {
  console.log("🚀 Starting deployment of TypingSpeedGame contract...");

  // Get the contract factory
  const TypingSpeedGame = await ethers.getContractFactory("TypingSpeedGame");
  
  // Deploy the contract
  console.log("⏳ Deploying TypingSpeedGame contract...");
  const typingSpeedGame = await TypingSpeedGame.deploy();

  // Wait for the deployment to be mined
  await typingSpeedGame.waitForDeployment();

  const contractAddress = await typingSpeedGame.getAddress();
  console.log(`✅ TypingSpeedGame deployed to: ${contractAddress}`);

  // Display deployment summary
  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  console.log(`Contract: TypingSpeedGame`);
  console.log(`Address: ${contractAddress}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log("\n💡 Next steps:");
  console.log(`1. Add VITE_TYPING_GAME_CONTRACT_ADDRESS=${contractAddress} to your .env file`);
  console.log(`2. Deploy the Paymaster contract`);
  console.log(`3. Update your frontend configuration`);

  await hre.run("verify:verify", {
    address: contractAddress
  })

  return contractAddress;
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
