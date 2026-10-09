const { ethers } = require("ethers");
const Transaction = require("../../models/Transaction");
const AdminSettings = require("../../models/AdminSettings");

// Smart Contract & BSC Configuration
const BSC_MAINNET_RPCS = [
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.defibit.io/",
  "https://bsc-dataseed1.ninicoin.io/",
  "https://binance.llamarpc.com",
];

const PAYOUT_POOL_ABI = [
  "function processUserPayout(address recipient, uint256 amount, string calldata customId) external",
  "function getPoolBalance() external view returns (uint256)",
  "function relayerAddress() external view returns (address)",
  "function owner() external view returns (address)",
  "function totalPayoutsDisbursed() external view returns (uint256)",
  "function totalPayoutCount() external view returns (uint256)",
  "function totalDepositsReceived() external view returns (uint256)",
  "function usdtToken() external view returns (address)",
];

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

const USDT_BSC_MAINNET = "0x55d398326f99059fF775485246999027B3197955";

function getBscProvider() {
  const primaryRpc = process.env.BSC_RPC_URL || BSC_MAINNET_RPCS[0];
  return new ethers.JsonRpcProvider(primaryRpc);
}

function getRelayerWallet(provider) {
  const privateKey = process.env.RELAYER_PRIVATE_KEY || process.env.PAYOUT_RELAYER_PRIVATE_KEY;
  if (!privateKey || privateKey.trim() === "" || privateKey.includes("your_private_key")) {
    return null;
  }
  return new ethers.Wallet(privateKey.trim(), provider);
}

