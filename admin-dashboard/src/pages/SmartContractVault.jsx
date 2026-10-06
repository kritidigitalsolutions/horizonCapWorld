import React, { useState, useEffect, useCallback } from 'react';
import {
  RiShieldCheckLine, RiExchangeDollarLine, RiArrowDownCircleLine,
  RiArrowUpCircleLine, RiRefreshLine, RiFileCopyLine, RiCheckLine,
  RiExternalLinkLine, RiCoinsLine, RiWallet3Line, RiInformationLine,
  RiAlertLine, RiFlashlightLine, RiShieldKeyholeLine, RiSearchLine,
  RiCheckboxCircleLine, RiLoader4Line, RiGasStationLine, RiCompass3Line
} from 'react-icons/ri';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { getVaultOverview, executeAdminSweep } from '../api/vaultApi';

export default function SmartContractVault() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vaultData, setVaultData] = useState(null);

  // Sweep Form State
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [recentSweepResult, setRecentSweepResult] = useState(null);

  // Monitor Search & Filter
  const [search, setSearch] = useState('');
  const [filterDirection, setFilterDirection] = useState('all'); // all, INFLOW, OUTFLOW

  // Copy Feedback
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!', 'Success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchVault = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await getVaultOverview();
      if (res?.success) {
        setVaultData(res);
        if (isManualRefresh) {
          toast.success('On-chain balances and transaction records synced!', 'Vault Synced');
        }
      }
    } catch (err) {
      console.error('Failed to load vault data:', err);
      toast.danger('Could not sync on-chain contract state.', 'Sync Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVault();
    const interval = setInterval(() => fetchVault(false), 20000); // 20s live sync
    return () => clearInterval(interval);
  }, [fetchVault]);

  // Handle Sweep Submission
  const handleInitiateSweep = (e) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!recipientAddress.trim() || !recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
      toast.warning('Please enter a valid 42-character BSC / BEP-20 destination address.', 'Invalid Address');
      return;
    }
    if (!numAmt || numAmt <= 0) {
      toast.warning('Please enter a valid USDT amount greater than 0.', 'Invalid Amount');
      return;
    }
    if (vaultData && numAmt > vaultData.poolBalanceUsdt) {
      toast.warning(`Amount exceeds available vault reserve ($${vaultData.poolBalanceUsdt.toFixed(2)} USDT available).`, 'Insufficient Vault Balance');
      return;
    }
    setConfirmModalOpen(true);
  };

  const handleConfirmSweep = async () => {
    setSweeping(true);
    try {
      const res = await executeAdminSweep({
        recipientAddress: recipientAddress.trim(),
        amount: parseFloat(amount),
        note: note.trim() || undefined,
      });

      if (res?.success) {
        toast.success(res.message || 'On-chain sweep executed successfully!', 'Transfer Confirmed');
        setRecentSweepResult(res);
        setConfirmModalOpen(false);
        setAmount('');
        setNote('');
        fetchVault(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to execute on-chain transfer.';
      toast.danger(msg, 'Sweep Failed');
    } finally {
      setSweeping(false);
    }
  };

  // Filter transfers
  const filteredTransfers = (vaultData?.transfers || []).filter((t) => {
    const matchDir = filterDirection === 'all' || t.direction === filterDirection;
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.txHash.toLowerCase().includes(q) ||
      t.from.toLowerCase().includes(q) ||
      t.to.toLowerCase().includes(q) ||
      (t.recipientName || '').toLowerCase().includes(q);
    return matchDir && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in font-poppins pb-12">
      {/* ──────── HEADER ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-outfit">
              Smart Contract Vault & Treasury
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              BSC Mainnet · Chain 56
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time on-chain liquidity monitoring, investor transaction audit, and autonomous sweep to real admin wallet.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchVault(true)}
            disabled={refreshing || loading}
            icon={<RiRefreshLine className={refreshing ? 'animate-spin' : ''} />}
          >
            {refreshing ? 'Syncing...' : 'Sync On-Chain'}
          </Button>

          {vaultData?.contractExplorerUrl && (
            <a
              href={vaultData.contractExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <span>Inspect on BscScan</span>
              <RiExternalLinkLine size={13} />
            </a>
          )}
        </div>
      </div>

      {/* ──────── TOP KPI METRICS CARDS ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Vault USDT Balance */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border border-emerald-300 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-poppins">
              Vault USDT Reserve
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
              <RiWallet3Line size={18} />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              ${loading ? '...' : (vaultData?.poolBalanceUsdt ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live BSC Contract Reserve
            </p>
          </div>
        </div>

        {/* 2. Relayer Gas Reserve (BNB) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-gold-500/5 to-white border border-gold-300 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-900 font-poppins">
              Relayer Gas Reserve
            </span>
            <span className="p-1.5 rounded-xl bg-gold-100 text-gold-700">
              <RiGasStationLine size={18} />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {loading ? '...' : (vaultData?.relayerBnb ?? 0).toFixed(4)} <span className="text-xs font-bold text-slate-500 font-sans">BNB</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {(vaultData?.relayerBnb || 0) > 0.002 ? '● Gas Ready for Instant Sweeps' : '⚠️ Gas low, fund relayer'}
            </p>
          </div>
        </div>

        {/* 3. Total Deposits Collected */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-poppins">
              Total Inflow (Deposits)
            </span>
            <span className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <RiArrowDownCircleLine size={18} className="text-emerald-500" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              ${loading ? '...' : (vaultData?.metrics?.totalDepositsVolume ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Accumulated investor deposits
            </p>
          </div>
        </div>

        {/* 4. Total Outflow / Sweeps */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-poppins">
              Total Sweeps / Outflow
            </span>
            <span className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <RiArrowUpCircleLine size={18} className="text-amber-500" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              ${loading ? '...' : ((vaultData?.metrics?.totalSweepsVolume || 0) + (vaultData?.metrics?.totalPayoutsDisbursed || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Disbursed to Real Wallets
            </p>
          </div>
        </div>

        {/* 5. Total Transactions Count */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-poppins">
              Contract Operations
            </span>
            <span className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <RiCompass3Line size={18} className="text-blue-500" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {loading ? '...' : (vaultData?.metrics?.totalTransactionCount ?? 0)}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Total on-chain & platform events
            </p>
          </div>
        </div>
      </div>

      {/* ──────── CORE OPERATIONS GRID: SWEEP FORM & PROTOCOL DETAILS ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT: ADMIN VAULT SWEEP / TRANSFER ENGINE (7 COLS) ── */}
        <div className="lg:col-span-7 card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-gold-100 text-gold-800">
                  <RiFlashlightLine size={20} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-poppins">
                    Admin Vault Sweep Engine
                  </h2>
                  <p className="text-xs text-slate-500 font-normal">
                    Transfer & withdraw accumulated USDT from the Smart Contract Vault pool to your real external wallet.
                  </p>
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
              <RiShieldCheckLine size={14} /> Instant On-Chain Dispatch
            </span>
          </div>

          <form onSubmit={handleInitiateSweep} className="space-y-4">
            {/* Input 1: Destination Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins flex items-center gap-1">
                  <span>Destination Real Wallet Address (BEP-20)</span>
                  <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text && text.startsWith('0x')) {
                        setRecipientAddress(text.trim());
                        toast.success('Pasted address from clipboard!', 'Pasted');
                      }
                    } catch {
                      toast.info('Paste your destination address manually.', 'Clipboard Note');
                    }
                  }}
                  className="text-[11px] font-bold text-gold-700 hover:text-gold-900 cursor-pointer font-poppins"
                >
                  Paste from Clipboard
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 0x71C... (MetaMask, TrustWallet, or Binance Deposit Address)"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value.trim())}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:bg-white focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none transition-all shadow-inner"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-poppins">
                Must be a valid Binance Smart Chain BEP-20 receiving address. Funds are transferred directly on-chain.
              </p>
            </div>

            {/* Input 2: Amount with MAX button & presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins flex items-center gap-1">
                  <span>Transfer Amount (USDT)</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500 font-mono">
                  Available in Vault: <strong className="text-emerald-700 font-bold">${(vaultData?.poolBalanceUsdt ?? 0).toFixed(2)} USDT</strong>
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-20 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold font-mono text-slate-900 focus:bg-white focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setAmount(String(vaultData?.poolBalanceUsdt || '0'))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gold-400 hover:bg-gold-500 text-slate-950 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer font-poppins"
                >
                  MAX
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {[10, 50, 100, 250, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-gold-100 text-slate-700 text-[11px] font-bold font-mono border border-slate-200 transition-colors cursor-pointer"
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Input 3: Transfer Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-poppins">
                Audit Note / Reason (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Treasury sweep to cold storage / Profit realization"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-gold-400 outline-none font-poppins"
              />
            </div>

            {/* Live Fee & Routing Preview */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5 font-poppins">
              <div className="flex justify-between text-slate-600">
                <span>Protocol Routing:</span>
                <span className="font-bold text-slate-900 font-mono">0x439D... Pool ➔ Destination Wallet</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Network / Asset:</span>
                <span className="font-bold text-emerald-700 font-mono">BNB Smart Chain / USDT (BEP-20)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Gas Covered By:</span>
                <span className="font-mono text-slate-700">Relayer ({vaultData?.relayerBnb?.toFixed(4) || '0.00'} BNB Ready)</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={sweeping || !vaultData?.poolBalanceUsdt}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-500 via-amber-500 to-gold-600 hover:from-gold-600 hover:to-amber-600 text-slate-950 font-black text-sm tracking-wide shadow-gold transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
            >
              {sweeping ? (
                <>
                  <RiLoader4Line size={18} className="animate-spin" />
                  <span>Broadcasting Transaction to BSC...</span>
                </>
              ) : (
                <>
                  <RiFlashlightLine size={18} />
                  <span>Transfer USDT To Real Wallet</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── RIGHT: PROTOCOL SPECIFICATION & SECURITY CARDS (5 COLS) ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Contract Card */}
          <div className="card p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-poppins flex items-center gap-1.5">
              <RiShieldKeyholeLine className="text-gold-600" size={16} />
              Vault Protocol Specification
            </h3>

            <div className="space-y-3 text-xs">
              {/* Pool Address */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Master Settlement Pool (Smart Contract)
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-slate-800 text-xs truncate select-all">
                    {vaultData?.poolAddress || '0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3'}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(vaultData?.poolAddress || '0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3', 'pool')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                      title="Copy Address"
                    >
                      {copiedKey === 'pool' ? <RiCheckLine size={13} className="text-emerald-600" /> : <RiFileCopyLine size={13} />}
                    </button>
                    <a
                      href={vaultData?.contractExplorerUrl || 'https://bscscan.com/address/0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3#tokentxns'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                      title="Inspect on BscScan"
                    >
                      <RiExternalLinkLine size={13} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Relayer Address */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Backend Relayer Signer & Owner
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-slate-800 text-xs truncate select-all">
                    {vaultData?.relayerAddress || '0x1B892C03E3031288137951693F4E40553Dd2E5f6'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(vaultData?.relayerAddress || '0x1B892C03E3031288137951693F4E40553Dd2E5f6', 'relayer')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer flex-shrink-0"
                    title="Copy Relayer Address"
                  >
                    {copiedKey === 'relayer' ? <RiCheckLine size={13} className="text-emerald-600" /> : <RiFileCopyLine size={13} />}
                  </button>
                </div>
              </div>

              {/* USDT Token Contract */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Binance-Peg USDT Contract Address
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-emerald-800 text-xs truncate select-all">
                    {vaultData?.usdtTokenAddress || '0x55d398326f99059fF775485246999027B3197955'}
                  </span>
                  <a
                    href="https://bscscan.com/token/0x55d398326f99059fF775485246999027B3197955"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer flex-shrink-0"
                    title="View USDT Token on BscScan"
                  >
                    <RiExternalLinkLine size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="p-4 bg-amber-50/80 rounded-3xl border border-amber-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold font-poppins">
              <RiInformationLine size={16} className="text-amber-600" />
              <span>How Vault Sweeping Works</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-poppins text-[11px]">
              When investors deposit via the smart contract or dynamic QR codes, funds settle on the master depository pool. The sweep engine allows super-admin to withdraw accumulated USDT on-chain directly to an external cold wallet at any time.
            </p>
          </div>
        </div>
      </div>

      {/* ──────── REAL-TIME TRANSACTION & SWEEP MONITOR ──────── */}
      <div className="card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 font-poppins">
                Live Smart Contract Transaction Monitor
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                {filteredTransfers.length} Events
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Real-time on-chain deposits, investor sub-vault inflows, and treasury sweeps.
            </p>
          </div>

          {/* Controls: Search & Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'all', label: 'All Transfers' },
                { id: 'INFLOW', label: '↓ Inflows (Deposits)' },
                { id: 'OUTFLOW', label: '↑ Outflows (Sweeps)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterDirection(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterDirection === tab.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search hash or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-gold-400 font-poppins w-48 sm:w-60"
              />
              <RiSearchLine size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Transfers Table */}
        <div className="overflow-x-auto">
          <table className="data-table font-poppins">
            <thead>
              <tr className="text-slate-400 font-medium text-xs tracking-wider">
                <th className="font-medium text-slate-500 whitespace-nowrap">Direction</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Event Type</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Amount</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Transaction Hash</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Destination / Recipient</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Timestamp</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Status</th>
                <th className="text-right pr-6 font-medium text-slate-500 whitespace-nowrap">Explorer</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.length > 0 ? (
                filteredTransfers.map((tx, idx) => (
                  <tr key={tx._id || idx} className="hover:bg-slate-50/70 transition-colors">
                    {/* Direction */}
                    <td className="whitespace-nowrap">
                      {tx.direction === 'INFLOW' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                          <RiArrowDownCircleLine size={12} className="text-emerald-600" />
                          INFLOW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                          <RiArrowUpCircleLine size={12} className="text-amber-600" />
                          OUTFLOW
                        </span>
                      )}
                    </td>

                    {/* Event Type */}
                    <td className="whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-900 block">
                        {tx.type}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {tx.recipientName || 'Investor Vault'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="whitespace-nowrap font-mono font-bold text-xs text-slate-900">
                      <span className={tx.direction === 'INFLOW' ? 'text-emerald-700' : 'text-amber-700'}>
                        {tx.direction === 'INFLOW' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans ml-1">USDT</span>
                    </td>

                    {/* Tx Hash */}
                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-slate-700 max-w-[150px] truncate select-all bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {tx.txHash || tx.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(tx.txHash || tx.id, tx.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copy TxHash"
                        >
                          {copiedKey === tx.id ? <RiCheckLine size={12} className="text-emerald-600" /> : <RiFileCopyLine size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-600 max-w-[150px] truncate block select-all">
                        {tx.to}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="whitespace-nowrap text-xs text-slate-500 font-mono">
                      {tx.date} <span className="text-slate-400">· {tx.time}</span>
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap">
                      <Badge variant="success" size="sm">
                        {tx.status}
                      </Badge>
                    </td>

                    {/* Action */}
                    <td className="text-right pr-6 whitespace-nowrap">
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 hover:bg-gold-100 text-slate-700 hover:text-gold-900 text-xs font-semibold border border-slate-200 transition-colors"
                        title="View on BscScan"
                      >
                        <span>BscScan</span>
                        <RiExternalLinkLine size={12} />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──────── CONFIRMATION MODAL BEFORE SWEEP ──────── */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm On-Chain Vault Sweep"
        subtitle="Authorize transfer of smart contract pool funds directly to your wallet"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModalOpen(false)} disabled={sweeping}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={sweeping ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
              onClick={handleConfirmSweep}
              disabled={sweeping}
            >
              {sweeping ? 'Executing on BSC...' : 'Confirm & Broadcast'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-poppins text-xs">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <RiAlertLine size={16} className="text-amber-600" />
              <span>Please review carefully:</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              This action executes a live smart contract call on the <strong>Binance Smart Chain Mainnet</strong>. Funds will leave the contract pool and deposit into your specified destination address.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500">Amount to Transfer:</span>
              <span className="font-mono font-bold text-base text-slate-900">${amount} USDT</span>
            </div>
            <div className="flex justify-between items-start pb-2 border-b border-slate-200/60 gap-2">
              <span className="text-slate-500 shrink-0">Destination:</span>
              <span className="font-mono font-bold text-slate-800 text-right break-all select-all">
                {recipientAddress}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500">Origin Contract Pool:</span>
              <span className="font-mono text-slate-700">0x439DBd3A...</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Estimated Settlement:</span>
              <span className="font-bold text-emerald-700">~3 Seconds (BSC Block Confirmation)</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* ──────── SUCCESSFUL SWEEP CELEBRATION MODAL ──────── */}
      {recentSweepResult && (
        <Modal
          isOpen={!!recentSweepResult}
          onClose={() => setRecentSweepResult(null)}
          title="On-Chain Transfer Confirmed!"
          subtitle="Your sweep transaction was successfully mined on Binance Smart Chain"
          size="md"
          footer={
            <Button variant="primary" onClick={() => setRecentSweepResult(null)}>
              Done
            </Button>
          }
        >
          <div className="text-center py-4 space-y-4 font-poppins">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-gold animate-bounce">
              <RiCheckboxCircleLine size={36} />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                ${recentSweepResult.amount} USDT Dispatched
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Funds have been transferred from the smart contract vault to your destination wallet on BSC Mainnet.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-1 font-mono">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Transaction Hash:
              </span>
              <span className="text-slate-800 text-xs break-all select-all block">
                {recentSweepResult.txHash}
              </span>
            </div>

            <a
              href={recentSweepResult.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-950 font-bold text-xs shadow-gold transition-all"
            >
              <span>View On BscScan</span>
              <RiExternalLinkLine size={14} />
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
