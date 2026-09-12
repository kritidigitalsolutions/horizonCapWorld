import React, { useState, useEffect, useCallback } from 'react';
import {
  RiTeamLine, RiFlashlightLine, RiCoinsLine, RiCalculatorLine,
  RiCheckLine, RiEditLine, RiNodeTree, RiUserLine, RiShieldCheckLine,
  RiGroupLine, RiMoneyDollarCircleLine, RiPercentLine, RiSearchLine,
  RiArrowRightLine, RiInformationLine, RiEyeLine, RiAddLine,
  RiDeleteBinLine, RiCloseLine, RiAlertLine, RiSparklingLine
} from 'react-icons/ri';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import KPICard from '../components/ui/KPICard';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import PageHeader from '../components/ui/PageHeader';
import {
  getReferralSettings,
  updateReferralToggles,
  createReferralTier,
  updateReferralSetting,
  deleteReferralTier,
  getPromotersNetwork
} from '../api/referralsApi';

export default function Referrals() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans', 'promoters'
  const [commissions, setCommissions] = useState([]);
  const [promoterList, setPromoterList] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Master Global Toggles
  const [toggles, setToggles] = useState({
    referralDepositCommissionEnabled: true,
    referralRoiShareEnabled: true,
    referralSystemEnabled: true,
  });
  const [savingToggle, setSavingToggle] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Add Tier Modal State (Level 6+)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLevelNum, setAddLevelNum] = useState(12);
  const [addName, setAddName] = useState('');
  const [addDepositAmount, setAddDepositAmount] = useState('0');
  const [addProfitAmount, setAddProfitAmount] = useState('0');
  const [addRoiPerDay, setAddRoiPerDay] = useState('0.08');
  const [addEligibleConditions, setAddEligibleConditions] = useState('No Condition');
  const [addGroupVolumeMin, setAddGroupVolumeMin] = useState('0');
  const [addDirectClientsMin, setAddDirectClientsMin] = useState('0');
  const [addInvestComm, setAddInvestComm] = useState('1.0');
  const [addEarnComm, setAddEarnComm] = useState('0.5');
  const [addStatus, setAddStatus] = useState('Active');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Commission Modal State
  const [editingCommission, setEditingCommission] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDepositAmount, setEditDepositAmount] = useState('0');
  const [editProfitAmount, setEditProfitAmount] = useState('0');
  const [editRoiPerDay, setEditRoiPerDay] = useState('0.08');
  const [editEligibleConditions, setEditEligibleConditions] = useState('');
  const [editGroupVolumeMin, setEditGroupVolumeMin] = useState('0');
  const [editDirectClientsMin, setEditDirectClientsMin] = useState('0');
  const [editInvestComm, setEditInvestComm] = useState('');
  const [editEarnComm, setEditEarnComm] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [testDepositAmount, setTestDepositAmount] = useState('10000');
  const [testMonthlyYield, setTestMonthlyYield] = useState('1500');

  // Delete Confirmation State
  const [deletingTier, setDeletingTier] = useState(null);

  // Promoter Downline Tree Audit Drawer State
  const [selectedPromoter, setSelectedPromoter] = useState(null);

  const fetchReferralData = useCallback(async () => {
    try {
      const [settingsRes, promotersRes] = await Promise.allSettled([
        getReferralSettings(),
        getPromotersNetwork({ search: search.trim() || undefined })
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value?.success) {
        if (Array.isArray(settingsRes.value.settings)) {
          setCommissions(settingsRes.value.settings);
        }
        if (settingsRes.value.toggles) {
          setToggles(settingsRes.value.toggles);
        }
      }

      if (promotersRes.status === 'fulfilled' && promotersRes.value?.success && Array.isArray(promotersRes.value.promoters)) {
        setPromoterList(promotersRes.value.promoters);
      } else {
        setPromoterList([]);
      }
    } catch (err) {
      console.warn('Error fetching referrals data:', err.message);
      setCommissions([]);
      setPromoterList([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  const showNotification = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Toggle master commission switches
  const handleToggleSwitch = async (key) => {
    setSavingToggle(key);
    const updatedValue = !toggles[key];
    const newToggles = { ...toggles, [key]: updatedValue };
    setToggles(newToggles);

    try {
      const res = await updateReferralToggles({ [key]: updatedValue });
      if (res?.success && res.toggles) {
        setToggles(res.toggles);
      }
      showNotification(`Referral switch updated: ${key === 'referralDepositCommissionEnabled' ? 'Direct Deposit Commission' : 'Daily ROI Profit Share'} is now ${updatedValue ? 'ENABLED' : 'PAUSED'}.`);
      window.dispatchEvent(new CustomEvent('horizon-referrals-change', { detail: newToggles }));
    } catch (err) {
      console.error('Error updating referral toggle:', err.message);
      setToggles(toggles);
      showNotification('Failed to update toggle. Please check backend connection.');
    } finally {
      setSavingToggle(null);
    }
  };

  // Open Add New Level Modal
  const openAddTierModal = () => {
    const highestNum = commissions.reduce((max, c) => Math.max(max, Number(c.levelNumber || 0)), 0);
    const nextNum = (highestNum || commissions.length || 11) + 1;
    setAddLevelNum(nextNum);
    setAddName(`Level ${nextNum}`);
    setAddDepositAmount('0');
    setAddProfitAmount('0');
    setAddRoiPerDay('0.08');
    setAddEligibleConditions('No Condition');
    setAddGroupVolumeMin('0');
    setAddDirectClientsMin('0');
    setAddInvestComm('0.5');
    setAddEarnComm('0.5');
    setAddStatus('Active');
    setIsAddModalOpen(true);
  };

  // Handle Create New Level
  const handleCreateTier = async () => {
    setIsSubmittingAdd(true);
    try {
      const res = await createReferralTier({
        levelNumber: addLevelNum,
        name: addName.trim() || `Level ${addLevelNum}`,
        depositAmount: Number(addDepositAmount) || 0,
        profitAmount: Number(addProfitAmount) || 0,
        roiPerDay: Number(addRoiPerDay) || 0.08,
        eligibleConditions: addEligibleConditions.trim() || 'No Condition',
        groupVolumeMin: Number(addGroupVolumeMin) || 0,
        directClientsMin: Number(addDirectClientsMin) || 0,
        investCommission: `${addInvestComm}%`,
        earningsCommission: `${addEarnComm}%`,
        status: addStatus,
      });

      if (res?.success && res.tier) {
        setCommissions(prev => [...prev, res.tier].sort((a, b) => a.levelNumber - b.levelNumber));
        showNotification(`Level ${addLevelNum} tier created successfully!`);
        setIsAddModalOpen(false);
        fetchReferralData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create new level.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Open Edit Commission Modal
  const openEditCommission = (c) => {
    setEditingCommission(c);
    setEditName(c.name || `Level ${c.levelNumber || c.level}`);
    setEditDepositAmount(String(c.depositAmount ?? 0));
    setEditProfitAmount(String(c.profitAmount ?? 0));
    setEditRoiPerDay(String(c.roiPerDay ?? 0.08));
    setEditEligibleConditions(c.eligibleConditions || 'No Condition');
    setEditGroupVolumeMin(String(c.groupVolumeMin ?? 0));
    setEditDirectClientsMin(String(c.directClientsMin ?? 0));
    setEditInvestComm(String(c.investCommission || '5').replace('%', ''));
    setEditEarnComm(String(c.earningsCommission || '1').replace('%', ''));
    setEditStatus(c.status || 'Active');
    setTestDepositAmount('10000');
    setTestMonthlyYield('1500');
  };

  const handleSaveCommission = async () => {
    if (!editingCommission) return;

    try {
      const res = await updateReferralSetting(editingCommission._id || editingCommission.level, {
        name: editName.trim(),
        depositAmount: Number(editDepositAmount) || 0,
        profitAmount: Number(editProfitAmount) || 0,
        roiPerDay: Number(editRoiPerDay) || 0,
        eligibleConditions: editEligibleConditions.trim(),
        groupVolumeMin: Number(editGroupVolumeMin) || 0,
        directClientsMin: Number(editDirectClientsMin) || 0,
        investCommission: `${editInvestComm}%`,
        earningsCommission: `${editEarnComm}%`,
        status: editStatus,
      });

      if (res?.success) {
        showNotification(`${editingCommission.name || editingCommission.level} settings updated successfully.`);
      }
    } catch (err) {
      console.warn('API update referral error:', err.message);
    }

    const updated = commissions.map(c => (c.level === editingCommission.level || c._id === editingCommission._id) ? {
      ...c,
      name: editName.trim(),
      depositAmount: Number(editDepositAmount) || 0,
      profitAmount: Number(editProfitAmount) || 0,
      roiPerDay: Number(editRoiPerDay) || 0,
      eligibleConditions: editEligibleConditions.trim(),
      groupVolumeMin: Number(editGroupVolumeMin) || 0,
      directClientsMin: Number(editDirectClientsMin) || 0,
      investCommission: `${editInvestComm}%`,
      earningsCommission: `${editEarnComm}%`,
      status: editStatus,
    } : c);

    setCommissions(updated);
    setEditingCommission(null);
    fetchReferralData();
  };

  // Delete Custom Tier
  const handleDeleteTier = async (tier) => {
    if (!tier || tier.levelNumber <= 1) return;
    try {
      const res = await deleteReferralTier(tier._id || tier.level);
      if (res?.success) {
        setCommissions(prev => prev.filter(c => c._id !== tier._id && c.level !== tier.level));
        showNotification(`Tier ${tier.level} (${tier.name}) removed successfully.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete tier.');
    } finally {
      setDeletingTier(null);
    }
  };

  // Promoter calculations
  const basePromoterData = promoterList.map((u) => {
    const rawInvest = Number(u.totalInvested || 0);
    const teamVolume = Number(u.teamTurnover || u.teamVolume || 0);
    const directComm = Number(u.directCommission || u.directComm || (teamVolume * 0.05));
    const multiTierComm = Number(u.multiTierCommission || u.multiTierComm || (teamVolume * 0.035));
    const totalComm = Number(u.commissionsEarned || u.totalCommission || (directComm + multiTierComm));

    return {
      ...u,
      id: u._id || u.id || u.customId,
      customId: u.customId || u.id || '',
      name: u.name || 'Investor',
      email: u.email || '',
      phone: u.phone || '',
      sponsor: u.sponsorId || u.referredBy || 'HORIZON-HQ',
      directRefs: u.directReferrals || u.directRefs || 0,
      totalTeam: u.totalTeamMembers || u.teamCount || 0,
      teamVolume: Math.round(teamVolume),
      directComm: Math.round(directComm),
      multiTierComm: Math.round(multiTierComm),
      totalComm: Math.round(totalComm),
    };
  });

  const filteredPromoters = basePromoterData.filter(p => {
    const q = search.trim().toLowerCase();
    return !q ||
      p.name?.toLowerCase().includes(q) ||
      (p.customId || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton w-56 h-8 rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonLoader type="card" count={4} />
        </div>
      </div>
    );
  }

  const depositEnabled = toggles.referralDepositCommissionEnabled !== false && toggles.referralSystemEnabled !== false;
  const roiShareEnabled = toggles.referralRoiShareEnabled !== false && toggles.referralSystemEnabled !== false;

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-poppins">
      {/* Header */}
      <PageHeader
        title="Referral Plans & Multi-Tier Commissions"
        subtitle="Manage master commission toggles, direct deposit rates, daily ROI profit sharing & dynamic multi-tier depth"
        badge={`${commissions.length}-Tier Active System`}
      />

      {/* Floating Feedback Alert */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <RiShieldCheckLine size={18} className="text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <RiCloseLine size={16} />
          </button>
        </div>
      )}

      {/* ──────────────── MASTER REFERRAL REWARD TOGGLE SWITCHES ──────────────── */}
      <div className="card p-5 border-2 border-gold-300 shadow-gold space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RiShieldCheckLine size={18} className="text-gold-600" />
              Master Referral Commission Switches (Global Controls)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly enable or disable commission distributions across all investors on the platform in real time.
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-gold-50 border border-gold-300 text-gold-900 rounded-lg shadow-2xs">
            Admin Controlled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Switch 1: Direct Investment Deposit Commission */}
          <div className={`p-4 rounded-2xl border transition-all ${
            depositEnabled
              ? 'bg-emerald-50/50 border-emerald-300'
              : 'bg-rose-50/50 border-rose-300'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                  depositEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  <RiTeamLine size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    1. Direct Investment Deposit Commission
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Credits instant bonuses to sponsors when downlines deposit into plans.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                disabled={savingToggle === 'referralDepositCommissionEnabled'}
                onClick={() => handleToggleSwitch('referralDepositCommissionEnabled')}
                className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  depositEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                title={`Click to ${depositEnabled ? 'Disable' : 'Enable'} Direct Deposit Commission`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    depositEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Distribution Status:</span>
              <span className={`font-bold px-2.5 py-0.5 rounded-md text-[11px] ${
                depositEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {depositEnabled ? 'Active (Distributing Rewards)' : 'Paused (Rewards Disabled)'}
              </span>
            </div>
          </div>

          {/* Switch 2: Daily / Per-Second ROI Profit Share */}
          <div className={`p-4 rounded-2xl border transition-all ${
            roiShareEnabled
              ? 'bg-amber-50/50 border-amber-300'
              : 'bg-rose-50/50 border-rose-300'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                  roiShareEnabled ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  <RiFlashlightLine size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    2. Daily / Per-Second ROI Profit Share
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Streams ongoing profit-share yields from downline interest yields.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                disabled={savingToggle === 'referralRoiShareEnabled'}
                onClick={() => handleToggleSwitch('referralRoiShareEnabled')}
                className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  roiShareEnabled ? 'bg-amber-600' : 'bg-slate-300'
                }`}
                title={`Click to ${roiShareEnabled ? 'Disable' : 'Enable'} Daily ROI Profit Share`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    roiShareEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Streaming Status:</span>
              <span className={`font-bold px-2.5 py-0.5 rounded-md text-[11px] ${
                roiShareEnabled
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {roiShareEnabled ? 'Active (Live Streaming)' : 'Paused (Streaming Disabled)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── ROLLING ODOMETER KPI CARDS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Referral Commissions Paid"
          numericValue={promoterList.reduce((sum, p) => sum + Number(p.totalComm || p.commissionsEarned || 0), 0)}
          prefix="$"
          decimals={0}
          change={promoterList.length > 0 ? 'Live Paid' : 'No Commissions'}
          positive={true}
          icon="money"
        />
        <KPICard
          title="Active Network Promoters"
          numericValue={promoterList.filter(p => Number(p.totalReferrals || p.directReferrals || 0) > 0).length || promoterList.length}
          prefix=""
          decimals={0}
          change={promoterList.length > 0 ? 'Active Leaders' : 'No Promoters'}
          positive={true}
          icon="users"
        />
        <KPICard
          title="Configured Tier Depth"
          numericValue={commissions.length}
          prefix=""
          suffix=" Levels"
          decimals={0}
          change="Multi-Tier Network"
          positive={true}
          icon="chart"
        />
        <KPICard
          title="Average Affiliate Yield"
          numericValue={commissions.reduce((sum, c) => sum + (parseFloat(c.investCommission) || 0), 0) || 15.0}
          prefix=""
          suffix="%"
          decimals={1}
          change="All Tiers Total"
          positive={true}
          icon="wallet"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="card p-2 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {[
            { id: 'plans', label: 'Multi-Tier Referral Plans', count: `${commissions.length} Active Levels`, icon: <RiTeamLine /> },
            { id: 'promoters', label: 'Affiliate Promoters Directory', count: `${filteredPromoters.length} Leaders`, icon: <RiGroupLine /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gold-400 text-slate-900 font-semibold shadow-gold'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] bg-white/80 text-slate-800 font-bold border border-slate-200/80 shadow-2xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'plans' && (
          <button
            type="button"
            onClick={openAddTierModal}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RiAddLine size={16} />
            <span>+ Add New Level (Level {commissions.length + 1}+)</span>
          </button>
        )}
      </div>

      {/* ──────────────── TAB 1: DEDICATED REFERRAL COMMISSIONS SECTIONS ──────────────── */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* ──────── 1. LEVEL ROI PER DAY INCOME SPREADSHEET TABLE ──────── */}
          <div className="card overflow-hidden shadow-xs border border-gold-300">
            {/* Bright Yellow Header Banner matching spreadsheet */}
            <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-4 py-3 flex items-center justify-between text-slate-950 font-poppins">
              <div className="flex items-center gap-2">
                <RiSparklingLine size={20} className="text-slate-950" />
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                  Level ROI Per day Income
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-slate-950 text-gold-300 px-3 py-1 rounded-full uppercase tracking-wider">
                  {commissions.length} Active Levels
                </span>
                <button
                  type="button"
                  onClick={openAddTierModal}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs rounded-lg shadow-xs border border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RiAddLine size={15} /> Add Level
                </button>
              </div>
            </div>

            {/* Spreadsheet Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-poppins">
                <thead>
                  <tr className="bg-amber-100/70 border-b border-amber-200 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                    <th className="py-3 px-4 text-center w-20">Levels</th>
                    <th className="py-3 px-4 text-center w-28">Deposit in $</th>
                    <th className="py-3 px-4 text-center w-28">Profit in $</th>
                    <th className="py-3 px-4 text-center w-36 text-amber-950">ROI per Day in $</th>
                    <th className="py-3 px-4">Eligible Conditions</th>
                    <th className="py-3 px-4 text-right pr-6 w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/70 font-medium text-slate-800">
                  {commissions.map((tier) => {
                    const levelNum = tier.levelNumber || parseInt(String(tier.level).replace('L', ''), 10) || 1;
                    const depAmt = Number(tier.depositAmount || 0);
                    const profitAmt = Number(tier.profitAmount || 0);
                    const roiDay = Number(tier.roiPerDay || 0.08);
                    const conditions = tier.eligibleConditions || (tier.directClientsMin || tier.groupVolumeMin ? `Group Volume Min.${Number(tier.groupVolumeMin).toLocaleString()}$, ${tier.directClientsMin} Direct Clients` : 'No Condition');

                    return (
                      <tr key={tier._id || tier.level} className="hover:bg-amber-50/50 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-900 font-mono text-sm bg-amber-50/30">
                          {levelNum}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                          {depAmt > 0 ? depAmt.toLocaleString() : (depAmt === 0 ? '0' : '')}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                          {profitAmt > 0 ? profitAmt.toLocaleString() : '0'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-extrabold text-amber-900 text-sm">
                          {roiDay}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                          <span className={`inline-block px-2.5 py-1 rounded-lg ${
                            conditions.toLowerCase().includes('no condition')
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-amber-100/60 text-amber-900 border border-amber-200/80'
                          }`}>
                            {conditions}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditCommission(tier)}
                              className="px-2.5 py-1 rounded-lg bg-gold-400 hover:bg-gold-500 text-slate-950 font-bold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Edit Level Conditions & ROI"
                            >
                              <RiEditLine size={13} />
                              <span>Edit</span>
                            </button>
                            {tier.levelNumber > 1 && (
                              <button
                                type="button"
                                onClick={() => setDeletingTier(tier)}
                                className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Level"
                              >
                                <RiDeleteBinLine size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SECTION 1: Direct Investment Deposit Commission */}
            <div className={`card p-5 space-y-4 border ${depositEnabled ? 'border-emerald-200/80' : 'border-rose-200/80 bg-rose-50/10'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <RiTeamLine size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-poppins">
                      1. Direct Investment Deposit Commission
                    </h4>
                    <p className="text-xs text-slate-400">
                      Commission credited instantly when downline members deposit into investment plans
                    </p>
                  </div>
                </div>

                <Badge variant={depositEnabled ? 'success' : 'danger'} size="sm">
                  {depositEnabled ? 'Feature Active' : 'Paused by Admin'}
                </Badge>
              </div>

              {!depositEnabled && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <RiAlertLine size={16} className="text-rose-600 flex-shrink-0" />
                  <span>Deposit commissions are currently <strong>disabled</strong>. Users will see a notice that this reward is paused.</span>
                </div>
              )}

              <div className="space-y-2.5">
                {commissions.map((tier) => (
                  <div
                    key={tier._id || tier.level}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center shadow-2xs font-mono">
                        {tier.level}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-800">{tier.name}</p>
                          {tier.status === 'Inactive' && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-slate-200 text-slate-600 rounded font-bold">Inactive</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {tier.activePromoters || 0} Promoters • Volume: {tier.totalVolume || '$0'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-sm font-extrabold text-emerald-600 font-mono bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl shadow-2xs">
                        {tier.investCommission}
                      </span>

                      <button
                        type="button"
                        onClick={() => openEditCommission(tier)}
                        className="p-1.5 rounded-lg hover:bg-gold-50 text-slate-400 hover:text-gold-700 transition-colors cursor-pointer"
                        title="Edit Commission Rates"
                      >
                        <RiEditLine size={16} />
                      </button>

                      {tier.levelNumber > 1 && (
                        <button
                          type="button"
                          onClick={() => setDeletingTier(tier)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Custom Tier"
                        >
                          <RiDeleteBinLine size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                <strong>Formula:</strong> Deposit Commission = Downline Deposit Amount × Tier % (e.g. $10,000 Level 1 deposit = $500 direct commission)
              </div>
            </div>

            {/* SECTION 2: Daily / Per-Second ROI Profit Share */}
            <div className={`card p-5 space-y-4 border ${roiShareEnabled ? 'border-amber-200/80' : 'border-rose-200/80 bg-rose-50/10'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <RiFlashlightLine size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-poppins">
                      2. Daily / Per-Second ROI Profit Share
                    </h4>
                    <p className="text-xs text-slate-400">
                      Continuous commission earned on the streaming interest profit earned by downlines
                    </p>
                  </div>
                </div>

                <Badge variant={roiShareEnabled ? 'warning' : 'danger'} size="sm">
                  {roiShareEnabled ? 'Feature Active' : 'Paused by Admin'}
                </Badge>
              </div>

              {!roiShareEnabled && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <RiAlertLine size={16} className="text-rose-600 flex-shrink-0" />
                  <span>ROI profit share is currently <strong>disabled</strong>. Users will see a notice that streaming profit share is paused.</span>
                </div>
              )}

              <div className="space-y-2.5">
                {commissions.map((tier) => (
                  <div
                    key={tier._id || tier.level}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:bg-amber-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center shadow-2xs font-mono">
                        {tier.level}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-800">{tier.name}</p>
                          {tier.status === 'Inactive' && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-slate-200 text-slate-600 rounded font-bold">Inactive</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {tier.activePromoters || 0} Promoters Active
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-sm font-extrabold text-gold-700 font-mono bg-gold-50 border border-gold-300 px-3 py-1 rounded-xl shadow-2xs">
                        {tier.earningsCommission}
                      </span>

                      <button
                        type="button"
                        onClick={() => openEditCommission(tier)}
                        className="p-1.5 rounded-lg hover:bg-gold-50 text-slate-400 hover:text-gold-700 transition-colors cursor-pointer"
                        title="Edit Commission Rates"
                      >
                        <RiEditLine size={16} />
                      </button>

                      {tier.levelNumber > 1 && (
                        <button
                          type="button"
                          onClick={() => setDeletingTier(tier)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Custom Tier"
                        >
                          <RiDeleteBinLine size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                <strong>Formula:</strong> ROI Profit Share = Downline Stream Interest ($/sec) × Tier % (e.g. $100 daily yield earned by L1 = $5/day ongoing)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: PROMOTERS DIRECTORY TABLE ──────────────── */}
      {activeTab === 'promoters' && (
        <div className="space-y-4 font-poppins">
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <SearchBar
                placeholder="Search affiliate by name, user ID (HORIZON-USR-01), email, or sponsor..."
                value={search}
                onChange={setSearch}
                className="flex-1 w-full"
              />
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                Showing {filteredPromoters.length} Verified Promoters
              </span>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="table-container">
              <table className="data-table font-poppins">
                <thead>
                  <tr className="text-slate-400 font-medium text-xs tracking-wider">
                    <th className="font-medium text-slate-500">User Details</th>
                    <th className="font-medium text-slate-500">Email</th>
                    <th className="font-medium text-slate-500">Mobile Number</th>
                    <th className="font-medium text-slate-500">Referred By (Sponsor)</th>
                    <th className="font-medium text-slate-500">Direct Referrals</th>
                    <th className="font-medium text-slate-500">Total Team Volume</th>
                    <th className="font-medium text-slate-500">Direct Comm</th>
                    <th className="font-medium text-slate-500">Team Comm</th>
                    <th className="font-medium text-slate-500">Total Commissions Paid</th>
                    <th className="font-medium text-slate-500">Status</th>
                    <th className="text-right pr-6 font-medium text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromoters
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((u, i) => {
                    const userCustomId = u.customId || `HORIZON-USR-0${u.id}`;

                    return (
                      <tr
                        key={u.id}
                        className="animate-fade-in hover:bg-slate-50/70 transition-colors"
                        style={{ animationDelay: `${i * 35}ms` }}
                      >
                        {/* Promoter Details */}
                        <td>
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-900 font-bold flex items-center justify-center flex-shrink-0 shadow-xs ring-2 ring-gold-200/80 text-xs font-poppins">
                              {u.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate leading-tight font-poppins">
                                {u.name}
                              </p>
                              <p className="text-[11px] font-medium text-gold-600 font-poppins tracking-tight mt-0.5">
                                {userCustomId}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="text-xs font-normal text-slate-500 font-poppins">
                          {u.email}
                        </td>

                        {/* Mobile Number */}
                        <td className="text-xs font-normal text-slate-500 font-poppins">
                          {u.phone || '—'}
                        </td>

                        {/* Referred By / Sponsor */}
                        <td className="text-xs font-medium text-slate-700 font-mono">
                          {u.sponsor || u.referredBy || 'Direct Platform'}
                        </td>

                        {/* Direct Referrals */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200/80 whitespace-nowrap font-poppins">
                            <RiGroupLine size={13} className="text-blue-500" />
                            {u.totalReferrals || u.directRefs || 0} Direct
                          </span>
                        </td>

                        {/* Total Team Volume */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50/90 text-amber-900 text-xs font-semibold border border-amber-300/80 whitespace-nowrap font-poppins">
                            <RiCoinsLine size={13} className="text-amber-600" />
                            ${u.teamVolume.toLocaleString()}.00
                          </span>
                        </td>

                        {/* Direct Comm */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 whitespace-nowrap font-poppins">
                            +${u.directComm.toLocaleString()}.00
                          </span>
                        </td>

                        {/* Multi-Tier Team Comm */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-50 text-gold-800 text-xs font-bold border border-gold-300/80 whitespace-nowrap font-poppins">
                            +${u.multiTierComm.toLocaleString()}.00
                          </span>
                        </td>

                        {/* Total Commissions Paid */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 text-xs font-extrabold border border-emerald-300 whitespace-nowrap font-poppins shadow-2xs">
                            <RiMoneyDollarCircleLine size={14} className="text-emerald-600" />
                            +${u.totalComm.toLocaleString()}.00
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <Badge variant={u.status === 'Active' ? 'success' : 'danger'} size="sm">
                            {u.status}
                          </Badge>
                        </td>

                        {/* Action Button */}
                        <td className="text-right pr-6">
                          <button
                            type="button"
                            onClick={() => setSelectedPromoter(u)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-900 text-xs font-semibold transition-all border border-gold-400 hover:border-gold-500 active:scale-95 shadow-gold font-poppins cursor-pointer"
                            title="View downline hierarchy"
                          >
                            <RiNodeTree size={14} className="text-slate-900" />
                            <span>Audit Tree</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredPromoters.length === 0 && (
              <div className="p-12 text-center text-xs text-slate-400 font-poppins">
                No affiliate promoters recorded yet. Promoters will appear here as users build their downline teams.
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalItems={filteredPromoters.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* ──────────────── MODAL 1: ADD NEW LEVEL (LEVEL 6+) ──────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add New Referral Tier: Level ${addLevelNum}`}
        subtitle="Configure dynamic downline rewards & Level ROI eligibility conditions"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              icon={<RiCheckLine />}
              onClick={handleCreateTier}
              disabled={isSubmittingAdd}
            >
              {isSubmittingAdd ? 'Adding Level...' : `Save Level ${addLevelNum} Tier`}
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-poppins text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Level Number *
              </label>
              <input
                type="number"
                min="1"
                value={addLevelNum}
                onChange={e => setAddLevelNum(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono font-bold text-sm text-slate-900 outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Level Code
              </label>
              <input
                type="text"
                disabled
                value={`L${addLevelNum}`}
                className="w-full px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 font-mono font-bold text-sm text-slate-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tier Name / Label *
            </label>
            <input
              type="text"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder={`e.g. Level ${addLevelNum}`}
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
            />
          </div>

          {/* Level ROI Specific Fields */}
          <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
              Level ROI Per Day Income Configuration
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Deposit in $
                </label>
                <input
                  type="number"
                  value={addDepositAmount}
                  onChange={e => setAddDepositAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-800 outline-none focus:border-gold-400"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Profit in $
                </label>
                <input
                  type="number"
                  value={addProfitAmount}
                  onChange={e => setAddProfitAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-800 outline-none focus:border-gold-400"
                />
              </div>
              <div>
                <label className="block font-semibold text-amber-950 uppercase tracking-wider mb-1">
                  ROI per Day in $ *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={addRoiPerDay}
                  onChange={e => setAddRoiPerDay(e.target.value)}
                  placeholder="0.08"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-amber-300 text-sm font-mono font-extrabold text-amber-900 outline-none focus:border-gold-400 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Eligible Conditions Description *
              </label>
              <input
                type="text"
                value={addEligibleConditions}
                onChange={e => setAddEligibleConditions(e.target.value)}
                placeholder="e.g. Group Volume Min.25,000$, 11 Direct Clients"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Min Group Volume ($)
                </label>
                <input
                  type="number"
                  value={addGroupVolumeMin}
                  onChange={e => setAddGroupVolumeMin(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-800 outline-none focus:border-gold-400"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Min Direct Clients
                </label>
                <input
                  type="number"
                  value={addDirectClientsMin}
                  onChange={e => setAddDirectClientsMin(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-800 outline-none focus:border-gold-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                1. Deposit Comm (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={addInvestComm}
                  onChange={e => setAddInvestComm(e.target.value)}
                  className="w-full pr-8 pl-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-emerald-600 font-mono outline-none focus:border-gold-400 shadow-2xs"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">%</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                2. ROI Profit Share (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={addEarnComm}
                  onChange={e => setAddEarnComm(e.target.value)}
                  className="w-full pr-8 pl-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-gold-700 font-mono outline-none focus:border-gold-400 shadow-2xs"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Tier Status
            </label>
            <select
              value={addStatus}
              onChange={e => setAddStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-gold-400"
            >
              <option value="Active">Active (Eligible for Commission)</option>
              <option value="Inactive">Inactive (Paused)</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* ──────────────── MODAL 2: EDIT COMMISSION & LEVEL ROI MODAL ──────────────── */}
      <Modal
        isOpen={!!editingCommission}
        onClose={() => setEditingCommission(null)}
        title={`Edit Level: ${editingCommission?.level} (${editingCommission?.name || `Level ${editingCommission?.levelNumber}`})`}
        subtitle="Configure Level ROI per day income, eligibility conditions, and multi-tier revenue share"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingCommission(null)}>Cancel</Button>
            <Button variant="primary" icon={<RiCheckLine />} onClick={handleSaveCommission}>
              Update Level Settings
            </Button>
          </>
        }
      >
        {editingCommission && (() => {
          const depCommNum = Number(editInvestComm) || 0;
          const earnCommNum = Number(editEarnComm) || 0;
          const testDepNum = Number(testDepositAmount) || 0;
          const testYieldNum = Number(testMonthlyYield) || 0;

          const calcDepPayout = Math.round(testDepNum * (depCommNum / 100));
          const calcMonthlyYieldShare = Math.round(testYieldNum * (earnCommNum / 100));
          const calcAnnualTotal = calcDepPayout + (calcMonthlyYieldShare * 12);

          return (
            <div className="space-y-4 font-poppins">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tier Name / Title *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-gold-400 shadow-2xs"
                  />
                </div>

                {/* ──── LEVEL ROI FIELDS (Yellow accent container) ──── */}
                <div className="sm:col-span-2 p-3.5 bg-amber-50/70 rounded-2xl border border-amber-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <RiSparklingLine size={16} className="text-amber-600" />
                      Level ROI Per day Income Slabs Settings
                    </span>
                    <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                      Level {editingCommission.levelNumber || editingCommission.level}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Deposit in $
                      </label>
                      <input
                        type="number"
                        value={editDepositAmount}
                        onChange={e => setEditDepositAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 outline-none focus:border-gold-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Profit in $
                      </label>
                      <input
                        type="number"
                        value={editProfitAmount}
                        onChange={e => setEditProfitAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 outline-none focus:border-gold-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-amber-950 uppercase tracking-wider mb-1">
                        ROI per Day in $ *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editRoiPerDay}
                        onChange={e => setEditRoiPerDay(e.target.value)}
                        placeholder="0.08"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-amber-400 text-sm font-mono font-black text-amber-900 outline-none focus:border-gold-400 ring-1 ring-amber-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Eligible Conditions Description *
                    </label>
                    <input
                      type="text"
                      value={editEligibleConditions}
                      onChange={e => setEditEligibleConditions(e.target.value)}
                      placeholder="e.g. Group Volume Min.25,000$, 11 Direct Clients"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-gold-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Min Group Volume ($)
                      </label>
                      <input
                        type="number"
                        value={editGroupVolumeMin}
                        onChange={e => setEditGroupVolumeMin(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 outline-none focus:border-gold-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Min Direct Clients
                      </label>
                      <input
                        type="number"
                        value={editDirectClientsMin}
                        onChange={e => setEditDirectClientsMin(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 outline-none focus:border-gold-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    1. Deposit Commission Rate (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={editInvestComm}
                      onChange={e => setEditInvestComm(e.target.value)}
                      className="w-full pr-8 pl-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-emerald-600 font-mono outline-none focus:border-gold-400 shadow-2xs"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. ROI Profit Share Rate (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={editEarnComm}
                      onChange={e => setEditEarnComm(e.target.value)}
                      className="w-full pr-8 pl-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-gold-700 font-mono outline-none focus:border-gold-400 shadow-2xs"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">%</span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tier Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-gold-400"
                  >
                    <option value="Active">Active (Distributing Rewards)</option>
                    <option value="Inactive">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Commission Simulation Engine */}
              <div className="p-4 bg-gold-50/60 rounded-2xl border border-gold-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <RiCalculatorLine size={16} className="text-gold-600" />
                    In-Drawer Commission Simulation Engine
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                    Live Computation
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Test Downline Deposit ($)</span>
                    <input
                      type="number"
                      value={testDepositAmount}
                      onChange={e => setTestDepositAmount(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-800 outline-none focus:border-gold-400 mt-1 shadow-2xs"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Test Monthly ROI Yield ($)</span>
                    <input
                      type="number"
                      value={testMonthlyYield}
                      onChange={e => setTestMonthlyYield(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-800 outline-none focus:border-gold-400 mt-1 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono pt-1">
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-gold-200/80 shadow-2xs">
                    <div>
                      <span className="font-bold text-slate-800 font-sans block">Instant Deposit Commission:</span>
                      <span className="text-[10px] text-slate-400 font-sans">${testDepNum.toLocaleString()} × {depCommNum}%</span>
                    </div>
                    <span className="font-extrabold text-emerald-600 text-sm self-center">+${calcDepPayout.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-gold-200/80 shadow-2xs">
                    <div>
                      <span className="font-bold text-slate-800 font-sans block">Monthly ROI Profit Share:</span>
                      <span className="text-[10px] text-slate-400 font-sans">${testYieldNum.toLocaleString()} monthly ROI × {earnCommNum}%</span>
                    </div>
                    <span className="font-extrabold text-gold-700 text-sm self-center">+${calcMonthlyYieldShare.toLocaleString()}/mo</span>
                  </div>

                  <div className="flex justify-between p-3 bg-white rounded-xl border-2 border-gold-400 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-slate-600 uppercase font-bold block">1-Year Total Promoter Payout</span>
                      <span className="text-[10px] text-slate-400 font-sans font-normal">Deposit comm + 12 months ROI share</span>
                    </div>
                    <span className="font-extrabold text-gold-900 text-base self-center">+${calcAnnualTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ──────────────── MODAL 3: DELETE TIER CONFIRMATION ──────────────── */}
      <Modal
        isOpen={!!deletingTier}
        onClose={() => setDeletingTier(null)}
        title="Confirm Tier Removal"
        subtitle={deletingTier ? `Are you sure you want to remove ${deletingTier.level} (${deletingTier.name})?` : ''}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingTier(null)}>Cancel</Button>
            <Button variant="danger" icon={<RiDeleteBinLine />} onClick={() => handleDeleteTier(deletingTier)}>
              Delete Level
            </Button>
          </>
        }
      >
        {deletingTier && (
          <div className="space-y-3 text-xs text-slate-600 font-poppins">
            <p>
              Removing tier <strong className="text-slate-900 font-mono">{deletingTier.level}</strong> will permanently remove this level from new commission distributions.
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              Downline members previously placed in this level will no longer generate {deletingTier.level} commissions.
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── MODAL 4: PROMOTER DOWNLINE AUDIT DRAWER ──────────────── */}
      <Modal
        isOpen={!!selectedPromoter}
        onClose={() => setSelectedPromoter(null)}
        title="Promoter Commission & Tree Audit"
        subtitle={selectedPromoter ? `${selectedPromoter.name} (${selectedPromoter.customId})` : ''}
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setSelectedPromoter(null)}>
            Done
          </Button>
        }
      >
        {selectedPromoter && (
          <div className="space-y-5 font-poppins">
            <div className="p-4 bg-gold-50/60 rounded-2xl border border-gold-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-300 to-amber-500 text-slate-900 font-bold flex items-center justify-center text-sm ring-2 ring-gold-200">
                  {selectedPromoter.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">{selectedPromoter.name}</h4>
                  <p className="text-xs text-slate-400">{selectedPromoter.email} • {selectedPromoter.phone}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Direct Referrals</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gold-400 text-slate-900 text-xs font-bold shadow-2xs">
                  <RiGroupLine size={13} />
                  {selectedPromoter.totalReferrals || 0} Members
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Team Turnover</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                  ${selectedPromoter.teamVolume.toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">Direct Comm</span>
                <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
                  +${selectedPromoter.directComm.toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 bg-gold-50 rounded-xl border border-gold-300 text-center">
                <span className="text-[10px] text-gold-900 uppercase font-bold tracking-wider block">Total Commissions</span>
                <span className="text-base font-extrabold text-gold-900 font-mono mt-0.5 block">
                  +${selectedPromoter.totalComm.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Dynamic Downline Network Hierarchy */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <RiNodeTree className="text-emerald-600" /> Multi-Tier Downline Network Tree ({commissions.length} Levels)
                </h5>
                <span className="text-[11px] font-bold text-slate-600">
                  Total Downline: <strong>{selectedPromoter.totalTeamCount || 0} Members</strong> (${(selectedPromoter.teamVolume || 0).toLocaleString()} Volume)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center text-xs">
                {commissions.map((tier) => {
                  const lvlData = selectedPromoter.levelBreakdown?.find(
                    (lb) => lb.levelNumber === tier.levelNumber || lb.level === tier.level
                  );
                  const memberCount = lvlData?.count ?? 0;
                  const memberVolume = lvlData?.volume ?? 0;

                  return (
                    <div
                      key={tier.level}
                      className={`p-2.5 rounded-xl border shadow-2xs transition-colors ${
                        memberCount > 0 ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-200' : 'bg-white border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-0.5">
                        <span>{tier.level}</span>
                        <span className="text-emerald-700 font-mono font-semibold">{tier.investCommission}</span>
                      </div>
                      <span className={`font-black block text-sm ${memberCount > 0 ? 'text-slate-950 font-mono' : 'text-slate-400'}`}>
                        {memberCount} {memberCount === 1 ? 'User' : 'Users'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        ${memberVolume.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Downline Members List Breakdown */}
              {selectedPromoter.levelBreakdown?.some(lb => lb.count > 0) ? (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                  <h6 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Downline Members Directory
                  </h6>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {selectedPromoter.levelBreakdown.map(lb => {
                      if (lb.count === 0) return null;
                      return (
                        <div key={lb.level} className="space-y-1">
                          <span className="text-[10px] font-extrabold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                            {lb.level} ({lb.count} members • ${lb.volume.toLocaleString()} volume)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                            {lb.members.map(m => (
                              <div key={m.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-slate-800 leading-tight">{m.name}</p>
                                  <p className="text-[10px] text-gold-700 font-mono">{m.id} • {m.email}</p>
                                </div>
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                  ${(m.invested || 0).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                  No downline members registered under this promoter yet.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