// ═════════════════════════════════════════════════════════════════════
// 1. GET SMART CONTRACT VAULT OVERVIEW & LIVE METRICS
// ═════════════════════════════════════════════════════════════════════
exports.getVaultOverview = async (req, res) => {
  try {
    const poolAddress = (process.env.PAYOUT_POOL_ADDRESS || "0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3").trim();
    const provider = getBscProvider();
    const relayer = getRelayerWallet(provider);

    let poolBalanceUsdt = "0.00";
    let poolBalanceBnb = "0.00";
    let relayerBnb = "0.00";
    let relayerAddress = relayer ? relayer.address : (process.env.RELAYER_ADDRESS || "0x1B892C03E3031288137951693F4E40553Dd2E5f6");
    let ownerAddress = "0x1b892C03e303128B137951693f4a40553dd2e5F6";
    let onChainTotalDisbursed = "0.00";
    let onChainTotalPayoutCount = 0;
    let onChainTotalDeposits = "0.00";

    // 1. Query On-Chain Balances & Contract Data
    try {
      if (poolAddress && ethers.isAddress(poolAddress)) {
        const poolContract = new ethers.Contract(poolAddress, PAYOUT_POOL_ABI, provider);

        // Fetch on-chain USDT balance via contract method or ERC20 directly
        try {
          const balWei = await poolContract.getPoolBalance();
          poolBalanceUsdt = parseFloat(ethers.formatUnits(balWei, 18)).toFixed(2);
        } catch {
          const usdtContract = new ethers.Contract(USDT_BSC_MAINNET, ERC20_ABI, provider);
          const usdtWei = await usdtContract.balanceOf(poolAddress);
          poolBalanceUsdt = parseFloat(ethers.formatUnits(usdtWei, 18)).toFixed(2);
        }

        // Fetch native BNB in contract
        const bnbWei = await provider.getBalance(poolAddress);
        poolBalanceBnb = parseFloat(ethers.formatEther(bnbWei)).toFixed(4);

        // Fetch stats
        const disbursedWei = await poolContract.totalPayoutsDisbursed().catch(() => 0n);
        onChainTotalDisbursed = parseFloat(ethers.formatUnits(disbursedWei, 18)).toFixed(2);

        const count = await poolContract.totalPayoutCount().catch(() => 0n);
        onChainTotalPayoutCount = Number(count);

        const depositsWei = await poolContract.totalDepositsReceived().catch(() => 0n);
        onChainTotalDeposits = parseFloat(ethers.formatUnits(depositsWei, 18)).toFixed(2);

        ownerAddress = await poolContract.owner().catch(() => ownerAddress);
        relayerAddress = await poolContract.relayerAddress().catch(() => relayerAddress);
      }
    } catch (onChainErr) {
      console.warn("[Vault Overview] On-chain query warning:", onChainErr.message);
    }

    // 2. Query Relayer Gas Balance
    if (relayer) {
      try {
        const rBal = await provider.getBalance(relayer.address);
        relayerBnb = parseFloat(ethers.formatEther(rBal)).toFixed(4);
      } catch (err) {
        console.warn("[Vault Overview] Relayer balance warning:", err.message);
      }
    }

    // 3. Query Database Transaction History for Smart Contract
    const dbTransactions = await Transaction.find({
      $or: [
        { gateway: { $regex: /smart contract/i } },
        { gateway: { $regex: /bep-20/i } },
        { incomeSource: "Admin Vault Sweep" },
        { payoutMethod: "Smart Contract Pool" },
        { cryptoNetwork: { $regex: /bep|bsc/i } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Calculate aggregated platform metrics
    const totalDepositsDb = dbTransactions
      .filter((t) => t.type === "Deposit" && (t.status === "Approved" || t.status === "Completed"))
      .reduce((sum, t) => sum + Number(t.rawAmount || t.amount || 0), 0);

    const totalSweepsDb = dbTransactions
      .filter((t) => t.incomeSource === "Admin Vault Sweep" && (t.status === "Approved" || t.status === "Completed"))
      .reduce((sum, t) => sum + Number(t.rawAmount || t.amount || 0), 0);

    const totalUserPayoutsDb = dbTransactions
      .filter((t) => t.type === "Withdrawal" && t.payoutMethod === "Smart Contract Pool" && (t.status === "Approved" || t.status === "Completed"))
      .reduce((sum, t) => sum + Number(t.rawAmount || t.amount || 0), 0);

    // Map formatted transfers for real-time monitoring
    const transfers = dbTransactions.map((t) => {
      const isSweep = t.incomeSource === "Admin Vault Sweep";
      const isDeposit = t.type === "Deposit";
      const direction = isDeposit ? "INFLOW" : "OUTFLOW";
      const hash = t.txHash || t.referenceNo || "";
      const isActualHash = hash.startsWith("0x") && hash.length === 66;

      return {
        _id: t._id,
        id: t.customId || String(t._id),
        type: isSweep ? "Admin Treasury Sweep" : isDeposit ? "Investor Deposit" : "Automated Payout",
        direction,
        amount: Number(t.rawAmount || t.amount || 0),
        currency: "USDT",
        from: isDeposit ? (t.senderAccount || "Investor Vault") : poolAddress,
        to: isDeposit ? poolAddress : (t.gatewayAccount || t.referenceNo || "Admin Wallet"),
        recipientName: isSweep ? "Super Admin Wallet" : (t.userName || "Investor"),
        date: t.date || (t.createdAt ? t.createdAt.toISOString().slice(0, 10) : "2026-10-05"),
        time: t.time || (t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "12:00"),
        status: t.status || "Completed",
        txHash: hash,
        explorerUrl: isActualHash ? `https://bscscan.com/tx/${hash}` : `https://bscscan.com/address/${poolAddress}#tokentxns`,
        note: t.note || "",
      };
    });

    res.status(200).json({
      success: true,
      poolAddress,
      network: "BNB Smart Chain (BEP-20)",
      chainId: 56,
      explorerBase: "https://bscscan.com",
      contractExplorerUrl: `https://bscscan.com/address/${poolAddress}#tokentxns`,
      poolBalanceUsdt: Number(poolBalanceUsdt),
      poolBalanceBnb: Number(poolBalanceBnb),
      relayerAddress,
      relayerBnb: Number(relayerBnb),
      ownerAddress,
      usdtTokenAddress: USDT_BSC_MAINNET,
      metrics: {
        totalDepositsVolume: totalDepositsDb > 0 ? totalDepositsDb : Number(onChainTotalDeposits),
        totalSweepsVolume: totalSweepsDb,
        totalPayoutsDisbursed: totalUserPayoutsDb > 0 ? totalUserPayoutsDb : Number(onChainTotalDisbursed),
        totalTransactionCount: transfers.length > 0 ? transfers.length : onChainTotalPayoutCount,
      },
      transfers,
    });
  } catch (error) {
    console.error("[Vault Overview Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═════════════════════════════════════════════════════════════════════
// 2. EXECUTE ADMIN VAULT SWEEP / TRANSFER TO REAL WALLET
// ═════════════════════════════════════════════════════════════════════
exports.executeAdminSweep = async (req, res) => {
  try {
    const { recipientAddress, amount, note } = req.body;
    const sweepAmount = Number(amount);

    // 1. Basic Validations
    if (!recipientAddress || !ethers.isAddress(recipientAddress)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid BSC / BEP-20 destination wallet address (0x...).",
      });
    }

    if (recipientAddress === ethers.ZeroAddress) {
      return res.status(400).json({
        success: false,
        message: "Cannot transfer to the burn / zero address.",
      });
    }

    if (!sweepAmount || sweepAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid transfer amount greater than 0 USDT.",
      });
    }

    const poolAddress = (process.env.PAYOUT_POOL_ADDRESS || "0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3").trim();
    const provider = getBscProvider();
    const relayer = getRelayerWallet(provider);

    if (!relayer) {
      return res.status(500).json({
        success: false,
        message: "Backend relayer/owner private key is not configured in backend/.env.",
      });
    }

    // 2. Check Gas Balance of Relayer
    const relayerBnbWei = await provider.getBalance(relayer.address);
    const minGasBnb = ethers.parseEther("0.0005");
    if (relayerBnbWei < minGasBnb) {
      return res.status(400).json({
        success: false,
        message: `Relayer wallet (${relayer.address}) has insufficient BNB for transaction gas. Current balance: ${ethers.formatEther(relayerBnbWei)} BNB. Please fund at least 0.005 BNB.`,
      });
    }

    // 3. Check Pool USDT Balance
    const poolContract = new ethers.Contract(poolAddress, PAYOUT_POOL_ABI, relayer);
    let poolBalanceWei = 0n;
    try {
      poolBalanceWei = await poolContract.getPoolBalance();
    } catch {
      const usdtContract = new ethers.Contract(USDT_BSC_MAINNET, ERC20_ABI, provider);
      poolBalanceWei = await usdtContract.balanceOf(poolAddress);
    }

    const decimals = 18;
    const sweepAmountWei = ethers.parseUnits(sweepAmount.toFixed(6), decimals);

    if (poolBalanceWei < sweepAmountWei) {
      const availableUsdt = ethers.formatUnits(poolBalanceWei, decimals);
      return res.status(400).json({
        success: false,
        message: `Insufficient vault balance. Available: ${Number(availableUsdt).toFixed(2)} USDT, Requested: ${sweepAmount.toFixed(2)} USDT.`,
      });
    }

    // 4. Execute On-Chain Transfer / Payout from Smart Contract
    const customSweepId = `SWEEP-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`[Vault Sweep] Executing $${sweepAmount} USDT transfer to ${recipientAddress}...`);

    const tx = await poolContract.processUserPayout(
      recipientAddress,
      sweepAmountWei,
      customSweepId
    );

    console.log(`[Vault Sweep] Broadcasted TxHash: ${tx.hash}. Waiting for BSC confirmation...`);
    const receipt = await tx.wait(1);

    const explorerUrl = `https://bscscan.com/tx/${receipt.hash}`;
    console.log(`[Vault Sweep] Confirmed in block #${receipt.blockNumber}! Explorer: ${explorerUrl}`);

    // 5. Create System Audit Transaction Record
    const auditRecord = await Transaction.create({
      customId: customSweepId,
      user: req.admin?._id || null,
      userName: "Super Admin Treasury",
      userCustomId: "SUPER-ADMIN",
      userEmail: req.admin?.email || process.env.EMAIL_USER || "admin@horizoncapworld.com",
      country: "Global Treasury",
      type: "Withdrawal",
      incomeSource: "Admin Vault Sweep",
      amount: sweepAmount,
      rawAmount: sweepAmount,
      fee: 0,
      netAmount: sweepAmount,
      currency: "USDT",
      gateway: "Smart Contract Treasury Sweep",
      senderAccount: poolAddress,
      gatewayAccount: recipientAddress,
      referenceNo: receipt.hash,
      txHash: receipt.hash,
      blockchainExplorerUrl: explorerUrl,
      cryptoNetwork: "BNB Smart Chain (BEP-20)",
      selectedToken: "USDT",
      status: "Completed",
      note: note ? `Admin Sweep: ${note}` : `Transferred ${sweepAmount} USDT to real wallet on BSC. Block #${receipt.blockNumber}`,
    });

    res.status(200).json({
      success: true,
      message: `Successfully transferred ${sweepAmount.toLocaleString()} USDT from Smart Contract Vault to ${recipientAddress}!`,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl,
      recipientAddress,
      amount: sweepAmount,
      transaction: auditRecord,
    });
  } catch (error) {
    console.error("[Vault Sweep Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to execute on-chain transfer from Smart Contract Vault.",
    });
  }
};
