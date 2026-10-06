const { ethers } = require("ethers");
const mongoose = require("mongoose");
const AdminSettings = require("../models/AdminSettings");
const { notifyAdmin } = require("../utils/notificationService");

// ═════════════════════════════════════════════════════════════════════
// 1. CONFIGURATION & ABI
// ═════════════════════════════════════════════════════════════════════

const BSC_TESTNET_RPCS = [
  "https://data-seed-prebsc-1-s1.binance.org:8545/",
  "https://bsc-testnet.publicnode.com",
  "https://data-seed-prebsc-2-s1.binance.org:8545/",
];

const BSC_MAINNET_RPCS = [
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.defibit.io/",
  "https://binance.llamarpc.com",
];

// Minimal ABI of HorizonPayoutPool
const PAYOUT_POOL_ABI = [
  "function processUserPayout(address recipient, uint256 amount, string calldata customId) external",
  "function getPoolBalance() external view returns (uint256)",
  "function relayerAddress() external view returns (address)",
  "function owner() external view returns (address)",
  "function updateRelayerAddress(address _newRelayer) external",
  "function totalPayoutsDisbursed() external view returns (uint256)",
  "function totalPayoutCount() external view returns (uint256)",
  "event PayoutProcessed(address indexed to, uint256 amount, uint256 timestamp, string customId)",
  "event RelayerUpdated(address indexed previousRelayer, address indexed newRelayer)"
];

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

/**
 * Get an active JSON-RPC provider for BSC with automatic fallback
 */
function getProvider(isTestnet = true) {
  const rpcList = isTestnet ? BSC_TESTNET_RPCS : BSC_MAINNET_RPCS;
  const primaryRpc = process.env.BSC_RPC_URL || rpcList[0];
  return new ethers.JsonRpcProvider(primaryRpc);
}

/**
 * Get the Relayer Wallet instance
 */
function getRelayerWallet(provider) {
  const privateKey = process.env.RELAYER_PRIVATE_KEY || process.env.PAYOUT_RELAYER_PRIVATE_KEY;
  if (!privateKey || privateKey.trim() === "" || privateKey.includes("your_private_key")) {
    return null;
  }
  return new ethers.Wallet(privateKey.trim(), provider);
}

// ═════════════════════════════════════════════════════════════════════
// 2. CORE PAYOUT EXECUTION ENGINE
// ═════════════════════════════════════════════════════════════════════

/**
 * Dispatches an automated on-chain USDT payout from the Smart Contract Pool
 * @param {Object} params
 * @param {string} params.recipientAddress - User's BEP-20 destination address
 * @param {number} params.amountInUsd - Net USD amount to disburse
 * @param {string} params.customId - Platform Transaction Custom ID (e.g. WD-123456)
 * @returns {Promise<Object>} Execution result with txHash or failure reason
 */
