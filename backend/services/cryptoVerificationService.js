const { ethers } = require("ethers");
const { TronWeb } = require("tronweb");
const axios = require("axios");

// ═════════════════════════════════════════════════════════════════════
// 1. CONFIGURATION & CONTRACT ADDRESSES
// ═════════════════════════════════════════════════════════════════════

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const ETHERSCAN_V2_URL = "https://api.etherscan.io/v2/api";

// Official USDT Contract Addresses
const USDT_BSC_MAINNET = "0x55d398326f99059fF775485246999027B3197955".toLowerCase();
const USDT_BSC_TESTNET = "0x337610d27c682E347C9cD608137673011b17e71D".toLowerCase();
const USDT_ETH_MAINNET = "0xdAC17F958D2ee523a2206206994597C13D831ec7".toLowerCase();
const USDT_POLYGON_MAINNET = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F".toLowerCase();

// TRON Configuration
const TRON_MAINNET_HOST = "https://api.trongrid.io";
const TRON_NILE_HOST = "https://nile.trongrid.io";
const USDT_TRON_MAINNET = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const USDT_TRON_NILE = "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf";
const TRANSFER_EVENT_TOPIC = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// BSC RPC Fallback Nodes
const BSC_MAINNET_RPCS = [
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.defibit.io/",
  "https://bsc-dataseed1.ninicoin.io/",
  "https://binance.llamarpc.com",
];

const BSC_TESTNET_RPCS = [
  "https://data-seed-prebsc-1-s1.binance.org:8545/",
  "https://bsc-testnet.publicnode.com",
];

const ERC20_TRANSFER_INTERFACE = new ethers.Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

/**
 * Helper to get a working BSC RPC Provider with automatic fallback
 */
async function getBscProvider(isTestnet = false) {
  const rpcList = isTestnet ? BSC_TESTNET_RPCS : BSC_MAINNET_RPCS;
  for (const url of rpcList) {
    try {
      const provider = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
      return provider;
    } catch (e) {
      continue;
    }
  }
  return new ethers.JsonRpcProvider(rpcList[0]);
}

// ═════════════════════════════════════════════════════════════════════
// 2. ETHERSCAN UNIFIED V2 API VERIFIER (ETH, POLYGON, BSC)
// ═════════════════════════════════════════════════════════════════════

async function verifyEtherscanEvmDeposit({
  chainId,
  networkName,
  txHash,
  expectedRecipient,
  validRecipients,
  expectedAmount,
  tokenContract,
  decimals = 6,
}) {
  const apiKey = process.env.ETHERSCAN_API_KEY || ETHERSCAN_API_KEY;
  if (!apiKey) {
    return { fallback: true, reason: "ETHERSCAN_API_KEY not configured" };
  }

  try {
    const cleanHash = txHash.trim().startsWith("0x") ? txHash.trim() : "0x" + txHash.trim();
    const recipientList = [
      ...(Array.isArray(validRecipients) ? validRecipients : []),
      expectedRecipient,
      process.env.PAYOUT_POOL_ADDRESS || "0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3",
    ].filter(Boolean).map((a) => a.trim().toLowerCase());
    const targetToken = tokenContract.toLowerCase();

    // Query Etherscan V2 Unified API for transaction receipt
    const res = await axios.get(ETHERSCAN_V2_URL, {
      params: {
        chainid: chainId,
        module: "proxy",
        action: "eth_getTransactionReceipt",
        txhash: cleanHash,
        apikey: apiKey,
      },
      timeout: 10000,
    });

    const data = res.data;

    // Check if free plan does not cover this specific chain (e.g. BSC chain 56)
    if (data?.status === "0" && typeof data?.result === "string" && data.result.includes("not supported")) {
      return { fallback: true, reason: data.result };
    }

    const receipt = data?.result;

    if (!receipt) {
      return {
        verified: false,
        pending: true,
        reason: `Transaction not found on ${networkName} yet. It may still be broadcasting in the mempool. Please wait 30 seconds and try again.`,
      };
    }

    // Check transaction status (0x1 = Success, 0x0 = Reverted)
    if (receipt.status !== "0x1") {
      return {
        verified: false,
        reason: `The transaction failed or was reverted on the ${networkName} blockchain.`,
      };
    }

    let matchingTransfer = null;
    const logs = receipt.logs || [];

    for (const log of logs) {
      const logAddress = (log.address || "").toLowerCase();
      // Match token contract
      if (logAddress === targetToken) {
        try {
          const parsed = ERC20_TRANSFER_INTERFACE.parseLog(log);
          if (parsed && parsed.name === "Transfer") {
            const toAddress = parsed.args.to.toLowerCase();
            const transferredAmount = parseFloat(ethers.formatUnits(parsed.args.value, decimals));

            if (recipientList.includes(toAddress)) {
              matchingTransfer = {
                from: parsed.args.from,
                to: parsed.args.to,
                amount: transferredAmount,
                blockNumber: parseInt(receipt.blockNumber, 16),
                tokenContract: log.address,
              };
              break;
            }
          }
        } catch (e) {
          // Skip non-transfer log
        }
      }
    }

    if (!matchingTransfer) {
      return {
        verified: false,
        reason: `No USDT transfer found in this transaction to the platform's receiving address (${expectedRecipient}). Please ensure you sent USDT to the exact address shown.`,
      };
    }

    // Amount validation with tiny float tolerance (0.001)
    const tolerance = 0.001;
    if (matchingTransfer.amount < expectedAmount - tolerance) {
      return {
        verified: false,
        reason: `Underpaid: You specified a deposit of $${expectedAmount} USD, but the blockchain transaction only transferred $${matchingTransfer.amount} USDT.`,
        actualAmount: matchingTransfer.amount,
      };
    }

    return {
      verified: true,
      network: networkName,
      fromAddress: matchingTransfer.from,
      toAddress: matchingTransfer.to,
      actualAmount: matchingTransfer.amount,
      blockNumber: matchingTransfer.blockNumber,
      txHash: cleanHash,
    };
  } catch (err) {
    console.warn(`[Etherscan V2 Query Error for chain ${chainId}]:`, err.message);
    return { fallback: true, reason: err.message };
  }
}

