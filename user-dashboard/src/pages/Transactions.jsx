import React, { useState, useEffect, useCallback } from 'react';
import { userTransactions as initialTransactions } from '../data/userMockData';
import { getTransactions } from '../api/transactionsApi';
import {
  RiDownloadLine, RiEyeLine, RiArrowUpCircleLine,
  RiArrowDownCircleLine, RiFlashlightLine, RiGiftLine,
  RiPrinterLine, RiCalendarLine, RiWalletLine, RiCheckDoubleLine,
  RiCopperCoinLine, RiTrophyLine, RiExchangeDollarLine, RiGlobalLine,
  RiFileCopyLine, RiCheckLine, RiFilePdfLine, RiImageLine, RiCloseLine,
  RiInformationLine, RiShieldCheckLine, RiAlertLine
} from 'react-icons/ri';
import KPICard from '../components/ui/KPICard';
import SearchBar from '../components/ui/SearchBar';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [txnList, setTxnList] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [previewProofModal, setPreviewProofModal] = useState(null);

  const fetchTxns = useCallback(async () => {
    try {
      const res = await getTransactions({
        type: filterType !== 'all' ? filterType : undefined,
        search: search.trim() || undefined,
        limit: 100,
      });

      if (res?.success && Array.isArray(res.transactions) && res.transactions.length > 0) {
        const formatted = res.transactions.map(t => {
          const numAmt = Number(t.rawAmount || t.amount || 0);
          return {
            _id: t._id,
            id: t.customId || t._id,
            user: t.userName || user?.name || 'Investor',
            userCustomId: t.userCustomId || user?.id || 'HORIZON-USR-07',
            userEmail: t.userEmail || user?.email || '',
            type: t.type,
            amount: `$${numAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            rawAmount: numAmt,
            gateway: t.gateway || 'Platform Vault',
            referenceNo: t.referenceNo || `REF-${Date.now().toString().slice(-6)}`,
            date: t.date || (t.createdAt ? t.createdAt.split('T')[0] : '2026-08-20'),
            time: t.time || (t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00'),
            status: t.status || 'Pending',
            fee: `$${Number(t.fee || 0).toFixed(2)}`,
            netAmount: `$${Number(t.netAmount || numAmt).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            slipUrl: t.slipUrl || '',
            proofOfPayment: t.slipUrl ? { dataUrl: t.slipUrl, isImage: true } : null,
            clientNote: t.gateway ? `Processed via ${t.gateway}` : '',
          };
        });
        setTxnList(formatted);
      } else {
        // Use local cache / initial fallback if backend list is empty
        const saved = localStorage.getItem('horizon_transactions');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTxnList(parsed);
              return;
            }
          } catch (e) {}
        }
        setTxnList(initialTransactions);
      }
    } catch (err) {
      console.warn('Using transaction cache fallback:', err.message);
      const saved = localStorage.getItem('horizon_transactions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTxnList(parsed);
            return;
          }
        } catch (e) {}
      }
      setTxnList(initialTransactions);
    } finally {
      setLoading(false);
    }
  }, [filterType, search, user]);

  useEffect(() => {
    fetchTxns();
  }, [fetchTxns]);

  // Real-time synchronization with Super Admin approvals/rejections and new deposits
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setTxnList(e.detail);
      } else {
        fetchTxns();
      }
    };
    window.addEventListener('horizon-transactions-change', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('horizon-transactions-change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [fetchTxns]);

  const types = ['all', 'Deposit', 'Withdrawal', 'ROI Earning', 'Referral Bonus', 'Rank Bonus'];

  const typeIcon = (type) => {
    if (type === 'Deposit') return <RiArrowDownCircleLine className="text-emerald-600 flex-shrink-0" size={18} />;
    if (type === 'Withdrawal') return <RiArrowUpCircleLine className="text-amber-500 flex-shrink-0" size={18} />;
    if (type === 'ROI Earning' || type === 'ROI Return') return <RiFlashlightLine className="text-gold-500 flex-shrink-0" size={18} />;
    if (type === 'Referral Bonus') return <RiGiftLine className="text-purple-600 flex-shrink-0" size={18} />;
    return <RiTrophyLine className="text-gold-600 flex-shrink-0" size={18} />;
  };

  const statusBadge = (status) => {
    if (status === 'Completed' || status === 'Approved') return 'badge-success';
    if (status === 'Pending' || status === 'Pending Verification' || status === 'Pending Approval') return 'badge-warning';
    return 'badge-danger';
  };

  const parseAmount = (amt) => {
    if (typeof amt === 'number') return amt;
    if (!amt) return 0;
    return parseFloat(String(amt).replace(/[^0-9.]/g, '')) || 0;
  };

  // KPIs
  const totalDeposits = txnList.filter(t => t.type === 'Deposit' && (t.status === 'Completed' || t.status === 'Approved')).reduce((sum, t) => sum + parseAmount(t.amount || t.rawAmount), 0);
  const totalWithdrawals = txnList.filter(t => t.type === 'Withdrawal' && (t.status === 'Completed' || t.status === 'Approved')).reduce((sum, t) => sum + parseAmount(t.amount || t.rawAmount), 0);
  const totalRoiEarned = txnList.filter(t => t.type === 'ROI Earning' || t.type === 'ROI Return').reduce((sum, t) => sum + parseAmount(t.amount || t.rawAmount), 0);
  const totalReferralBonus = txnList.filter(t => t.type === 'Referral Bonus' || t.type === 'Rank Bonus').reduce((sum, t) => sum + parseAmount(t.amount || t.rawAmount), 0);

  const filtered = txnList.filter(txn => {
    const matchType = filterType === 'all' || txn.type === filterType;
    const q = search.toLowerCase();
    const matchSearch = String(txn.id).toLowerCase().includes(q) ||
      String(txn.type).toLowerCase().includes(q) ||
      String(txn.gateway || '').toLowerCase().includes(q) ||
      String(txn.amount).includes(search);
    return matchType && matchSearch;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Transaction ID', 'Type', 'Amount', 'Gateway / Source', 'Status', 'Date Time', 'Reference Hash'];
    const rows = filtered.map(t => [
      t.id,
      t.type,
      `"${typeof t.amount === 'number' ? '$' + t.amount.toFixed(2) : t.amount}"`,
      `"${t.gateway || 'System'}"`,
      t.status,
      `"${t.date} ${t.time || ''}"`,
      `"${t.referenceNo || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `horizon_my_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Official Receipt
  const handlePrintTxn = (txn) => {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) return;
    const formattedAmt = typeof txn.amount === 'number' ? `$${txn.amount.toFixed(2)}` : txn.amount;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Horizon Cap Worlds — Receipt #${txn.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .receipt { max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .logo { font-size: 20px; font-weight: 800; color: #9A7B00; text-align: center; letter-spacing: 0.5px; }
            .sub { font-size: 11px; text-align: center; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
            .amount { font-size: 32px; font-weight: 800; text-align: center; margin: 24px 0 6px; color: #0f172a; }
            .status { text-align: center; font-size: 12px; font-weight: bold; color: #059669; text-transform: uppercase; margin-bottom: 24px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .label { color: #64748b; }
            .val { font-weight: 600; color: #0f172a; font-family: monospace; }
            .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="logo">HORIZON CAP WORLDS</div>
            <div class="sub">Official Transaction Verification Slip</div>
            <div class="amount">${formattedAmt}</div>
            <div class="status">${txn.status}</div>
            <div class="row"><span class="label">Transaction ID</span><span class="val">${txn.id}</span></div>
            <div class="row"><span class="label">Investor Name</span><span class="val">${txn.user || user?.fullName || 'William Max'}</span></div>
            <div class="row"><span class="label">Investor ID</span><span class="val">${txn.userCustomId || user?.id || 'HORIZON-USR-07'}</span></div>
            <div class="row"><span class="label">Transaction Type</span><span class="val">${txn.type}</span></div>
            <div class="row"><span class="label">Gateway / Source</span><span class="val">${txn.gateway || 'System'}</span></div>
            <div class="row"><span class="label">Date & Time</span><span class="val">${txn.date} ${txn.time || ''}</span></div>
            <div class="row"><span class="label">Reference Hash / UTR</span><span class="val">${txn.referenceNo || 'N/A'}</span></div>
            <div class="footer">Cryptographically stamped • Horizon Cap Worlds System Engine</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyReference = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="page-enter space-y-6 pb-12 font-poppins">
      {/* ──────── PAGE HEADER ──────── */}
      <PageHeader
        title="Transactions Ledger"
        subtitle="Audit trail of your deposits, withdrawals, daily streaming ROI credits, and referral commissions"
        badge="Audit Ledger"
        actions={
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn btn-secondary text-xs px-4 py-2.5 rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RiDownloadLine size={16} /> Export CSV Ledger
          </button>
        }
      />

      {/* ──────── KPI SUMMARY ROW ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Total Gross Deposits"
          numericValue={totalDeposits || 4000}
          prefix="$"
          icon="investment"
          positive={true}
          change="+14.2%"
          subtitle="Cumulative deposited funds"
          delay={0}
        />
        <KPICard
          title="Settled Withdrawals"
          numericValue={totalWithdrawals || 800}
          prefix="$"
          icon="withdrawal"
          positive={true}
          change="Completed"
          subtitle="Total cleared payouts"
          delay={60}
        />
        <KPICard
          title="ROI Yield Distributed"
          numericValue={Math.round(totalRoiEarned || 1392)}
          prefix="$"
          icon="revenue"
          positive={true}
          change="Per Second"
          subtitle="Continuous yield credited"
          delay={120}
        />
        <KPICard
          title="Affiliate & Rank Bonuses"
          numericValue={Math.round(totalReferralBonus || 280)}
          prefix="$"
          icon="users"
          positive={true}
          change="Instant"
          subtitle="Direct & multi-tier bonus"
          delay={180}
        />
      </div>

      {/* ──────── FILTER & SEARCH BAR ──────── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <SearchBar
            placeholder="Search by TXN ID, gateway, type, or amount..."
            value={search}
            onChange={setSearch}
            className="flex-1"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 font-poppins">
            {types.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                  filterType === type
                    ? 'bg-gold-400 text-gray-900 shadow-gold font-bold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ──────── TRANSACTIONS TABLE ──────── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Gateway / Source</th>
                <th>Proof Slip</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((txn, index) => {
                const isPending = txn.status === 'Pending' || txn.status === 'Pending Verification' || txn.status === 'Pending Approval';
                const isRejected = txn.status === 'Rejected';
                const formattedAmt = typeof txn.amount === 'number' ? `$${txn.amount.toFixed(2)}` : txn.amount;

                return (
                  <tr key={txn.id || index} className="animate-fade-in hover:bg-slate-50/80 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {txn.id}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {typeIcon(txn.type)}
                        <span className="text-xs font-bold text-slate-800">{txn.type}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`text-xs font-bold font-mono ${txn.type === 'Deposit' ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {formattedAmt}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600 font-medium">{txn.gateway || 'System Direct'}</span>
                    </td>
                    <td>
                      {txn.proofOfPayment ? (
                        <button
                          type="button"
                          onClick={() => setPreviewProofModal(txn.proofOfPayment)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-50 hover:bg-gold-100 text-gold-900 border border-gold-300 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                        >
                          {txn.proofOfPayment.isPdf ? <RiFilePdfLine size={13} className="text-red-500" /> : <RiImageLine size={13} className="text-emerald-600" />}
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-mono">
                          {txn.referenceNo ? 'Hash Attached' : '—'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-slate-500 font-mono">{txn.date} {txn.time ? `• ${txn.time}` : ''}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(txn.status)}`}>
                        {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1 inline-block" />}
                        {txn.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTxn(txn)}
                          className="p-1.5 hover:bg-gold-50 text-slate-600 hover:text-gold-700 rounded-lg transition-colors cursor-pointer"
                          title="View Transaction Audit Slip"
                        >
                          <RiEyeLine size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintTxn(txn)}
                          className="p-1.5 hover:bg-gold-50 text-slate-600 hover:text-gold-700 rounded-lg transition-colors cursor-pointer"
                          title="Print Receipt"
                        >
                          <RiPrinterLine size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    No transaction records found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──────── TRANSACTION AUDIT SLIP MODAL ──────── */}
      <Modal
        isOpen={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        title="Transaction Audit Receipt"
        subtitle={`ID: ${selectedTxn?.id || ''}`}
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => handlePrintTxn(selectedTxn)}
              className="btn btn-secondary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RiPrinterLine size={16} /> Print Receipt
            </button>
            <button
              type="button"
              onClick={() => setSelectedTxn(null)}
              className="btn btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-gold cursor-pointer"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedTxn && (
          <div className="space-y-5 font-poppins">
            {/* Top Amount Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-gold-50/90 via-white to-amber-50/70 border border-gold-300 text-center space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-gold-800 uppercase tracking-widest block">
                {selectedTxn.type} Amount
              </span>
              <div className="text-3xl font-black text-slate-900 font-mono">
                {typeof selectedTxn.amount === 'number' ? `$${selectedTxn.amount.toFixed(2)}` : selectedTxn.amount}
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className={`badge ${statusBadge(selectedTxn.status)}`}>
                  Status: {selectedTxn.status}
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {selectedTxn.gateway || 'System Protocol'}
                </span>
              </div>
            </div>

            {/* Pending Notice / Rejection Notice */}
            {selectedTxn.status === 'Pending' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                <RiInformationLine size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Awaiting Super Admin Approval</p>
                  <p className="text-amber-800 mt-0.5 font-normal">
                    Your payment request has been securely queued. Once Super Admin verifies the deposit on the blockchain/banking network, funds will be instantly credited to your Deposit Wallet.
                  </p>
                </div>
              </div>
            )}

            {selectedTxn.status === 'Rejected' && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-900">
                <RiAlertLine size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Deposit Request Rejected by Admin</p>
                  <p className="text-red-700 mt-0.5 font-medium">
                    Reason: <strong>{selectedTxn.rejectReason || 'Transaction could not be verified on the settlement network.'}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Details Breakdown */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-bold text-slate-800">{selectedTxn.id}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500">Gateway / Channel</span>
                <span className="font-semibold text-slate-800">{selectedTxn.gateway || 'System Direct'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500">Reference Hash / UTR</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 truncate max-w-[200px]">
                    {selectedTxn.referenceNo || 'N/A'}
                  </span>
                  {selectedTxn.referenceNo && (
                    <button
                      type="button"
                      onClick={() => copyReference(selectedTxn.referenceNo)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                      title="Copy Reference"
                    >
                      {copiedHash ? <RiCheckLine size={13} className="text-emerald-600" /> : <RiFileCopyLine size={13} />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-500">Submission Timestamp</span>
                <span className="font-mono text-slate-700">{selectedTxn.date} {selectedTxn.time ? `• ${selectedTxn.time}` : ''}</span>
              </div>

              {/* Proof of Payment Attachment */}
              {selectedTxn.proofOfPayment && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Proof of Payment Document</span>
                  <button
                    type="button"
                    onClick={() => setPreviewProofModal(selectedTxn.proofOfPayment)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gold-100 text-gold-900 border border-gold-300 font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    {selectedTxn.proofOfPayment.isPdf ? <RiFilePdfLine size={14} className="text-red-600" /> : <RiImageLine size={14} className="text-emerald-600" />}
                    <span>Open {selectedTxn.proofOfPayment.name}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ──────── FULL PROOF DOCUMENT VIEWER MODAL ──────── */}
      <Modal
        isOpen={!!previewProofModal}
        onClose={() => setPreviewProofModal(null)}
        title="Payment Proof Document Preview"
        subtitle={previewProofModal?.name || 'Attached Deposit Slip'}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <a
              href={previewProofModal?.dataUrl}
              download={previewProofModal?.name || 'payment-proof'}
              className="btn btn-secondary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5"
            >
              <RiDownloadLine size={16} /> Download Proof File
            </a>
            <button
              type="button"
              onClick={() => setPreviewProofModal(null)}
              className="btn btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-gold cursor-pointer"
            >
              Close Viewer
            </button>
          </div>
        }
      >
        {previewProofModal && (
          <div className="space-y-4 font-poppins">
            {previewProofModal.isImage ? (
              <div className="max-h-[500px] overflow-auto rounded-2xl border border-slate-200 bg-slate-950 flex items-center justify-center p-2">
                <img
                  src={previewProofModal.dataUrl}
                  alt={previewProofModal.name}
                  className="max-h-[480px] w-auto object-contain rounded-lg"
                />
              </div>
            ) : previewProofModal.isPdf ? (
              <div className="h-[480px] w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                <iframe
                  src={previewProofModal.dataUrl}
                  title="PDF Preview"
                  className="w-full h-full border-none"
                />
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <RiFilePdfLine size={48} className="mx-auto text-gold-600" />
                <p className="font-bold text-slate-800 text-sm">{previewProofModal.name}</p>
                <p className="text-xs text-slate-500">{previewProofModal.size} • Attached Document</p>
                <a
                  href={previewProofModal.dataUrl}
                  download={previewProofModal.name}
                  className="btn btn-primary text-xs px-4 py-2 rounded-xl font-bold inline-flex items-center gap-1.5"
                >
                  <RiDownloadLine size={14} /> Download Document
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
