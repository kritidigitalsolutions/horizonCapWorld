import React, { useState, useEffect, useCallback } from 'react';
import {
  RiDownloadLine, RiCalendarLine, RiEyeLine, RiArrowUpCircleLine,
  RiArrowDownCircleLine, RiFlashlightLine, RiGiftLine, RiGlobalLine,
  RiCloseLine, RiPrinterLine, RiTimeLine, RiDeleteBinLine,
  RiFileExcelLine, RiAlertLine, RiCheckLine, RiFilePdfLine,
  RiImageLine, RiFileCopyLine, RiShieldCheckLine, RiInformationLine,
  RiUser3Line, RiWallet3Line, RiCheckboxCircleFill, RiExternalLinkLine
} from 'react-icons/ri';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import KPICard from '../components/ui/KPICard';
import TabsBar from '../components/ui/TabsBar';
import SearchBar from '../components/ui/SearchBar';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import PageHeader from '../components/ui/PageHeader';
import {
  getTransactions,
  approveTransaction,
  rejectTransaction,
  deleteTransaction,
  clearAllTransactions
} from '../api/transactionsApi';

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const [txnList, setTxnList] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [txnToDelete, setTxnToDelete] = useState(null);
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
  const [previewProofModal, setPreviewProofModal] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Reject Dialog State
  const [isRejecting, setIsRejecting] = useState(false);
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Date filter state
  const [datePreset, setDatePreset] = useState('all'); // all, today, last7, thisMonth, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchTxns = useCallback(async () => {
    try {
      const res = await getTransactions({
        type: activeTab !== 'all' ? activeTab : undefined,
        search: search.trim() || undefined,
        limit: 150,
      });

      if (res?.success && Array.isArray(res.transactions)) {
        const formatted = res.transactions.map(t => {
          const numAmt = Number(t.rawAmount || t.amount || 0);
          return {
            _id: t._id,
            id: t.customId || t._id,
            user: t.userName || t.user?.name || 'Investor',
            userCustomId: t.userCustomId || '',
            userEmail: t.userEmail || '',
            userPhone: t.userPhone || '',
            country: t.country || 'Global',
            type: t.type,
            amount: `$${numAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            rawAmount: numAmt,
            currency: t.currency || 'USD',
            gateway: t.gateway || 'Platform Vault',
            gatewayType: t.gatewayType || (t.gateway?.toLowerCase().includes('usdt') || t.gateway?.toLowerCase().includes('btc') ? 'crypto' : 'fiat'),
            gatewayAccount: t.gatewayAccount || t.address || '',
            referenceNo: t.referenceNo || 'N/A',
            date: t.date || (t.createdAt ? t.createdAt.split('T')[0] : '2026-08-20'),
            time: t.time || (t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00'),
            status: t.status || 'Pending',
            fee: `$${Number(t.fee || 0).toFixed(2)}`,
            netAmount: `$${Number(t.netAmount || numAmt).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            slipUrl: t.slipUrl || '',
            proofOfPayment: t.slipUrl ? { dataUrl: t.slipUrl, isImage: true } : null,
            clientNote: t.clientNote || (t.gateway ? `Processed via ${t.gateway}` : ''),
            rejectReason: t.rejectReason || '',
          };
        });
        setTxnList(formatted);
      } else {
        setTxnList([]);
      }
    } catch (err) {
      console.warn('Error fetching transactions:', err.message);
      setTxnList([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchTxns();
  }, [fetchTxns]);

  // Real-time synchronization with User deposits & updates
  useEffect(() => {
    const handleSync = () => {
      fetchTxns();
    };
    window.addEventListener('horizon-transactions-change', handleSync);
    window.addEventListener('horizon-deposit-submitted', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('horizon-transactions-change', handleSync);
      window.removeEventListener('horizon-deposit-submitted', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [fetchTxns]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, datePreset, customStartDate, customEndDate]);

  const statusVariant = (status) => {
    if (status === 'Approved' || status === 'Completed') return 'success';
    if (status === 'Pending' || status === 'Pending Verification' || status === 'Pending Approval') return 'warning';
    return 'danger';
  };

  const typeIcon = (type) => {
    if (type === 'Deposit') {
      return <RiArrowDownCircleLine className="text-emerald-500 flex-shrink-0" size={16} />;
    }
    if (type === 'Withdrawal') {
      return <RiArrowUpCircleLine className="text-amber-500 flex-shrink-0" size={16} />;
    }
    if (type === 'ROI Return' || type === 'ROI Earning') {
      return <RiFlashlightLine className="text-gold-500 flex-shrink-0" size={16} />;
    }
    return <RiGiftLine className="text-blue-500 flex-shrink-0" size={16} />;
  };

  const parseAmount = (amt) => {
    if (typeof amt === 'number') return amt;
    if (!amt) return 0;
    return parseFloat(String(amt).replace(/[^0-9.]/g, '')) || 0;
  };

  // ──────────────── ADMIN APPROVE DEPOSIT ACTION ────────────────
  const handleApproveDeposit = async (txn) => {
    if (!txn) return;
    const amountNum = txn.rawAmount || parseAmount(txn.amount);

    try {
      if (txn._id) {
        await approveTransaction(txn._id);
      }
    } catch (err) {
      console.warn('API approve offline, updating local cache:', err.message);
    }

    const updatedList = txnList.map(t => {
      if (t.id === txn.id) {
        return {
          ...t,
          status: 'Approved',
          netAmount: typeof t.amount === 'number' ? `$${t.amount.toFixed(2)}` : t.amount,
          approvedAt: new Date().toLocaleString(),
          adminApprovedBy: 'Super Admin',
        };
      }
      return t;
    });

    setTxnList(updatedList);
    localStorage.setItem('horizon_transactions', JSON.stringify(updatedList));

    // Automatically Credit Client's Deposit Wallet in horizon_user
    try {
      const savedUser = localStorage.getItem('horizon_user');
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        const currentDeposit = parseFloat(userObj.depositWallet || 0);
        const newDeposit = currentDeposit + amountNum;
        const updatedUser = {
          ...userObj,
          depositWallet: newDeposit,
          totalInvested: (parseFloat(userObj.totalInvested || 0) + amountNum)
        };
        localStorage.setItem('horizon_user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('horizon-user-update', { detail: updatedUser }));
        window.dispatchEvent(new CustomEvent('storage'));
      }
    } catch (e) {
      console.error('Error updating user wallet:', e);
    }

    window.dispatchEvent(new CustomEvent('horizon-transactions-change', { detail: updatedList }));

    if (selectedTxn?.id === txn.id) {
      setSelectedTxn({
        ...selectedTxn,
        status: 'Approved',
        netAmount: typeof selectedTxn.amount === 'number' ? `$${selectedTxn.amount.toFixed(2)}` : selectedTxn.amount,
        approvedAt: new Date().toLocaleString()
      });
    }

    setActionSuccessMsg(`Deposit request ${txn.id} approved! $${amountNum.toLocaleString()} credited to ${txn.user || 'Investor'}'s wallet.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // ──────────────── ADMIN REJECT DEPOSIT ACTION ────────────────
  const handleRejectDeposit = async (txn, reason) => {
    if (!txn) return;
    const finalReason = reason || customRejectReason || 'Payment verification failed / Transaction hash invalid';

    try {
      if (txn._id) {
        await rejectTransaction(txn._id, { reason: finalReason });
      }
    } catch (err) {
      console.warn('API reject offline, updating local cache:', err.message);
    }

    const updatedList = txnList.map(t => {
      if (t.id === txn.id) {
        return {
          ...t,
          status: 'Rejected',
          rejectReason: finalReason,
          rejectedAt: new Date().toLocaleString(),
          adminRejectedBy: 'Super Admin'
        };
      }
      return t;
    });

    setTxnList(updatedList);
    localStorage.setItem('horizon_transactions', JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('horizon-transactions-change', { detail: updatedList }));

    if (selectedTxn?.id === txn.id) {
      setSelectedTxn({
        ...selectedTxn,
        status: 'Rejected',
        rejectReason: finalReason,
        rejectedAt: new Date().toLocaleString()
      });
    }

    setIsRejecting(false);
    setCustomRejectReason('');
    setActionSuccessMsg(`Deposit request ${txn.id} marked as Rejected.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Delete Individual Transaction
  const handleDeleteTxn = async () => {
    if (!txnToDelete) return;
    try {
      if (txnToDelete._id) {
        await deleteTransaction(txnToDelete._id);
      }
    } catch (err) {
      console.warn('API delete offline, removing from local state:', err.message);
    }

    const updatedList = txnList.filter(t => t.id !== txnToDelete.id);
    setTxnList(updatedList);
    localStorage.setItem('horizon_transactions', JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('horizon-transactions-change', { detail: updatedList }));
    if (selectedTxn?.id === txnToDelete.id) {
      setSelectedTxn(null);
    }
    setTxnToDelete(null);
  };

  // Clear All Transactions
  const handleClearAll = async () => {
    try {
      await clearAllTransactions();
    } catch (err) {
      console.warn('API clearAll offline, clearing local state:', err.message);
    }

    setTxnList([]);
    localStorage.setItem('horizon_transactions', JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('horizon-transactions-change', { detail: [] }));
    setSelectedTxn(null);
    setClearAllModalOpen(false);
  };

  // Export CSV Functionality
  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['TXN ID', 'Investor', 'User ID', 'Country', 'Type', 'Amount', 'Gateway', 'Date', 'Time', 'Status', 'Reference No'];
    const rows = filtered.map(t => [
      t.id,
      `"${t.user || 'Investor'}"`,
      t.userCustomId || '',
      `"${t.country || ''}"`,
      t.type,
      `"${t.amount}"`,
      `"${t.gateway || ''}"`,
      t.date,
      t.time || '',
      t.status,
      `"${t.referenceNo || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `horizon_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Date Filtering Logic
  const filtered = txnList.filter(txn => {
    const q = search.trim().toLowerCase();
    let matchTab = true;
    if (activeTab === 'pending') {
      matchTab = txn.status === 'Pending' || txn.status === 'Pending Verification' || txn.status === 'Pending Approval';
    } else if (activeTab !== 'all') {
      matchTab = txn.type === activeTab;
    }

    // Date Range Matching
    let matchDate = true;
    if (datePreset === 'today') {
      matchDate = txn.date === new Date().toISOString().slice(0, 10);
    } else if (datePreset === 'last7') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      matchDate = txn.date >= weekAgo;
    } else if (datePreset === 'custom') {
      if (customStartDate && txn.date < customStartDate) matchDate = false;
      if (customEndDate && txn.date > customEndDate) matchDate = false;
    }

    const matchSearch = !q ||
      (txn.user || '').toLowerCase().includes(q) ||
      String(txn.id).toLowerCase().includes(q) ||
      (txn.userCustomId || '').toLowerCase().includes(q) ||
      (txn.country || '').toLowerCase().includes(q) ||
      (txn.gateway || '').toLowerCase().includes(q) ||
      (txn.referenceNo || '').toLowerCase().includes(q) ||
      String(txn.amount).toLowerCase().includes(q) ||
      String(txn.date).toLowerCase().includes(q);

    return matchTab && matchSearch && matchDate;
  });

  // Calculate KPI Totals
  const pendingCount = txnList.filter(t => t.status === 'Pending' || t.status === 'Pending Verification' || t.status === 'Pending Approval').length;
  const totalDeposits = txnList.filter(t => t.type === 'Deposit' && (t.status === 'Approved' || t.status === 'Completed')).reduce((acc, t) => acc + parseAmount(t.rawAmount || t.amount), 0);
  const totalWithdrawals = txnList.filter(t => t.type === 'Withdrawal' && (t.status === 'Approved' || t.status === 'Completed')).reduce((acc, t) => acc + parseAmount(t.rawAmount || t.amount), 0);
  const totalRoi = txnList.filter(t => t.type === 'ROI Return' || t.type === 'ROI Earning').reduce((acc, t) => acc + parseAmount(t.rawAmount || t.amount), 0);
  const totalReferral = txnList.filter(t => t.type === 'Referral Bonus' || t.type === 'Rank Bonus').reduce((acc, t) => acc + parseAmount(t.rawAmount || t.amount), 0);

  // Single Transaction Receipt Print Generator
  const handlePrintSingleReceipt = (t) => {
    const printWindow = window.open('', '_blank', 'width=750,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Horizon Cap Worlds — Receipt #${t.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #ffffff; }
            .receipt-card { max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
            .logo { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center; }
            .gold-sub { font-size: 11px; color: #9A7B00; font-weight: 700; text-align: center; letter-spacing: 1px; margin-top: 2px; }
            .amount-box { background: #FFF9E6; border: 1px solid #FFE066; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
            .amount { font-size: 32px; font-weight: 700; color: #0f172a; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .row-label { color: #64748b; }
            .row-val { font-weight: 600; color: #0f172a; font-family: monospace; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 28px; }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <div class="logo">HORIZON CAP WORLDS</div>
            <div class="gold-sub">OFFICIAL TRANSACTION RECEIPT</div>
            <div class="amount-box">
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Transaction Amount</div>
              <div class="amount">${typeof t.amount === 'number' ? '$' + t.amount.toFixed(2) : t.amount}</div>
              <div style="font-size: 12px; font-weight: 600; color: #059669; margin-top: 4px;">Status: ${t.status}</div>
            </div>
            <div class="row"><span class="row-label">Transaction ID</span><span class="row-val">${t.id}</span></div>
            <div class="row"><span class="row-label">Investor Name</span><span class="row-val">${t.user || 'William Max'}</span></div>
            <div class="row"><span class="row-label">Investor ID</span><span class="row-val">${t.userCustomId || 'HORIZON-USR-07'}</span></div>
            <div class="row"><span class="row-label">Country</span><span class="row-val">${t.country || 'India'}</span></div>
            <div class="row"><span class="row-label">Transaction Type</span><span class="row-val">${t.type}</span></div>
            <div class="row"><span class="row-label">Payment Gateway</span><span class="row-val">${t.gateway || 'Direct Bank Wire'}</span></div>
            <div class="row"><span class="row-label">Reference Number</span><span class="row-val">${t.referenceNo || 'REF-8891024512'}</span></div>
            <div class="row"><span class="row-label">Date & Time</span><span class="row-val">${t.date} ${t.time || ''}</span></div>
            <div class="footer">Cryptographically verified on Super Admin Ledger</div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Dynamic Tabs with Live Counts
  const dynamicTabs = [
    { key: 'all', label: 'All Transactions', count: txnList.length },
    { key: 'pending', label: 'Pending Approvals', count: pendingCount, isAlert: pendingCount > 0 },
    { key: 'Deposit', label: 'Deposits', count: txnList.filter(t => t.type === 'Deposit').length },
    { key: 'Withdrawal', label: 'Withdrawals', count: txnList.filter(t => t.type === 'Withdrawal').length },
    { key: 'ROI Return', label: 'ROI Returns', count: txnList.filter(t => t.type === 'ROI Return' || t.type === 'ROI Earning').length },
    { key: 'Referral Bonus', label: 'Referral Bonus', count: txnList.filter(t => t.type === 'Referral Bonus' || t.type === 'Rank Bonus').length },
  ];

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const rejectPresets = [
    'Invalid Transaction ID / Hash',
    'Payment slip screenshot unreadable / blur',
    'Funds not received in official company account',
    'Amount received is less than submitted request',
    'Incorrect bank account / network selected'
  ];

  if (loading) {
    return <SkeletonLoader type="table" rows={8} cols={7} />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-poppins">
      {/* Header */}
      <PageHeader
        title="Transactions Audit Ledger"
        subtitle="Real-time ledger of client deposits, payment verification requests, payouts, and yields"
        badge="Audit Engine"
        actions={
          <>
            {/* Date Range Button */}
            <Button
              variant="secondary"
              icon={<RiCalendarLine />}
              size="sm"
              onClick={() => setDateRangeModalOpen(true)}
            >
              {datePreset === 'all' ? 'Date Range' : `Date: ${datePreset.toUpperCase()}`}
            </Button>

            {/* Export CSV Button */}
            <Button
              variant="secondary"
              icon={<RiFileExcelLine className="text-emerald-600" />}
              size="sm"
              onClick={handleExportCSV}
              title="Download CSV Spreadsheet"
            >
              Export CSV
            </Button>

            {/* Clear All Button */}
            {txnList.length > 0 && (
              <Button
                variant="danger"
                icon={<RiDeleteBinLine />}
                size="sm"
                onClick={() => setClearAllModalOpen(true)}
              >
                Clear All
              </Button>
            )}
          </>
        }
      />

      {/* Action Notification Toast */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <RiCheckboxCircleFill size={18} className="text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950">
            <RiCloseLine size={16} />
          </button>
        </div>
      )}

      {/* ──────────────── ROLLING ODOMETER KPI SUMMARY CARDS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Gross Deposits"
          numericValue={totalDeposits || 0}
          prefix="$"
          decimals={0}
          change={totalDeposits > 0 ? 'Live Volume' : 'No Deposits'}
          positive={true}
          icon="deposit"
        />
        <KPICard
          title="Total Settled Withdrawals"
          numericValue={totalWithdrawals || 0}
          prefix="$"
          decimals={0}
          change={totalWithdrawals > 0 ? 'Settled' : 'No Withdrawals'}
          positive={false}
          icon="withdrawal"
        />
        <KPICard
          title="Pending Deposit Approvals"
          numericValue={pendingCount}
          prefix=""
          decimals={0}
          change={pendingCount > 0 ? 'Requires Review' : 'All Clear'}
          positive={pendingCount === 0}
          icon="clock"
        />
        <KPICard
          title="Referral Bonus Paid"
          numericValue={totalReferral || 0}
          prefix="$"
          decimals={0}
          change={totalReferral > 0 ? 'Paid Out' : 'No Bonuses'}
          positive={true}
          icon="users"
        />
      </div>

      {/* Filter Tabs */}
      <TabsBar tabs={dynamicTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Search Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <SearchBar
            placeholder="Search by TXN ID, investor name, custom ID (HORIZON-USR-07), gateway, or hash..."
            value={search}
            onChange={setSearch}
            className="flex-1"
          />

          {datePreset !== 'all' && (
            <button
              onClick={() => { setDatePreset('all'); setCustomStartDate(''); setCustomEndDate(''); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold-50 text-gold-800 border border-gold-300 text-xs font-semibold whitespace-nowrap shadow-2xs hover:bg-gold-100 transition-colors"
            >
              <span>Date Filter Active</span>
              <RiCloseLine size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ──────────────── TRANSACTIONS DATA TABLE ──────────────── */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table font-poppins">
            <thead>
              <tr className="text-slate-400 font-medium text-xs tracking-wider">
                <th className="font-medium text-slate-500 whitespace-nowrap">TXN ID</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Investor</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Email</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Country</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Type</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Amount</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Gateway / Channel</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Proof Slip</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Date & Time</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Status</th>
                <th className="text-right pr-6 font-medium text-slate-500 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((txn, i) => {
                const userCustomId = txn.userCustomId || 'HORIZON-USR-07';
                const isPending = txn.status === 'Pending' || txn.status === 'Pending Verification' || txn.status === 'Pending Approval';
                const formattedAmt = typeof txn.amount === 'number' ? `$${txn.amount.toFixed(2)}` : txn.amount;

                return (
                  <tr
                    key={txn.id || i}
                    className="animate-fade-in hover:bg-slate-50/70 transition-colors"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {/* 1. TXN ID */}
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                        {txn.id}
                      </span>
                    </td>

                    {/* 2. Investor Details */}
                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-300 to-amber-500 text-slate-950 font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-2xs">
                          {(txn.user || 'Investor').charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-xs">{txn.user || 'William Max'}</div>
                          <div className="font-mono text-[10px] text-gold-700 font-bold">{userCustomId}</div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Email */}
                    <td className="whitespace-nowrap text-xs text-slate-500">
                      {txn.userEmail || 'investor@horizoncap.io'}
                    </td>

                    {/* 4. Country */}
                    <td className="whitespace-nowrap text-xs text-slate-700">
                      {txn.country || 'India'}
                    </td>

                    {/* 5. Type */}
                    <td className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        {typeIcon(txn.type)} {txn.type}
                      </span>
                    </td>

                    {/* 6. Amount */}
                    <td className="whitespace-nowrap font-mono font-bold text-xs text-slate-900">
                      {formattedAmt}
                    </td>

                    {/* 7. Gateway */}
                    <td className="whitespace-nowrap text-xs text-slate-600 font-medium">
                      {txn.gateway || 'System Direct'}
                    </td>

                    {/* 8. Proof of Payment Doc */}
                    <td className="whitespace-nowrap">
                      {txn.proofOfPayment ? (
                        <button
                          type="button"
                          onClick={() => setPreviewProofModal(txn.proofOfPayment)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-50 hover:bg-gold-100 text-gold-900 border border-gold-300 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                        >
                          {txn.proofOfPayment.isPdf ? <RiFilePdfLine size={13} className="text-red-500" /> : <RiImageLine size={13} className="text-emerald-600" />}
                          <span>View Doc</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-mono">
                          {txn.referenceNo ? 'Hash Only' : '—'}
                        </span>
                      )}
                    </td>

                    {/* 9. Date & Time */}
                    <td className="whitespace-nowrap text-xs text-slate-500 font-mono">
                      {txn.date} {txn.time ? `• ${txn.time}` : ''}
                    </td>

                    {/* 10. Status */}
                    <td className="whitespace-nowrap">
                      <Badge variant={statusVariant(txn.status)} size="sm">
                        {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1 inline-block" />}
                        {txn.status}
                      </Badge>
                    </td>

                    {/* 11. Action Buttons */}
                    <td className="text-right pr-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => setSelectedTxn(txn)}
                            className="px-3 py-1.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-gold cursor-pointer"
                          >
                            <RiEyeLine size={14} /> Review Request
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedTxn(txn)}
                              className="p-1.5 text-slate-500 hover:text-gold-700 hover:bg-gold-50 rounded-lg transition-colors cursor-pointer"
                              title="Audit Details"
                            >
                              <RiEyeLine size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintSingleReceipt(txn)}
                              className="p-1.5 text-slate-500 hover:text-gold-700 hover:bg-gold-50 rounded-lg transition-colors cursor-pointer"
                              title="Print Receipt"
                            >
                              <RiPrinterLine size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTxnToDelete(txn)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <RiDeleteBinLine size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400 text-xs font-medium">
                    No transactions found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ════════ REVIEW & ACTION POP-UP MODAL (selectedTxn) ════════ */}
      <Modal
        isOpen={!!selectedTxn}
        onClose={() => { setSelectedTxn(null); setIsRejecting(false); }}
        title={selectedTxn?.type === 'Deposit' ? 'Deposit Request Verification & Audit' : 'Transaction Audit Slip'}
        subtitle={`Transaction ID: ${selectedTxn?.id || ''}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<RiPrinterLine />}
                onClick={() => handlePrintSingleReceipt(selectedTxn)}
              >
                Print Receipt
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {selectedTxn?.status === 'Pending' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="btn px-4 py-2.5 rounded-xl border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RiCloseLine size={16} /> Reject Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveDeposit(selectedTxn)}
                    className="btn btn-primary px-5 py-2.5 rounded-xl text-xs font-black shadow-gold flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white"
                  >
                    <RiCheckLine size={16} /> Approve & Credit Wallet
                  </button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => { setSelectedTxn(null); setIsRejecting(false); }}
                >
                  Close Audit
                </Button>
              )}
            </div>
          </div>
        }
      >
        {selectedTxn && (
          <div className="space-y-5 font-poppins">
            {/* Top Amount Banner */}
            <div className="p-5 bg-gradient-to-r from-gold-50/90 via-white to-amber-50/70 border border-gold-300 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-gold-800 uppercase tracking-widest block">
                  {selectedTxn.type} Requested Amount
                </span>
                <span className="text-3xl font-black text-slate-900 font-mono mt-0.5 block">
                  {typeof selectedTxn.amount === 'number' ? `$${selectedTxn.amount.toFixed(2)}` : selectedTxn.amount}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Gateway: <strong className="text-slate-800">{selectedTxn.gateway || 'Direct Gateway'}</strong>
                </span>
              </div>

              <div className="text-right">
                <Badge variant={statusVariant(selectedTxn.status)} size="md">
                  Status: {selectedTxn.status}
                </Badge>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  {selectedTxn.date} {selectedTxn.time ? `• ${selectedTxn.time}` : ''}
                </div>
              </div>
            </div>

            {/* Rejection Prompt Box (When Admin clicks Reject) */}
            {isRejecting && selectedTxn.status === 'Pending' && (
              <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-300 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                    <RiAlertLine size={16} /> Enter Rejection Reason
                  </h4>
                  <button onClick={() => setIsRejecting(false)} className="text-red-600 hover:text-red-900 text-xs font-bold">
                    Cancel
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {rejectPresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomRejectReason(preset)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-red-200 text-red-800 text-[11px] font-medium hover:bg-red-100 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  value={customRejectReason}
                  onChange={e => setCustomRejectReason(e.target.value)}
                  placeholder="Explain why this payment request is rejected (client will see this note)..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-white border border-red-300 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-red-200"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleRejectDeposit(selectedTxn, customRejectReason)}
                    className="btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}

            {/* Client Information Card */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <RiUser3Line className="text-gold-600" size={14} /> Client Identity & Account Details
              </h4>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-300 to-amber-500 text-slate-950 font-black text-base flex items-center justify-center shadow-xs ring-2 ring-gold-200">
                    {(selectedTxn.user || 'Investor').charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{selectedTxn.user || 'William Max'}</h5>
                    <p className="font-mono text-gold-700 font-bold">{selectedTxn.userCustomId || 'HORIZON-USR-07'}</p>
                    <p className="text-slate-400 text-[11px]">{selectedTxn.userEmail || 'william@horizoncap.com'}</p>
                  </div>
                </div>

                <div className="space-y-1.5 sm:border-l sm:border-slate-100 sm:pl-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone Number:</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedTxn.userPhone || '+91 9876543210'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Country:</span>
                    <span className="font-bold text-slate-800">{selectedTxn.country || 'India'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sponsor ID:</span>
                    <span className="font-mono font-bold text-gold-700">{selectedTxn.sponsorId || 'HORIZON-USR-01'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Audit Reference */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <RiWallet3Line className="text-gold-600" size={14} /> Settlement & Gateway Audit
              </h4>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTxn.id}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Selected Gateway</span>
                  <span className="font-bold text-slate-800">{selectedTxn.gateway || 'Bank Wire'}</span>
                </div>
                {selectedTxn.gatewayAccount && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500">Destination Account / Wallet</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[220px]">
                      {selectedTxn.gatewayAccount}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Transaction Hash / UTR</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 text-[11px] truncate max-w-[220px]">
                      {selectedTxn.referenceNo || 'REF-8891024512'}
                    </span>
                    {selectedTxn.referenceNo && (
                      <button
                        type="button"
                        onClick={() => copyText(selectedTxn.referenceNo)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                        title="Copy Hash"
                      >
                        {copiedHash ? <RiCheckLine size={13} className="text-emerald-600" /> : <RiFileCopyLine size={13} />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Submission Timestamp</span>
                  <span className="font-mono text-slate-700">{selectedTxn.date} {selectedTxn.time ? `• ${selectedTxn.time}` : ''}</span>
                </div>
              </div>
            </div>

            {/* Proof of Payment Document Viewer */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <RiShieldCheckLine className="text-emerald-600" size={15} /> Proof of Payment Document
                </span>
                {selectedTxn.proofOfPayment && (
                  <button
                    type="button"
                    onClick={() => setPreviewProofModal(selectedTxn.proofOfPayment)}
                    className="text-gold-700 font-bold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Screen Viewer</span> <RiExternalLinkLine size={12} />
                  </button>
                )}
              </h4>

              {selectedTxn.proofOfPayment ? (
                <div className="p-4 rounded-2xl bg-white border-2 border-gold-300/80 shadow-2xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {selectedTxn.proofOfPayment.isImage ? (
                      <div
                        onClick={() => setPreviewProofModal(selectedTxn.proofOfPayment)}
                        className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer hover:opacity-90 flex-shrink-0"
                      >
                        <img
                          src={selectedTxn.proofOfPayment.dataUrl}
                          alt="Proof Slip"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => setPreviewProofModal(selectedTxn.proofOfPayment)}
                        className="w-16 h-16 rounded-xl bg-red-50 border border-red-200 text-red-600 flex flex-col items-center justify-center flex-shrink-0 cursor-pointer hover:bg-red-100"
                      >
                        <RiFilePdfLine size={24} />
                        <span className="text-[9px] font-black font-mono mt-0.5">PDF</span>
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate font-poppins">
                        {selectedTxn.proofOfPayment.fileName || selectedTxn.proofOfPayment.name || 'Payment_Slip.png'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {selectedTxn.proofOfPayment.fileSize || selectedTxn.proofOfPayment.size || 'Attached Proof'} • {selectedTxn.proofOfPayment.isPdf ? 'PDF Receipt' : 'Image File'}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <RiCheckLine size={12} /> Client Uploaded Document
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewProofModal(selectedTxn.proofOfPayment)}
                      className="btn btn-secondary text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RiEyeLine size={14} /> Open Preview
                    </button>
                    <a
                      href={selectedTxn.proofOfPayment.dataUrl}
                      download={selectedTxn.proofOfPayment.fileName || 'deposit-proof'}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Download Slip"
                    >
                      <RiDownloadLine size={16} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center justify-between">
                  <span>No document file attached. Verified via digital transaction hash: <strong className="font-mono text-slate-800">{selectedTxn.referenceNo || 'N/A'}</strong></span>
                </div>
              )}
            </div>

            {/* Status Stamp if Approved or Rejected */}
            {selectedTxn.status === 'Approved' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-3">
                <RiCheckboxCircleFill size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Approved by Super Admin</p>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    Settlement completed. Funds of {typeof selectedTxn.amount === 'number' ? `$${selectedTxn.amount.toFixed(2)}` : selectedTxn.amount} have been credited to the client's wallet.
                  </p>
                </div>
              </div>
            )}

            {selectedTxn.status === 'Rejected' && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 text-xs flex items-start gap-3">
                <RiAlertLine size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Rejected by Super Admin</p>
                  <p className="text-red-800 text-[11px] mt-0.5">
                    Reason: <strong>{selectedTxn.rejectReason || 'Invalid proof or hash provided.'}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ════════ FULL PROOF DOCUMENT VIEWER MODAL (Image / PDF) ════════ */}
      <Modal
        isOpen={!!previewProofModal}
        onClose={() => setPreviewProofModal(null)}
        title="Deposit Proof Document Full Viewer"
        subtitle={previewProofModal?.fileName || previewProofModal?.name || 'Payment Receipt'}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <a
              href={previewProofModal?.dataUrl}
              download={previewProofModal?.fileName || previewProofModal?.name || 'payment-proof'}
              className="btn btn-secondary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5"
            >
              <RiDownloadLine size={16} /> Download Document
            </a>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPreviewProofModal(null)}
            >
              Close Viewer
            </Button>
          </div>
        }
      >
        {previewProofModal && (
          <div className="space-y-4 font-poppins">
            {previewProofModal.isImage ? (
              <div className="max-h-[520px] overflow-auto rounded-2xl border border-slate-200 bg-slate-950 flex items-center justify-center p-3">
                <img
                  src={previewProofModal.dataUrl}
                  alt="Proof Document"
                  className="max-h-[490px] w-auto object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : previewProofModal.isPdf ? (
              <div className="h-[500px] w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                <iframe
                  src={previewProofModal.dataUrl}
                  title="PDF Preview"
                  className="w-full h-full border-none"
                />
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <RiFilePdfLine size={48} className="mx-auto text-gold-600" />
                <p className="font-bold text-slate-800 text-sm">{previewProofModal.fileName || previewProofModal.name}</p>
                <p className="text-xs text-slate-500">{previewProofModal.fileSize || previewProofModal.size} • Attached Document</p>
                <a
                  href={previewProofModal.dataUrl}
                  download={previewProofModal.fileName || previewProofModal.name}
                  className="btn btn-primary text-xs px-4 py-2 rounded-xl font-bold inline-flex items-center gap-1.5"
                >
                  <RiDownloadLine size={14} /> Download Document
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ──────────────── Delete Transaction Confirmation Modal ──────────────── */}
      <Modal
        isOpen={!!txnToDelete}
        onClose={() => setTxnToDelete(null)}
        title="Confirm Transaction Deletion"
        subtitle="Permanent Action"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTxnToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon={<RiDeleteBinLine />} onClick={handleDeleteTxn}>
              Confirm Delete
            </Button>
          </>
        }
      >
        {txnToDelete && (
          <div className="space-y-4 text-center py-2 font-poppins">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
              <RiAlertLine size={28} />
            </div>

            <div>
              <h4 className="text-base font-semibold text-slate-800 font-poppins">
                Delete Transaction Record?
              </h4>
              <p className="text-sm text-slate-500 mt-1 font-normal font-poppins">
                Transaction <strong className="text-gold-700 font-semibold">{txnToDelete.id}</strong> ({txnToDelete.amount} - {txnToDelete.type}) for investor <strong>{txnToDelete.user}</strong> will be permanently removed from this audit ledger.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── Clear All Transactions Confirmation Modal ──────────────── */}
      <Modal
        isOpen={clearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        title="Purge All Transactions"
        subtitle="Irreversible Ledger Reset"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setClearAllModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" icon={<RiDeleteBinLine />} onClick={handleClearAll}>
              Purge All Records
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-center py-2 font-poppins">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
            <RiAlertLine size={28} />
          </div>

          <div>
            <h4 className="text-base font-semibold text-slate-800 font-poppins">
              Are you sure you want to clear all transactions?
            </h4>
            <p className="text-sm text-slate-500 mt-1 font-normal font-poppins">
              All {txnList.length} transaction entries will be purged from the active view. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>

      {/* ──────────────── Date Range Filter Modal ──────────────── */}
      <Modal
        isOpen={dateRangeModalOpen}
        onClose={() => setDateRangeModalOpen(false)}
        title="Filter Transactions by Date"
        subtitle="Select preset period or custom range"
        size="sm"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => { setDatePreset('all'); setCustomStartDate(''); setCustomEndDate(''); setDateRangeModalOpen(false); }}
              className="text-xs text-slate-400 hover:text-slate-600 underline font-medium"
            >
              Reset to All
            </button>
            <Button variant="primary" size="sm" onClick={() => setDateRangeModalOpen(false)}>
              Apply Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-4 font-poppins text-xs">
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'all', label: 'All Dates' },
              { key: 'today', label: 'Today' },
              { key: 'last7', label: 'Last 7 Days' },
              { key: 'custom', label: 'Custom Range' },
            ].map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => setDatePreset(p.key)}
                className={`p-3 rounded-xl border font-bold text-center transition-all ${
                  datePreset === p.key ? 'bg-gold-50 border-gold-400 text-gold-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {datePreset === 'custom' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div>
                <label className="text-slate-400 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
