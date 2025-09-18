import { Wallet, Provider } from "zksync-ethers";
import { ethers } from "ethers";

/**
 * Utility functions for managing the GamePaymaster contract
 */

export interface PaymasterStats {
  balance: string;
  totalSponsored: string;
  transactionsSponsored: number;
  maxGasPerTransaction: number;
}

export class PaymasterManager {
  private wallet: Wallet;
  private paymasterAddress: string;
  private paymasterContract: any;

  constructor(privateKey: string, paymasterAddress: string, providerUrl: string) {
    const provider = new Provider(providerUrl);
    this.wallet = new Wallet(privateKey, provider);
    this.paymasterAddress = paymasterAddress;
    
    // ABI for the paymaster contract (minimal interface)
    const paymasterABI = [
      "function getStats() external view returns (uint256 balance, uint256 totalSponsored, uint256 txCount)",
      "function maxGasPerTransaction() external view returns (uint256)",
      "function fund() external payable",
      "function withdraw(uint256 amount) external",
      "function wouldSponsor(address to, uint256 gasLimit, bytes calldata data) external view returns (bool sponsored, string memory reason)",
      "function owner() external view returns (address)",
      "function gameContract() external view returns (address)"
    ];
    
    this.paymasterContract = new ethers.Contract(paymasterAddress, paymasterABI, this.wallet);
  }

  /**
   * Get paymaster statistics
   */
  async getStats(): Promise<PaymasterStats> {
    const [balance, totalSponsored, txCount] = await this.paymasterContract.getStats();
    const maxGas = await this.paymasterContract.maxGasPerTransaction();
    
    return {
      balance: ethers.formatEther(balance),
      totalSponsored: ethers.formatEther(totalSponsored),
      transactionsSponsored: Number(txCount),
      maxGasPerTransaction: Number(maxGas)
    };
  }

  /**
   * Fund the paymaster with ETH
   */
  async fund(amountInEth: string): Promise<string> {
    const tx = await this.paymasterContract.fund({
      value: ethers.parseEther(amountInEth)
    });
    await tx.wait();
    return tx.hash;
  }

  /**
   * Withdraw ETH from the paymaster
   */
  async withdraw(amountInEth: string): Promise<string> {
    const amount = amountInEth === "all" ? 0 : ethers.parseEther(amountInEth);
    const tx = await this.paymasterContract.withdraw(amount);
    await tx.wait();
    return tx.hash;
  }

  /**
   * Check if a transaction would be sponsored
   */
  async wouldSponsor(to: string, gasLimit: number, data: string): Promise<{sponsored: boolean, reason: string}> {
    const [sponsored, reason] = await this.paymasterContract.wouldSponsor(to, gasLimit, data);
    return { sponsored, reason };
  }

  /**
   * Get paymaster configuration
   */
  async getConfig(): Promise<{owner: string, gameContract: string}> {
    const [owner, gameContract] = await Promise.all([
      this.paymasterContract.owner(),
      this.paymasterContract.gameContract()
    ]);
    
    return { owner, gameContract };
  }

  /**
   * Monitor paymaster balance and alert if low
   */
  async checkBalance(minBalanceEth: number = 0.01): Promise<{isLow: boolean, balance: string}> {
    const stats = await this.getStats();
    const balance = parseFloat(stats.balance);
    
    return {
      isLow: balance < minBalanceEth,
      balance: stats.balance
    };
  }
}

// CLI utility functions
export async function displayPaymasterInfo(manager: PaymasterManager) {
  console.log("📊 Paymaster Information");
  console.log("========================");
  
  try {
    const stats = await manager.getStats();
    const config = await manager.getConfig();
    
    console.log(`Balance: ${stats.balance} ETH`);
    console.log(`Total Sponsored: ${stats.totalSponsored} ETH`);
    console.log(`Transactions Sponsored: ${stats.transactionsSponsored}`);
    console.log(`Max Gas Per Transaction: ${stats.maxGasPerTransaction.toLocaleString()}`);
    console.log(`Owner: ${config.owner}`);
    console.log(`Game Contract: ${config.gameContract}`);
    
    const balanceCheck = await manager.checkBalance();
    if (balanceCheck.isLow) {
      console.log("⚠️  WARNING: Paymaster balance is low!");
    }
    
  } catch (error) {
    console.error("❌ Error fetching paymaster info:", error);
  }
}

// Example usage script
async function main() {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const PAYMASTER_ADDRESS = process.env.VITE_PAYMASTER_CONTRACT_ADDRESS;
  const RPC_URL = process.env.VITE_ZKSYNC_SEPOLIA_RPC_URL || "https://sepolia.era.zksync.dev";
  
  if (!PRIVATE_KEY || !PAYMASTER_ADDRESS) {
    console.error("❌ Missing required environment variables");
    process.exit(1);
  }
  
  const manager = new PaymasterManager(PRIVATE_KEY, PAYMASTER_ADDRESS, RPC_URL);
  await displayPaymasterInfo(manager);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