// ═════════════════════════════════════════════════════════════════════
// 3. BSC (BEP-20) VERIFICATION (ETHERSCAN V2 + RPC FALLBACK)
// ═════════════════════════════════════════════════════════════════════

async function verifyBscDeposit({ txHash, expectedRecipient, validRecipients, expectedAmount, isTestnet = false }) {
  const cleanHash = txHash.trim().startsWith("0x") ? txHash.trim() : "0x" + txHash.trim();
  const recipientList = [
    ...(Array.isArray(validRecipients) ? validRecipients : []),
    expectedRecipient,
    process.env.PAYOUT_POOL_ADDRESS || "0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3",
  ].filter(Boolean).map((a) => a.trim().toLowerCase());

  // Try Etherscan V2 API first if mainnet
  if (!isTestnet) {
    const etherscanRes = await verifyEtherscanEvmDeposit({
      chainId: 56,
      networkName: "BNB Smart Chain (BEP-20)",
      txHash: cleanHash,
      expectedRecipient,
      validRecipients: recipientList,
      expectedAmount,
      tokenContract: USDT_BSC_MAINNET,
      decimals: 18,
    });

    if (!etherscanRes.fallback) {
      return etherscanRes;
    }
  }

  // Fallback to Direct High-Speed BSC RPC
  try {
    const provider = await getBscProvider(isTestnet);
    const receipt = await provider.getTransactionReceipt(cleanHash);

    if (!receipt) {
      return {
        verified: false,
        pending: true,
        reason: "Transaction not found on BSC network yet. It may still be broadcasting in the mempool. Please wait 30 seconds and try again.",
      };
    }

    if (receipt.status !== 1) {
      return {
        verified: false,
        reason: "The transaction failed or was reverted on the BSC blockchain.",
      };
    }

    const targetContract = isTestnet ? USDT_BSC_TESTNET : USDT_BSC_MAINNET;
    let matchingTransfer = null;

    for (const log of receipt.logs) {
      const logContract = log.address.toLowerCase();
      if (logContract === targetContract || (isTestnet && logContract.length === 42)) {
        try {
          const parsed = ERC20_TRANSFER_INTERFACE.parseLog(log);
          if (parsed && parsed.name === "Transfer") {
            const toAddress = parsed.args.to.toLowerCase();
            const transferredAmount = parseFloat(ethers.formatUnits(parsed.args.value, 18));

            if (recipientList.includes(toAddress)) {
              matchingTransfer = {
                from: parsed.args.from,
                to: parsed.args.to,
                amount: transferredAmount,
                blockNumber: receipt.blockNumber,
                tokenContract: log.address,
              };
              break;
            }
          }
        } catch (parseErr) {
          // Skip
        }
      }
    }

    if (!matchingTransfer) {
      return {
        verified: false,
        reason: `No USDT transfer found in this transaction to the platform's receiving address (${expectedRecipient}). Please ensure you sent USDT to the exact address shown.`,
      };
    }

    const tolerance = 0.001;
    if (matchingTransfer.amount < expectedAmount - tolerance) {
      return {
        verified: false,
        reason: `Underpaid: You specified a deposit of $${expectedAmount} USD, but the blockchain transaction only transferred $${matchingTransfer.amount} USDT.`,
        actualAmount: matchingTransfer.amount,
      };
    }

    return {
      verified: true,
      network: "BNB Smart Chain (BEP-20)",
      fromAddress: matchingTransfer.from,
      toAddress: matchingTransfer.to,
      actualAmount: matchingTransfer.amount,
      blockNumber: matchingTransfer.blockNumber,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("[BSC RPC Verification Error]:", error.message);
    return {
      verified: false,
      reason: "BSC verification query error: " + error.message,
    };
  }
}

// ═════════════════════════════════════════════════════════════════════
// 4. TRON (TRC-20) VERIFICATION (TRONWEB + TRONGRID)
// ═════════════════════════════════════════════════════════════════════

async function verifyTronDeposit({ txHash, expectedRecipient, expectedAmount, isTestnet = false }) {
  try {
    const cleanHash = txHash.trim().replace(/^0x/, "");
    const host = isTestnet ? TRON_NILE_HOST : TRON_MAINNET_HOST;
    const tronWeb = new TronWeb({ fullHost: host });

    const info = await tronWeb.trx.getTransactionInfo(cleanHash);

    if (!info || !info.id || !info.blockNumber) {
      return {
        verified: false,
        pending: true,
        reason: "Transaction not found on TRON network yet. It may still be awaiting block confirmation. Please wait 30 seconds and try again.",
      };
    }

    if (info.receipt && info.receipt.result && info.receipt.result !== "SUCCESS") {
      return {
        verified: false,
        reason: "The transaction failed or out of energy on the TRON blockchain. Status: " + info.receipt.result,
      };
    }

    const targetContractBase58 = isTestnet ? USDT_TRON_NILE : USDT_TRON_MAINNET;
    const targetContractHex = tronWeb.address.toHex(targetContractBase58).toLowerCase().replace(/^41/, "");
    const cleanRecipientBase58 = expectedRecipient.trim();
    const cleanRecipientHex = tronWeb.address.toHex(cleanRecipientBase58).toLowerCase().replace(/^41/, "");

    let matchingTransfer = null;
    const logs = info.log || [];

    for (const log of logs) {
      const logAddress = (log.address || "").toLowerCase().replace(/^41/, "");
      const topics = log.topics || [];

      if (topics[0] === TRANSFER_EVENT_TOPIC && (logAddress === targetContractHex || isTestnet)) {
        if (topics.length >= 3) {
          const toHex = topics[2].slice(-40).toLowerCase();
          const fromHex = topics[1].slice(-40).toLowerCase();
          const rawValue = BigInt("0x" + (log.data || "0"));
          const transferredAmount = Number(rawValue) / 1e6; // TRC20 USDT has 6 decimals

          if (toHex === cleanRecipientHex) {
            matchingTransfer = {
              from: tronWeb.address.fromHex("41" + fromHex),
              to: cleanRecipientBase58,
              amount: transferredAmount,
              blockNumber: info.blockNumber,
            };
            break;
          }
        }
      }
    }

    if (!matchingTransfer) {
      return {
        verified: false,
        reason: `No TRC-20 USDT transfer found in this transaction to platform address (${expectedRecipient}).`,
      };
    }

    if (matchingTransfer.amount < expectedAmount - 0.001) {
      return {
        verified: false,
        reason: `Underpaid: You specified $${expectedAmount} USD, but only $${matchingTransfer.amount} USDT was received.`,
        actualAmount: matchingTransfer.amount,
      };
    }

    return {
      verified: true,
      network: "TRON (TRC-20)",
      fromAddress: matchingTransfer.from,
      toAddress: matchingTransfer.to,
      actualAmount: matchingTransfer.amount,
      blockNumber: info.blockNumber,
      txHash: info.id,
    };
  } catch (error) {
    console.error("[TRON Verification Error]:", error.message);
    return {
      verified: false,
      reason: "TRON verification query error: " + error.message,
    };
  }
}

// ═════════════════════════════════════════════════════════════════════
// 5. UNIFIED DISPATCHER FOR ALL CRYPTO DEPOSITS
// ═════════════════════════════════════════════════════════════════════

async function verifyCryptoDeposit({ network, txHash, expectedRecipient, validRecipients, expectedAmount }) {
  if (!txHash || typeof txHash !== "string" || txHash.trim().length < 10) {
    return {
      verified: false,
      reason: "Please provide a valid blockchain Transaction Hash (TxID).",
    };
  }

  const netUpper = (network || "").toUpperCase();

  // 1. BNB Smart Chain (BEP-20)
  if (netUpper.includes("BNB") || netUpper.includes("BSC") || netUpper.includes("BEP-20") || netUpper.includes("BEP20")) {
    return await verifyBscDeposit({
      txHash,
      expectedRecipient,
      validRecipients,
      expectedAmount,
      isTestnet: false,
    });
  }

  // 2. TRON (TRC-20)
  if (netUpper.includes("TRON") || netUpper.includes("TRC-20") || netUpper.includes("TRC20")) {
    return await verifyTronDeposit({
      txHash,
      expectedRecipient,
      expectedAmount,
      isTestnet: false,
    });
  }

  // 3. Ethereum (ERC-20 USDT) via Etherscan V2 API
  if (netUpper.includes("ERC20") || netUpper.includes("ERC-20") || netUpper.includes("ETH")) {
    const ethRes = await verifyEtherscanEvmDeposit({
      chainId: 1,
      networkName: "Ethereum (ERC-20)",
      txHash,
      expectedRecipient,
      validRecipients,
      expectedAmount,
      tokenContract: USDT_ETH_MAINNET,
      decimals: 6,
    });
    if (!ethRes.fallback) return ethRes;
    return {
      verified: false,
      reason: ethRes.reason || "Unable to verify transaction on Ethereum mainnet via Etherscan.",
    };
  }

  // 4. Polygon (Polygon USDT) via Etherscan V2 API
  if (netUpper.includes("POLYGON") || netUpper.includes("MATIC")) {
    const polyRes = await verifyEtherscanEvmDeposit({
      chainId: 137,
      networkName: "Polygon",
      txHash,
      expectedRecipient,
      expectedAmount,
      tokenContract: USDT_POLYGON_MAINNET,
      decimals: 6,
    });
    if (!polyRes.fallback) return polyRes;
    return {
      verified: false,
      reason: polyRes.reason || "Unable to verify transaction on Polygon network via Etherscan.",
    };
  }

  return {
    verified: false,
    reason: `Automated on-chain verification is currently active for BNB Smart Chain (BEP-20), TRON (TRC-20), Ethereum (ERC-20), and Polygon. Selected network: ${network}`,
  };
}

// ═════════════════════════════════════════════════════════════════════
// 6. AUTO-DETECT TRANSFER FROM USER'S REGISTERED WALLET
// ═════════════════════════════════════════════════════════════════════

async function autoDetectCryptoTransfer({
  network,
  senderAddress,
  expectedRecipient,
  expectedAmount,
  usedTxHashes = [],
}) {
  if (!senderAddress || typeof senderAddress !== "string" || !senderAddress.trim()) {
    return { found: false, reason: "No registered wallet address provided." };
  }

  const netUpper = (network || "").toUpperCase();
  const cleanSender = senderAddress.trim().toLowerCase();
  const cleanRecipient = (expectedRecipient || "").trim().toLowerCase();
  const apiKey = process.env.ETHERSCAN_API_KEY || ETHERSCAN_API_KEY;

  // 1. TRON (TRC-20) AUTO-DETECTION VIA TRONGRID
  if (netUpper.includes("TRON") || netUpper.includes("TRC-20") || netUpper.includes("TRC20")) {
    try {
      const res = await axios.get(
        `https://api.trongrid.io/v1/accounts/${senderAddress.trim()}/transactions/trc20?contract_address=${USDT_TRON_MAINNET}&limit=10`,
        { timeout: 7000 }
      );
      const list = res.data?.data || [];

      for (const item of list) {
        const toAddress = (item.to || "").trim().toLowerCase();
        const txId = item.transaction_id;
        const amount = Number(item.value) / 1e6;

        if (toAddress === cleanRecipient && amount >= expectedAmount - 0.001) {
          if (!usedTxHashes.includes(txId)) {
            return {
              found: true,
              txHash: txId,
              network: "TRON (TRC-20)",
              amount,
              from: item.from,
              to: item.to,
              timestamp: item.block_timestamp,
            };
          }
        }
      }
      return {
        found: false,
        reason: `No recent TRC-20 USDT transfer found from your registered address (${senderAddress}) to platform address (${expectedRecipient}). If you just sent it, please wait 30 seconds and retry.`,
      };
    } catch (err) {
      console.warn("[Auto-Detect TRON Error]:", err.message);
      return { found: false, reason: "TRON network query error: " + err.message };
    }
  }

  // 2. ETHEREUM (ERC-20) AUTO-DETECTION VIA ETHERSCAN V2 API
  if (netUpper.includes("ERC20") || netUpper.includes("ERC-20") || netUpper.includes("ETH")) {
    if (!apiKey) {
      return { found: false, reason: "Etherscan API key not configured for Ethereum auto-detection." };
    }
    try {
      const res = await axios.get(ETHERSCAN_V2_URL, {
        params: {
          chainid: 1,
          module: "account",
          action: "tokentx",
          address: senderAddress.trim(),
          page: 1,
          offset: 15,
          sort: "desc",
          apikey: apiKey,
        },
        timeout: 8000,
      });

      const list = res.data?.result || [];
      if (Array.isArray(list)) {
        for (const item of list) {
          const toAddress = (item.to || "").toLowerCase();
          const fromAddress = (item.from || "").toLowerCase();
          const contract = (item.contractAddress || "").toLowerCase();
          const decimals = Number(item.tokenDecimal) || 6;
          const amount = Number(item.value) / Math.pow(10, decimals);
          const txHash = item.hash;

          if (
            fromAddress === cleanSender &&
            toAddress === cleanRecipient &&
            contract === USDT_ETH_MAINNET &&
            amount >= expectedAmount - 0.001
          ) {
            if (!usedTxHashes.includes(txHash)) {
              return {
                found: true,
                txHash,
                network: "Ethereum (ERC-20)",
                amount,
                from: item.from,
                to: item.to,
                timestamp: item.timeStamp ? Number(item.timeStamp) * 1000 : Date.now(),
              };
            }
          }
        }
      }
      return {
        found: false,
        reason: `No recent Ethereum USDT transfer found from ${senderAddress} to ${expectedRecipient}. Please ensure the transaction has confirmed.`,
      };
    } catch (err) {
      return { found: false, reason: "Ethereum query error: " + err.message };
    }
  }

  // 3. POLYGON AUTO-DETECTION VIA ETHERSCAN V2 API
  if (netUpper.includes("POLYGON") || netUpper.includes("MATIC")) {
    if (!apiKey) {
      return { found: false, reason: "Etherscan API key not configured for Polygon auto-detection." };
    }
    try {
      const res = await axios.get(ETHERSCAN_V2_URL, {
        params: {
          chainid: 137,
          module: "account",
          action: "tokentx",
          address: senderAddress.trim(),
          page: 1,
          offset: 15,
          sort: "desc",
          apikey: apiKey,
        },
        timeout: 8000,
      });

      const list = res.data?.result || [];
      if (Array.isArray(list)) {
        for (const item of list) {
          const toAddress = (item.to || "").toLowerCase();
          const fromAddress = (item.from || "").toLowerCase();
          const contract = (item.contractAddress || "").toLowerCase();
          const decimals = Number(item.tokenDecimal) || 6;
          const amount = Number(item.value) / Math.pow(10, decimals);
          const txHash = item.hash;

          if (
            fromAddress === cleanSender &&
            toAddress === cleanRecipient &&
            contract === USDT_POLYGON_MAINNET &&
            amount >= expectedAmount - 0.001
          ) {
            if (!usedTxHashes.includes(txHash)) {
              return {
                found: true,
                txHash,
                network: "Polygon",
                amount,
                from: item.from,
                to: item.to,
                timestamp: item.timeStamp ? Number(item.timeStamp) * 1000 : Date.now(),
              };
            }
          }
        }
      }
      return {
        found: false,
        reason: `No recent Polygon USDT transfer found from ${senderAddress} to ${expectedRecipient}.`,
      };
    } catch (err) {
      return { found: false, reason: "Polygon query error: " + err.message };
    }
  }

  // 4. BSC (BEP-20)
  if (netUpper.includes("BNB") || netUpper.includes("BSC") || netUpper.includes("BEP-20") || netUpper.includes("BEP20")) {
    return {
      found: false,
      reason: `Automated detection for BSC address ${senderAddress}: Please paste your transaction TxID below. Your registered wallet will be verified against the transaction sender automatically.`,
    };
  }

  return {
    found: false,
    reason: `Auto-detection is active for TRON (TRC-20), Ethereum (ERC-20), and Polygon.`,
  };
}

module.exports = {
  verifyBscDeposit,
  verifyTronDeposit,
  verifyEtherscanEvmDeposit,
  verifyCryptoDeposit,
  autoDetectCryptoTransfer,
};