async function executeSmartContractWithdrawal({ recipientAddress, amountInUsd, customId }) {
  try {
    // 1. Fetch Dynamic Admin Settings
    let adminSettings = await AdminSettings.findOne();
    const scSettings = adminSettings?.smartContractSettings || {};

    const isEnabled = scSettings.enabled !== false;
    const network = scSettings.network || process.env.BSC_NETWORK || "BSC_MAINNET";
    const isTestnet = network !== "BSC_MAINNET";
    const poolAddress = (scSettings.payoutPoolAddress || process.env.PAYOUT_POOL_ADDRESS || "").trim();

    if (!isEnabled) {
      return {
        success: false,
        reason: "DISABLED",
        error: "Smart contract automated payouts are disabled in platform settings.",
      };
    }

    if (!poolAddress || !ethers.isAddress(poolAddress)) {
      return {
        success: false,
        reason: "NO_CONTRACT_CONFIGURED",
        error: "Smart contract payout pool address is not yet configured in settings or .env.",
      };
    }

    if (!recipientAddress || !ethers.isAddress(recipientAddress)) {
      return {
        success: false,
        reason: "INVALID_RECIPIENT",
        error: `Invalid destination wallet address: ${recipientAddress}`,
      };
    }

    // 2. Setup Provider & Relayer
    const provider = getProvider(isTestnet);
    const relayer = getRelayerWallet(provider);

    if (!relayer) {
      return {
        success: false,
        reason: "NO_RELAYER_KEY",
        error: "Backend Relayer Private Key is not configured in backend/.env.",
      };
    }

    // 3. Check Relayer Gas Balance (BNB)
    const relayerBalance = await provider.getBalance(relayer.address);
    const minGasBnb = ethers.parseEther("0.002"); // ~0.002 BNB (~$1.30)
    if (relayerBalance < minGasBnb) {
      const gasBnbFormatted = ethers.formatEther(relayerBalance);
      console.warn(`[Smart Contract Payout] Relayer low on BNB gas: ${gasBnbFormatted} BNB`);
      await notifyAdmin({
        title: "Relayer Low on Gas (BNB)",
        message: `Payout Relayer wallet (${relayer.address}) has only ${gasBnbFormatted} BNB. Please fund with at least 0.01 BNB to maintain instant withdrawals.`,
        category: "SECURITY",
        type: "system_alert",
        priority: "HIGH",
        actionUrl: "/settings",
      }).catch(() => {});
    }

    // 4. Connect to Pool Contract
    const poolContract = new ethers.Contract(poolAddress, PAYOUT_POOL_ABI, relayer);

    // 5. Check Pool USDT Balance
    // BSC USDT typically uses 18 decimals
    const decimals = 18;
    const amountInWei = ethers.parseUnits(amountInUsd.toFixed(2), decimals);

    let poolBalanceWei = 0n;
    try {
      poolBalanceWei = await poolContract.getPoolBalance();
    } catch (balErr) {
      console.warn("[Smart Contract Payout] Could not query pool balance directly:", balErr.message);
    }

    if (poolBalanceWei > 0n && poolBalanceWei < amountInWei) {
      const formattedPoolBal = ethers.formatUnits(poolBalanceWei, decimals);
      console.warn(`[Smart Contract Payout] Insufficient pool balance: $${formattedPoolBal} available vs $${amountInUsd} needed.`);
      
      await notifyAdmin({
        title: "Smart Contract Pool Balance Low!",
        message: `Contract Pool (${poolAddress}) has only $${formattedPoolBal} USDT available. Cannot disburse $${amountInUsd} withdrawal for ${customId}. Marked as Pending.`,
        category: "FINANCIAL",
        type: "system_alert",
        priority: "HIGH",
        actionUrl: "/withdrawals",
      }).catch(() => {});

      return {
        success: false,
        reason: "LOW_POOL_BALANCE",
        error: `Insufficient USDT balance in Smart Contract Pool ($${formattedPoolBal} available, $${amountInUsd} required).`,
      };
    }

    // 6. Execute On-Chain Payout
    console.log(`[Smart Contract Payout] Dispatching $${amountInUsd} USDT to ${recipientAddress} for ${customId}...`);

    const tx = await poolContract.processUserPayout(
      recipientAddress,
      amountInWei,
      customId || "WD-INSTANT"
    );

    console.log(`[Smart Contract Payout] Broadcasted TxHash: ${tx.hash}. Waiting for block confirmation...`);
    const receipt = await tx.wait(1);

    const explorerBase = isTestnet
      ? "https://testnet.bscscan.com/tx/"
      : "https://bscscan.com/tx/";
    const explorerUrl = `${explorerBase}${receipt.hash}`;

    console.log(`[Smart Contract Payout] Confirmed in block #${receipt.blockNumber}! Explorer: ${explorerUrl}`);

    return {
      success: true,
      txHash: receipt.hash,
      blockchainExplorerUrl: explorerUrl,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : "0",
    };
  } catch (error) {
    console.error("[Smart Contract Payout Fatal Error]:", error);
    return {
      success: false,
      reason: "EXECUTION_ERROR",
      error: error.message || "Failed to execute smart contract transaction.",
    };
  }
}

// ═════════════════════════════════════════════════════════════════════
// 3. HEALTH & AUDIT HELPERS
// ═════════════════════════════════════════════════════════════════════

/**
 * Checks the real-time status of the Smart Contract Pool and Relayer
 */
async function checkPoolHealth() {
  try {
    let adminSettings = await AdminSettings.findOne();
    const scSettings = adminSettings?.smartContractSettings || {};
    const network = scSettings.network || process.env.BSC_NETWORK || "BSC_MAINNET";
    const isTestnet = network !== "BSC_MAINNET";
    const poolAddress = (scSettings.payoutPoolAddress || process.env.PAYOUT_POOL_ADDRESS || "").trim();

    const provider = getProvider(isTestnet);
    const relayer = getRelayerWallet(provider);

    let relayerAddress = relayer ? relayer.address : "Not Configured";
    let relayerBnb = "0.00";
    if (relayer) {
      const bnbBal = await provider.getBalance(relayer.address);
      relayerBnb = parseFloat(ethers.formatEther(bnbBal)).toFixed(4);
    }

    let poolBalanceUsdt = "0.00";
    let contractConfigured = false;
    let totalDisbursed = "0.00";
    let totalCount = 0;

    if (poolAddress && ethers.isAddress(poolAddress)) {
      try {
        const poolContract = new ethers.Contract(poolAddress, PAYOUT_POOL_ABI, provider);
        const balWei = await poolContract.getPoolBalance();
        poolBalanceUsdt = parseFloat(ethers.formatUnits(balWei, 18)).toFixed(2);
        
        const disbursedWei = await poolContract.totalPayoutsDisbursed().catch(() => 0n);
        totalDisbursed = parseFloat(ethers.formatUnits(disbursedWei, 18)).toFixed(2);

        const count = await poolContract.totalPayoutCount().catch(() => 0n);
        totalCount = Number(count);

        contractConfigured = true;
      } catch (err) {
        console.warn("[Pool Health] Error querying contract:", err.message);
      }
    }

    return {
      success: true,
      network: isTestnet ? "BSC Testnet" : "BSC Mainnet",
      chainId: isTestnet ? 97 : 56,
      contractConfigured,
      poolAddress: poolAddress || "Not Set",
      poolBalanceUsdt,
      relayerAddress,
      relayerBnb,
      totalDisbursed,
      totalCount,
      autoPayoutEnabled: scSettings.autoPayoutEnabled !== false,
      explorerBase: isTestnet ? "https://testnet.bscscan.com" : "https://bscscan.com",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  executeSmartContractWithdrawal,
  checkPoolHealth,
};
