import React, { useState, useEffect, useCallback } from 'react';
import {
  RiTeamLine, RiFlashlightLine, RiCoinsLine, RiCalculatorLine,
  RiCheckLine, RiEditLine, RiNodeTree, RiUserLine, RiShieldCheckLine,
  RiGroupLine, RiMoneyDollarCircleLine, RiPercentLine, RiSearchLine,
  RiArrowRightLine, RiInformationLine, RiEyeLine
} from 'react-icons/ri';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import KPICard from '../components/ui/KPICard';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import PageHeader from '../components/ui/PageHeader';
import { referralCommissions as initialCommissions, users } from '../data/mockData';
import {
  getReferralSettings,
  updateReferralSetting,
  getPromotersNetwork
} from '../api/referralsApi';

export default function Referrals() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans', 'promoters'
  const [commissions, setCommissions] = useState(initialCommissions);
  const [promoterList, setPromoterList] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Edit Commission Modal State
  const [editingCommission, setEditingCommission] = useState(null);
  const [editInvestComm, setEditInvestComm] = useState('');
  const [editEarnComm, setEditEarnComm] = useState('');
  const [testDepositAmount, setTestDepositAmount] = useState('10000');
  const [testMonthlyYield, setTestMonthlyYield] = useState('1500');

  // Promoter Downline Tree Audit Drawer State
  const [selectedPromoter, setSelectedPromoter] = useState(null);

  const fetchReferralData = useCallback(async () => {
    try {
      const [settingsRes, promotersRes] = await Promise.allSettled([
        getReferralSettings(),
        getPromotersNetwork({ search: search.trim() || undefined })
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value?.success && Array.isArray(settingsRes.value.settings)) {
        setCommissions(settingsRes.value.settings);
      } else {
        const saved = localStorage.getItem('horizon_referral_commissions');
        if (saved) {
          try {
            setCommissions(JSON.parse(saved));
          } catch (e) {}
        }
      }

      if (promotersRes.status === 'fulfilled' && promotersRes.value?.success && Array.isArray(promotersRes.value.promoters)) {
        setPromoterList(promotersRes.value.promoters);
      }
    } catch (err) {
      console.warn('Using fallback referrals data:', err.message);
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

  const openEditCommission = (c) => {
    setEditingCommission(c);
    setEditInvestComm(String(c.investCommission || '5').replace('%', ''));
    setEditEarnComm(String(c.earningsCommission || '1').replace('%', ''));
    setTestDepositAmount('10000');
    setTestMonthlyYield('1500');
  };

  const handleSaveCommission = async () => {
    if (!editingCommission) return;

    try {
      if (editingCommission._id || editingCommission.level) {
        await updateReferralSetting(editingCommission._id || editingCommission.level, {
          investCommission: `${editInvestComm}%`,
          earningsCommission: `${editEarnComm}%`,
        });
      }
    } catch (err) {
      console.warn('API update referral offline:', err.message);
    }

    const updated = commissions.map(c => c.level === editingCommission.level ? {
      ...c,
      investCommission: `${editInvestComm}%`,
      earningsCommission: `${editEarnComm}%`,
    } : c);

    setCommissions(updated);
    localStorage.setItem('horizon_referral_commissions', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('horizon-referrals-change', { detail: updated }));
    setEditingCommission(null);
  };

  // Promoter calculations fallback
  const basePromoterData = promoterList.length > 0 ? promoterList : users.map((u) => {
    const rawInvest = Number((u.totalInvested || '$0').replace(/[^0-9.-]+/g, '')) || 0;
    const teamVolume = rawInvest * (u.totalReferrals > 0 ? (u.totalReferrals * 1.8 + 1) : 0);
    const directComm = (teamVolume * 0.5) * 0.05;
    const multiTierComm = (teamVolume * 0.5) * 0.035;
    const totalComm = directComm + multiTierComm;

    return {
      ...u,
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

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-poppins">
      {/* Header */}
      <PageHeader
        title="Referral Plans & Multi-Tier Commissions"
        subtitle="Configure 5-tier direct deposit commissions, daily ROI profit sharing & promoter network trees"
        badge="5-Tier Growth"
      />

      {/* ──────────────── ROLLING ODOMETER KPI CARDS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Referral Commissions Paid"
          numericValue={428900}
          prefix="$"
          decimals={0}
          change="+19.4%"
          positive={true}
          icon="money"
        />
        <KPICard
          title="Active Network Promoters"
          numericValue={1420}
          prefix=""
          decimals={0}
          change="+12.8%"
          positive={true}
          icon="users"
        />
        <KPICard
          title="Multi-Tier Downlines"
          numericValue={8650}
          prefix=""
          decimals={0}
          change="+24.1%"
          positive={true}
          icon="chart"
        />
        <KPICard
          title="Average Affiliate Yield"
          numericValue={14.5}
          prefix=""
          suffix="%"
          decimals={1}
          change="+3.2%"
          positive={true}
          icon="wallet"
        />
      </div>

      {/* Navigation Tabs (Clean 2 Tabs) */}
      <div className="card p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'plans', label: '5-Tier Referral Plans', count: 'L1 to L5 Matrix', icon: <RiTeamLine /> },
            { id: 'promoters', label: 'Affiliate Promoters Directory', count: `${filteredPromoters.length} Leaders`, icon: <RiGroupLine /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
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
      </div>

      {/* ──────────────── TAB 1: 5-TIER REFERRAL PLANS GRID ──────────────── */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Direct Investment Deposit Commission Box */}
            <div className="card p-5 space-y-4 border border-emerald-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <RiTeamLine size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-poppins">1. Direct Investment Deposit Commission</h4>
                  <p className="text-xs text-slate-400">Commission credited instantly when downline members deposit into investment plans</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {commissions.map((tier) => (
                  <div key={tier.level} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:bg-emerald-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center shadow-2xs font-mono">
                        {tier.level}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{tier.name}</p>
                        <p className="text-[11px] text-slate-400">{tier.activePromoters} Promoters • Total Volume: {tier.totalVolume}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-emerald-600 font-mono bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl shadow-2xs">
                        {tier.investCommission}
                      </span>
                      <button
                        onClick={() => openEditCommission(tier)}
                        className="p-1.5 rounded-lg hover:bg-gold-50 text-slate-400 hover:text-gold-700 transition-colors"
                        title="Edit Commission"
                      >
                        <RiEditLine size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                <strong>Formula:</strong> Deposit Commission = Downline Deposit Amount × Tier % (e.g. $10,000 Level 1 deposit = $500 direct commission)
              </div>
            </div>

            {/* 2. Earnings / ROI Commission Box */}
            <div className="card p-5 space-y-4 border border-amber-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <RiFlashlightLine size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-poppins">2. Daily / Per-Second ROI Profit Share</h4>
                  <p className="text-xs text-slate-400">Continuous commission earned on the streaming interest profit earned by downlines</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {commissions.map((tier) => (
                  <div key={tier.level} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:bg-amber-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center shadow-2xs font-mono">
                        {tier.level}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{tier.name}</p>
                        <p className="text-[11px] text-slate-400">{tier.activePromoters} Promoters Active</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-gold-700 font-mono bg-gold-50 border border-gold-300 px-3 py-1 rounded-xl shadow-2xs">
                        {tier.earningsCommission}
                      </span>
                      <button
                        onClick={() => openEditCommission(tier)}
                        className="p-1.5 rounded-lg hover:bg-gold-50 text-slate-400 hover:text-gold-700 transition-colors"
                        title="Edit Commission"
                      >
                        <RiEditLine size={15} />
                      </button>
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

      {/* ──────────────── TAB 2: PROMOTERS DIRECTORY TABLE (MATCHING USERS TABLE STYLING) ──────────────── */}
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
                    <th className="font-medium text-slate-500">Direct Comm (5%)</th>
                    <th className="font-medium text-slate-500">Team Comm (L2-L5)</th>
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
                        {/* Promoter Details (Large Round Avatar) */}
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
                        <td className="text-xs font-medium text-slate-600 font-poppins whitespace-nowrap">
                          {u.phone}
                        </td>

                        {/* Referred By / Sponsor */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-50/80 text-slate-700 text-xs font-medium border border-gold-200/80 whitespace-nowrap font-poppins">
                            <RiGroupLine size={13} className="text-gold-600" />
                            {u.referredBy || 'Direct Platform'}
                          </span>
                        </td>

                        {/* Direct Referrals */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200/80 whitespace-nowrap font-poppins">
                            <RiGroupLine size={13} className="text-blue-500" />
                            {u.totalReferrals || 0} Direct
                          </span>
                        </td>

                        {/* Total Team Volume */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50/90 text-amber-900 text-xs font-semibold border border-amber-300/80 whitespace-nowrap font-poppins">
                            <RiCoinsLine size={13} className="text-amber-600" />
                            ${u.teamVolume.toLocaleString()}.00
                          </span>
                        </td>

                        {/* Direct Comm. (5%) */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 whitespace-nowrap font-poppins">
                            +${u.directComm.toLocaleString()}.00
                          </span>
                        </td>

                        {/* Multi-Tier Team Comm. */}
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

                        {/* Action Button: Audit Tree (Prominent Gold Button) */}
                        <td className="text-right pr-6">
                          <button
                            onClick={() => setSelectedPromoter(u)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-900 text-xs font-semibold transition-all border border-gold-400 hover:border-gold-500 active:scale-95 shadow-gold font-poppins"
                            title="View 5-tier downline hierarchy"
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

            {/* ──────────────── 20 ITEMS PER PAGE PAGINATION BAR ──────────────── */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredPromoters.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* ──────────────── EDIT COMMISSION SLIDE-OVER DRAWER WITH IN-DRAWER AUTO CALCULATION (NO DARK BOX) ──────────────── */}
      <Modal
        isOpen={!!editingCommission}
        onClose={() => setEditingCommission(null)}
        title={`Configure Commission: ${editingCommission?.level} (${editingCommission?.name})`}
        subtitle="Live auto-calculation engine for multi-tier deposit and ROI yield revenue shares"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingCommission(null)}>Cancel</Button>
            <Button variant="primary" icon={<RiCheckLine />} onClick={handleSaveCommission}>
              Update Commission
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
              </div>

              {/* ──────────────── IN-DRAWER REVENUE SHARE SIMULATION ENGINE (NO DARK BOX, PURE LIGHT GOLD) ──────────────── */}
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

                {/* Simulation Inputs */}
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

                {/* Auto Calculated Result Cards */}
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

                  {/* Clean Light Summary Box */}
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

      {/* ──────────────── PROMOTER DOWNLINE AUDIT DRAWER ──────────────── */}
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
                <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">Direct Comm. (5%)</span>
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

            {/* 5-Tier Downline Network Hierarchy */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <RiNodeTree className="text-emerald-600" /> 5-Tier Downline Network Tree
              </h5>

              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">Tier 1</span>
                  <span className="font-bold text-emerald-600 block mt-0.5">{selectedPromoter.totalReferrals} Users</span>
                  <span className="text-[10px] text-slate-500 font-mono">5% Comm.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">Tier 2</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{Math.round(selectedPromoter.totalReferrals * 1.5)} Users</span>
                  <span className="text-[10px] text-slate-500 font-mono">4% Comm.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">Tier 3</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{Math.round(selectedPromoter.totalReferrals * 2)} Users</span>
                  <span className="text-[10px] text-slate-500 font-mono">3% Comm.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">Tier 4</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{Math.round(selectedPromoter.totalReferrals * 1.2)} Users</span>
                  <span className="text-[10px] text-slate-500 font-mono">2% Comm.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">Tier 5</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{Math.round(selectedPromoter.totalReferrals * 0.8)} Users</span>
                  <span className="text-[10px] text-slate-500 font-mono">1% Comm.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
