// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPaymaster, ExecutionResult, PAYMASTER_VALIDATION_SUCCESS_MAGIC} from "@matterlabs/zksync-contracts/contracts/system-contracts/interfaces/IPaymaster.sol";
import {TransactionHelper, Transaction} from "@matterlabs/zksync-contracts/contracts/system-contracts/libraries/TransactionHelper.sol";

import "@matterlabs/zksync-contracts/contracts/system-contracts/Constants.sol";

/**
 * @title GamePaymaster
 * @dev A paymaster contract that sponsors gas fees for the typing speed game
 * This paymaster allows users to play the game without paying gas fees
 */
contract GamePaymaster is IPaymaster {
    // The owner of the paymaster (can withdraw funds and manage settings)
    address public owner;

    // The typing speed game contract address that this paymaster sponsors
    address public gameContract;

    // Maximum gas fee this paymaster will sponsor per transaction
    uint256 public maxGasPerTransaction;

    // Total amount of gas fees sponsored
    uint256 public totalGasSponsored;

    // Number of transactions sponsored
    uint256 public transactionsSponsored;

    // Events
    event TransactionSponsored(
        address indexed user,
        uint256 gasUsed,
        uint256 gasPrice
    );
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event GameContractUpdated(
        address indexed oldContract,
        address indexed newContract
    );
    event MaxGasUpdated(uint256 oldMax, uint256 newMax);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyBootloader() {
        require(
            msg.sender == BOOTLOADER_FORMAL_ADDRESS,
            "Only bootloader can call this method"
        );
        _;
    }

    constructor(address _gameContract) {
        owner = msg.sender;
        gameContract = _gameContract;
        maxGasPerTransaction = 1000000; // 1M gas limit per transaction
    }

    /**
     * @dev Validates whether the paymaster should sponsor the transaction
     * @param _transaction The transaction data
     * @return magic The validation result magic number
     * @return context Additional context data (unused in this implementation)
     */
    function validateAndPayForPaymasterTransaction(
        bytes32,
        bytes32,
        Transaction calldata _transaction
    )
        external
        payable
        onlyBootloader
        returns (bytes4 magic, bytes memory context)
    {
        // By default we consider the transaction as accepted
        magic = PAYMASTER_VALIDATION_SUCCESS_MAGIC;

        // Check if the transaction is calling our game contract
        require(
            _transaction.to == uint256(uint160(gameContract)),
            "Transaction not for game contract"
        );

        // Extract the function selector to ensure it's a game function
        bytes4 selector = bytes4(_transaction.data[0:4]);
        require(
            selector == bytes4(keccak256("startGame()")) ||
                selector == bytes4(keccak256("submitLetter(bytes1,uint256)")) ||
                selector ==
                bytes4(keccak256("completeGame(uint256,uint256,uint256)")),
            "Function not sponsored"
        );

        // Calculate the required ETH to pay for the transaction
        uint256 requiredETH = _transaction.gasLimit * _transaction.maxFeePerGas;

        // Check if paymaster has enough balance
        require(
            address(this).balance >= requiredETH,
            "Paymaster balance too low"
        );

        // Pay for the transaction
        (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{
            value: requiredETH
        }("");
        require(success, "Failed to transfer funds to bootloader");

        // Update statistics
        totalGasSponsored += requiredETH;
        transactionsSponsored++;

        emit TransactionSponsored(
            address(uint160(_transaction.from)),
            _transaction.gasLimit,
            _transaction.maxFeePerGas
        );
    }

    /**
     * @dev Called after transaction execution (not used in this implementation)
     */
    function postTransaction(
        bytes calldata _context,
        Transaction calldata _transaction,
        bytes32,
        bytes32,
        ExecutionResult _txResult,
        uint256 _maxRefundedGas
    ) external payable override onlyBootloader {
        // This paymaster doesn't implement any post-transaction logic
        // In a more advanced implementation, you could refund unused gas here
    }

    /**
     * @dev Allows the owner to withdraw funds from the paymaster
     * @param _amount Amount to withdraw (0 = withdraw all)
     */
    function withdraw(uint256 _amount) external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        uint256 amountToWithdraw = _amount == 0 ? balance : _amount;
        require(amountToWithdraw <= balance, "Insufficient balance");

        (bool success, ) = payable(owner).call{value: amountToWithdraw}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(owner, amountToWithdraw);
    }

    /**
     * @dev Updates the game contract address that this paymaster sponsors
     * @param _newGameContract New game contract address
     */
    function updateGameContract(address _newGameContract) external onlyOwner {
        require(_newGameContract != address(0), "Invalid contract address");

        address oldContract = gameContract;
        gameContract = _newGameContract;

        emit GameContractUpdated(oldContract, _newGameContract);
    }

    /**
     * @dev Updates the maximum gas per transaction
     * @param _newMaxGas New maximum gas limit
     */
    function updateMaxGas(uint256 _newMaxGas) external onlyOwner {
        require(_newMaxGas > 0, "Max gas must be greater than 0");

        uint256 oldMax = maxGasPerTransaction;
        maxGasPerTransaction = _newMaxGas;

        emit MaxGasUpdated(oldMax, _newMaxGas);
    }

    /**
     * @dev Allows the owner to fund the paymaster
     */
    function fund() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH to fund");
    }

    /**
     * @dev Get paymaster statistics
     * @return balance Current ETH balance
     * @return totalSponsored Total gas fees sponsored
     * @return txCount Number of transactions sponsored
     */
    function getStats()
        external
        view
        returns (uint256 balance, uint256 totalSponsored, uint256 txCount)
    {
        return (
            address(this).balance,
            totalGasSponsored,
            transactionsSponsored
        );
    }

    /**
     * @dev Check if a transaction would be sponsored
     * @param to Transaction recipient
     * @param gasLimit Gas limit of the transaction
     * @param data Transaction data
     * @return sponsored Whether the transaction would be sponsored
     * @return reason Reason if not sponsored
     */
    function wouldSponsor(
        address to,
        uint256 gasLimit,
        bytes calldata data
    ) external view returns (bool sponsored, string memory reason) {
        if (to != gameContract) {
            return (false, "Not game contract");
        }

        if (gasLimit > maxGasPerTransaction) {
            return (false, "Gas limit too high");
        }

        if (data.length < 4) {
            return (false, "Invalid transaction data");
        }

        bytes4 selector = bytes4(data[0:4]);
        if (
            selector != bytes4(keccak256("startGame()")) &&
            selector != bytes4(keccak256("submitWord(string,uint256)")) &&
            selector != bytes4(keccak256("completeGame(uint256,uint256)"))
        ) {
            return (false, "Function not sponsored");
        }

        return (true, "");
    }

    /**
     * @dev Transfer ownership to a new owner
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        owner = _newOwner;
    }

    /**
     * @dev Receive function to accept ETH deposits
     */
    receive() external payable {
        // Allow anyone to fund the paymaster
    }
}
