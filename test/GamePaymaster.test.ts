import { expect } from "chai";
import { Wallet } from "zksync-ethers";
import { Deployer } from "@matterlabs/hardhat-zksync";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as hre from "hardhat";

describe.skip("GamePaymaster", function () {
  let deployer: Deployer;
  let gamePaymaster: any;
  let typingSpeedGame: any;
  let wallet: Wallet;
  let gameContractAddress: string;

  before(async function () {
    // Use a test private key
    const testPrivateKey = "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
    wallet = new Wallet(testPrivateKey);
    deployer = new Deployer(hre, wallet);

    // Deploy the game contract first
    const gameArtifact = await deployer.loadArtifact("TypingSpeedGame");
    typingSpeedGame = await deployer.deploy(gameArtifact, []);
    await typingSpeedGame.waitForDeployment();
    gameContractAddress = await typingSpeedGame.getAddress();

    // Deploy the paymaster contract
    const paymasterArtifact = await deployer.loadArtifact("GamePaymaster");
    gamePaymaster = await deployer.deploy(paymasterArtifact, [gameContractAddress]);
    await gamePaymaster.waitForDeployment();

    // Fund the paymaster
    const fundingAmount = hre.ethers.parseEther("0.1");
    await wallet.sendTransaction({
      to: await gamePaymaster.getAddress(),
      value: fundingAmount,
    });
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const owner = await gamePaymaster.owner();
      expect(owner).to.equal(wallet.address);
    });

    it("Should set the correct game contract", async function () {
      const gameContract = await gamePaymaster.gameContract();
      expect(gameContract).to.equal(gameContractAddress);
    });

    it("Should have initial funding", async function () {
      const [balance] = await gamePaymaster.getStats();
      expect(balance).to.be.gt(0);
    });
  });

  describe("Transaction Sponsorship Validation", function () {
    it("Should validate game contract transactions", async function () {
      const startGameData = typingSpeedGame.interface.encodeFunctionData("startGame", []);
      
      const [sponsored, reason] = await gamePaymaster.wouldSponsor(
        gameContractAddress,
        500000, // gas limit
        startGameData
      );
      
      expect(sponsored).to.be.true;
      expect(reason).to.equal("");
    });

    it("Should reject transactions to wrong contract", async function () {
      const startGameData = typingSpeedGame.interface.encodeFunctionData("startGame", []);
      
      const [sponsored, reason] = await gamePaymaster.wouldSponsor(
        wallet.address, // wrong address
        500000,
        startGameData
      );
      
      expect(sponsored).to.be.false;
      expect(reason).to.equal("Not game contract");
    });

    it("Should reject transactions with high gas limit", async function () {
      const startGameData = typingSpeedGame.interface.encodeFunctionData("startGame", []);
      
      const [sponsored, reason] = await gamePaymaster.wouldSponsor(
        gameContractAddress,
        2000000, // too high
        startGameData
      );
      
      expect(sponsored).to.be.false;
      expect(reason).to.equal("Gas limit too high");
    });

    it("Should reject unsupported functions", async function () {
      // Create data for an unsupported function (using transfer as example)
      const unsupportedData = "0xa9059cbb"; // transfer function selector
      
      const [sponsored, reason] = await gamePaymaster.wouldSponsor(
        gameContractAddress,
        500000,
        unsupportedData + "0".repeat(64) // pad with zeros
      );
      
      expect(sponsored).to.be.false;
      expect(reason).to.equal("Function not sponsored");
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update game contract", async function () {
      const newGameAddress = "0x1234567890123456789012345678901234567890";
      
      await gamePaymaster.updateGameContract(newGameAddress);
      
      const updatedGameContract = await gamePaymaster.gameContract();
      expect(updatedGameContract).to.equal(newGameAddress);
      
      // Revert back for other tests
      await gamePaymaster.updateGameContract(gameContractAddress);
    });

    it("Should allow owner to update max gas", async function () {
      const newMaxGas = 2000000;
      
      await gamePaymaster.updateMaxGas(newMaxGas);
      
      const updatedMaxGas = await gamePaymaster.maxGasPerTransaction();
      expect(updatedMaxGas).to.equal(newMaxGas);
      
      // Revert back for other tests
      await gamePaymaster.updateMaxGas(1000000);
    });

    it("Should allow owner to withdraw funds", async function () {
      const initialBalance = await hre.ethers.provider.getBalance(wallet.address);
      const withdrawAmount = hre.ethers.parseEther("0.01");
      
      await gamePaymaster.withdraw(withdrawAmount);
      
      const finalBalance = await hre.ethers.provider.getBalance(wallet.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should not allow non-owner to call owner functions", async function () {
      // Create another wallet
      const otherWallet = Wallet.createRandom();
      const otherPaymaster = gamePaymaster.connect(otherWallet);
      
      try {
        await otherPaymaster.updateMaxGas(500000);
        expect.fail("Expected transaction to revert");
      } catch (error: any) {
        expect(error.message).to.include("Only owner can call this function");
      }
    });
  });

  describe("Statistics", function () {
    it("Should track paymaster statistics", async function () {
      const [balance, totalSponsored, txCount] = await gamePaymaster.getStats();
      
      expect(balance).to.be.gt(0);
      expect(totalSponsored).to.be.gte(0);
      expect(txCount).to.be.gte(0);
    });
  });

  describe("Funding", function () {
    it("Should accept ETH deposits via receive function", async function () {
      const initialBalance = await hre.ethers.provider.getBalance(await gamePaymaster.getAddress());
      const depositAmount = hre.ethers.parseEther("0.01");
      
      await wallet.sendTransaction({
        to: await gamePaymaster.getAddress(),
        value: depositAmount,
      });
      
      const finalBalance = await hre.ethers.provider.getBalance(await gamePaymaster.getAddress());
      expect(finalBalance).to.equal(initialBalance + depositAmount);
    });

    it("Should allow owner to fund via fund function", async function () {
      const initialBalance = await hre.ethers.provider.getBalance(await gamePaymaster.getAddress());
      const fundAmount = hre.ethers.parseEther("0.01");
      
      await gamePaymaster.fund({ value: fundAmount });
      
      const finalBalance = await hre.ethers.provider.getBalance(await gamePaymaster.getAddress());
      expect(finalBalance).to.equal(initialBalance + fundAmount);
    });
  });
});
