import { expect } from "chai";
import { Wallet, Signer } from "zksync-ethers";
import { Deployer } from "@matterlabs/hardhat-zksync";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as hre from "hardhat";

describe("TypingSpeedGame", function () {
  let deployer: Deployer;
  let typingSpeedGame: any;
  let wallet: Wallet;
  let a, b: Signer;

  before(async function () {
    // Use a test private key (this should be a test key, not a real one)
    [a, b] = await hre.ethers.getSigners()
    console.log(a)
    // const testPrivateKey = "";
    // wallet = new Wallet(testPrivateKey);
    // deployer = new Deployer(hre, a);

    // const artifact = await deployer.loadArtifact();
    typingSpeedGame = await hre.ethers.deployContract("TypingSpeedGame", []);
    const res = await typingSpeedGame.waitForDeployment();
    console.log('res :>> ', res.address);
  });

  describe("Game Session Management", function () {
    it("Should start a new game session", async function () {
      const tx = await typingSpeedGame.startGame();
      const receipt = await tx.wait();
      console.log('receipt :>> ', receipt);

      // Check that GameStarted event was emitted
      const gameStartedEvent = receipt.logs.find((log: any) => 
        log.fragment && log.fragment.name === "GameStarted"
      );
      expect(gameStartedEvent).to.not.be.undefined;

      // Check that current game session is 1
      const currentSession = await typingSpeedGame.currentGameSession();
      expect(currentSession).to.equal(1n);
    });

    it("Should submit words during a game session", async function () {
      const gameSession = 1;
      const word = "blockchain";

      const tx = await typingSpeedGame.submitWord(word, gameSession);
      const receipt = await tx.wait();

      // Check that WordTyped event was emitted
      const wordTypedEvent = receipt.logs.find((log: any) => 
        log.fragment && log.fragment.name === "WordTyped"
      );
      expect(wordTypedEvent).to.not.be.undefined;

      // Check word count for the session
      const wordCount = await typingSpeedGame.getGameSessionWordCount(gameSession);
      expect(wordCount).to.equal(1n);
    });

    it("Should complete a game session", async function () {
      const gameSession = 1;
      const finalScore = 5;

      const tx = await typingSpeedGame.completeGame(finalScore, gameSession);
      const receipt = await tx.wait();

      // Check that GameCompleted event was emitted
      const gameCompletedEvent = receipt.logs.find((log: any) => 
        log.fragment && log.fragment.name === "GameCompleted"
      );
      expect(gameCompletedEvent).to.not.be.undefined;

      // Check that the game session is marked as completed
      const session = await typingSpeedGame.getGameSession(gameSession);
      expect(session.completed).to.be.true;
      expect(session.finalScore).to.equal(finalScore);
    });

    it("Should update player's best score", async function () {
      const playerBestScore = await typingSpeedGame.getPlayerBestScore(deployer.address);
      expect(playerBestScore).to.equal(5n);
    });
  });

  describe("Data Retrieval", function () {
    it("Should retrieve game session words", async function () {
      const gameSession = 1;
      const words = await typingSpeedGame.getGameSessionWords(gameSession);
      expect(words.length).to.equal(1);
      expect(words[0].word).to.equal("blockchain");
    });

    it("Should retrieve recent words", async function () {
      const recentWords = await typingSpeedGame.getRecentWords(10);
      expect(recentWords.length).to.equal(1);
      expect(recentWords[0].word).to.equal("blockchain");
    });

    it("Should retrieve contract statistics", async function () {
      const [totalWords, totalGames, currentSession] = await typingSpeedGame.getContractStats();
      expect(totalWords).to.equal(1n);
      expect(totalGames).to.equal(1n);
      expect(currentSession).to.equal(1n);
    });
  });

  describe("Access Control", function () {
    it("Should not allow submitting words to invalid game session", async function () {
      try {
        await typingSpeedGame.submitWord("test", 999);
        expect.fail("Expected transaction to revert");
      } catch (error: any) {
        expect(error.message).to.include("Invalid game session");
      }
    });

    it("Should not allow empty words", async function () {
      // Start a new game first
      await typingSpeedGame.startGame();
      const currentSession = await typingSpeedGame.currentGameSession();

      try {
        await typingSpeedGame.submitWord("", currentSession);
        expect.fail("Expected transaction to revert");
      } catch (error: any) {
        expect(error.message).to.include("Word cannot be empty");
      }
    });

    it("Should not allow completing game twice", async function () {
      const currentSession = await typingSpeedGame.currentGameSession();
      
      // Complete the game once
      await typingSpeedGame.completeGame(3, currentSession);
      
      // Try to complete again
      try {
        await typingSpeedGame.completeGame(5, currentSession);
        expect.fail("Expected transaction to revert");
      } catch (error: any) {
        expect(error.message).to.include("Game already completed");
      }
    });
  });
});
