import React, { useState, useEffect, useCallback } from 'react';
import {
  RiTrophyLine, RiMedalLine, RiAwardLine, RiVipCrownLine, RiGroupLine,
  RiMoneyDollarCircleLine, RiEditLine, RiCheckLine, RiPercentLine,
  RiArrowUpCircleLine, RiSparklingLine, RiShieldStarLine, RiTeamLine,
  RiFlashlightLine, RiGlobalLine, RiTimeLine, RiCalculatorLine,
  RiSearchLine, RiInformationLine, RiArrowRightLine, RiCoinsLine, RiWallet3Line,
  RiAddLine
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
  getAllRanks,
  createRank,
  updateRank,
  deleteRank,
  getAchieversLeaderboard
} from '../api/ranksApi';

export default function Ranks() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ladder'); // 'ladder', 'achievers'
  const [ranks, setRanks] = useState([]);
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Edit Rank Modal State
  const [editingRank, setEditingRank] = useState(null);
  const [editMinInvest, setEditMinInvest] = useState('');
  const [editReward, setEditReward] = useState('');
  const [testUserVolume, setTestUserVolume] = useState('');

  // Add New Rank Modal State
  const [isAddRankOpen, setIsAddRankOpen] = useState(false);
  const [newRankLevel, setNewRankLevel] = useState('');
  const [newRankName, setNewRankName] = useState('');
  const [newRankMinInvest, setNewRankMinInvest] = useState('');
  const [newRankReward, setNewRankReward] = useState('');
  const [newRankDesc, setNewRankDesc] = useState('');

  // Leader Calculation Breakdown Drawer State
  const [selectedLeader, setSelectedLeader] = useState(null);

  const fetchRanksData = useCallback(async () => {
    try {
      const [ranksRes, leaderRes] = await Promise.allSettled([
        getAllRanks(),
        getAchieversLeaderboard()
      ]);

      if (ranksRes.status === 'fulfilled' && ranksRes.value?.success && Array.isArray(ranksRes.value.ranks)) {
        setRanks(ranksRes.value.ranks);
      } else {
        setRanks([]);
      }

      if (leaderRes.status === 'fulfilled' && leaderRes.value?.success && Array.isArray(leaderRes.value.leaderboard)) {
        setLeaderboardList(leaderRes.value.leaderboard);
      } else {
        setLeaderboardList([]);
      }
    } catch (err) {
      console.warn('Error fetching ranks data:', err.message);
      setRanks([]);
      setLeaderboardList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanksData();
  }, [fetchRanksData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  const openEditRank = (r) => {
    setEditingRank(r);
    setEditMinInvest(String(r.minInvest || 1000));
    setEditReward(String(r.reward || 50));
    setTestUserVolume(String(r.minInvest || 1000));
  };

  const handleSaveRank = async () => {
    if (!editingRank) return;

    try {
      if (editingRank._id || editingRank.level) {
        await updateRank(editingRank._id || editingRank.level, {
          minInvest: Number(editMinInvest) || editingRank.minInvest,
          reward: Number(editReward) || editingRank.reward,
        });
      }
    } catch (err) {
      console.warn('API update rank offline:', err.message);
    }

    const updated = ranks.map(r => r.level === editingRank.level ? {
      ...r,
      minInvest: Number(editMinInvest) || r.minInvest,
      reward: Number(editReward) || r.reward,
    } : r);
    setRanks(updated);
    localStorage.setItem('horizon_rank_ladder', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('horizon-ranks-change', { detail: updated }));
    setEditingRank(null);
  };

  const handleCreateRank = async () => {
    if (!newRankName.trim()) return;
    const lvl = Number(newRankLevel) || ranks.length + 1;
    const newRankItem = {
      level: lvl,
      name: newRankName.trim(),
      minInvest: Number(newRankMinInvest) || 1000,
      reward: Number(newRankReward) || 50,
      achievers: 0,
      desc: newRankDesc.trim() || 'Custom leadership milestone tier.'
    };

    try {
      await createRank(newRankItem);
    } catch (err) {
      console.warn('API create rank offline:', err.message);
    }

    const updated = [...ranks.filter(r => r.level !== lvl), newRankItem].sort((a, b) => a.level - b.level);
    setRanks(updated);
    localStorage.setItem('horizon_rank_ladder', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('horizon-ranks-change', { detail: updated }));
    setIsAddRankOpen(false);
    setNewRankName('');
    setNewRankLevel('');
    setNewRankMinInvest('');
    setNewRankReward('');
    setNewRankDesc('');
  };

  const getRankIcon = (lvl) => {
    if (lvl >= 9) return <RiVipCrownLine size={24} className="text-amber-500" />;
    if (lvl >= 7) return <RiShieldStarLine size={24} className="text-purple-500" />;
    if (lvl >= 5) return <RiSparklingLine size={24} className="text-blue-500" />;
    if (lvl >= 3) return <RiMedalLine size={24} className="text-gold-600" />;
    return <RiAwardLine size={24} className="text-emerald-500" />;
  };

  // Enriched Leaders List with rank metrics
  const leaderData = leaderboardList.map((u) => {
    const rawInvest = Number(u.totalInvested || 0);
    const teamVolume = Number(u.teamTurnover || u.teamVolume || (rawInvest * (u.totalReferrals > 0 ? (u.totalReferrals * 1.8 + 1) : 0)));
    const rankObj = ranks.find(r => (r.level === u.level) || r.name.toLowerCase() === (u.currentRank || u.rank || '').toLowerCase().replace(/level \d+ \(|\)/g, '')) || ranks[0];
    const rankCashBonus = Number(u.rewardsEarned || u.reward || (u.totalReferrals > 0 ? (rankObj?.reward || 0) : 0));

    return {
      ...u,
      id: u._id || u.id || u.customId,
      customId: u.customId || u.id || '',
      name: u.name || 'Investor',
      email: u.email || '',
      phone: u.phone || '',
      currentRank: u.currentRank || u.rank || (rankObj?.name || 'Bronze Explorer'),
      sponsor: u.sponsorId || u.referredBy || 'HORIZON-HQ',
      directRefs: u.directReferrals || u.totalReferrals || u.directRefs || 0,
      turnover: Math.round(teamVolume),
      reward: Math.round(rankCashBonus),
      teamVolume: Math.round(teamVolume),
      rankCashBonus: Math.round(rankCashBonus),
      rankDetails: rankObj,
    };
  });

  const filteredLeaders = leaderData.filter(l => {
    const q = search.trim().toLowerCase();
    return !q ||
      l.name.toLowerCase().includes(q) ||
      (l.customId || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').toLowerCase().includes(q) ||
      (l.currentRank || '').toLowerCase().includes(q);
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
        title="Rank Progression Ladder"
        subtitle="Configure 10-level milestone turnover requirements, instant cash bonuses & rank achievers"
        badge="10-Tier Ladder"
        actions={
          <Button
            variant="primary"
            icon={<RiAddLine />}
            onClick={() => {
              setNewRankLevel(String(ranks.length + 1));
              setNewRankName('');
              setNewRankMinInvest('10000');
              setNewRankReward('500');
              setNewRankDesc('');
              setIsAddRankOpen(true);
            }}
          >
            Create Rank Milestone
          </Button>
        }
      />

      {/* ──────────────── ROLLING ODOMETER SUMMARY KPI CARDS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Rank Rewards Distributed"
          numericValue={leaderboardList.reduce((sum, l) => sum + Number(l.rewardsEarned || l.reward || 0), 0)}
          prefix="$"
          decimals={0}
          change={leaderboardList.length > 0 ? 'Live Rewards' : 'No Rewards'}
          positive={true}
          icon="money"
        />
        <KPICard
          title="Active Rank Achievers"
          numericValue={leaderboardList.length}
          prefix=""
          decimals={0}
          change={leaderboardList.length > 0 ? 'Active Leaders' : 'No Leaders'}
          positive={true}
          icon="users"
        />
        <KPICard
          title="Network Referral Turnover"
          numericValue={leaderboardList.reduce((sum, l) => sum + Number(l.teamTurnover || l.teamVolume || 0), 0)}
          prefix="$"
          decimals={0}
          change={leaderboardList.length > 0 ? 'Team Volume' : 'No Volume'}
          positive={true}
          icon="chart"
        />
        <KPICard
          title="Top Level Titans"
          numericValue={leaderboardList.filter(l => Number(l.rankLevel || l.level || 0) >= 8).length}
          prefix=""
          decimals={0}
          change={leaderboardList.filter(l => Number(l.rankLevel || l.level || 0) >= 8).length > 0 ? 'Apex Leaders' : 'Pending'}
          positive={true}
          icon="wallet"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="card p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'ladder', label: '10-Level Rank Ladder', count: 'Levels 1–10', icon: <RiTrophyLine /> },
            { id: 'achievers', label: 'Rank Achievers Directory', count: `${filteredLeaders.length} Members`, icon: <RiGroupLine /> },
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

      {/* ──────────────── TAB 1: 10-LEVEL RANK LADDER GRID ──────────────── */}
      {activeTab === 'ladder' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 bg-gold-50/50 rounded-2xl border border-gold-200/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-400 text-slate-900 flex items-center justify-center font-bold shadow-xs">
                <RiTrophyLine size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-poppins">
                  10-Tier Rank Progression Ladder
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  Investors unlock one-time instant cash bonus rewards as their total downline referral investment reaches milestone volume.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-white rounded-xl border border-gold-200 text-gold-800 shadow-2xs self-start sm:self-auto">
              Auto-Credited Upon Milestone
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ranks.map((r, i) => (
              <div
                key={r.level}
                className={`card p-5 animate-slide-up hover:shadow-card-hover transition-all border ${
                  r.level === 10
                    ? 'border-gold-400 bg-gradient-to-br from-amber-50/60 via-gold-50/40 to-white ring-2 ring-gold-300 shadow-gold'
                    : 'border-slate-200/90'
                }`}
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center flex-shrink-0">
                      {getRankIcon(r.level)}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gold-700 uppercase tracking-wider">
                        Level {r.level}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 font-poppins leading-tight">
                        {r.name}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditRank(r)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-gold-50 text-slate-600 hover:text-gold-800 border border-slate-200 shadow-2xs transition-colors"
                    title="Edit Rank Thresholds"
                  >
                    <RiEditLine size={15} />
                  </button>
                </div>

                {/* Requirements & Rewards Grid */}
                <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Required Turnover</span>
                    <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
                      ${r.minInvest.toLocaleString()}.00
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/70">
                    <span className="text-[10px] text-emerald-700 font-medium block uppercase tracking-wider">Cash Reward Bonus</span>
                    <span className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5 block">
                      +${r.reward.toLocaleString()}.00
                    </span>
                  </div>
                </div>

                {/* Achievers Counter */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1">
                    <RiGroupLine size={14} className="text-gold-600" />
                    <strong>{r.achievers.toLocaleString()}</strong> Active Achievers
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Unlocked
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: RANK ACHIEVERS DIRECTORY TABLE (MATCHING USERS TABLE STYLING) ──────────────── */}
      {activeTab === 'achievers' && (
        <div className="space-y-4 font-poppins">
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <SearchBar
                placeholder="Search member by name, user ID (HORIZON-USR-01), email, or rank..."
                value={search}
                onChange={setSearch}
                className="flex-1 w-full"
              />
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                Showing {filteredLeaders.length} Registered Members
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
                    <th className="font-medium text-slate-500">Current Rank</th>
                    <th className="font-medium text-slate-500">Referred By (Sponsor)</th>
                    <th className="font-medium text-slate-500">Direct Referrals</th>
                    <th className="font-medium text-slate-500">Network Turnover</th>
                    <th className="font-medium text-slate-500">Cash Reward Bonus</th>
                    <th className="font-medium text-slate-500">Status</th>
                    <th className="text-right pr-6 font-medium text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaders
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((u, i) => {
                    const userCustomId = u.customId || `HORIZON-USR-0${u.id}`;

                    return (
                      <tr
                        key={u.id}
                        className="animate-fade-in hover:bg-slate-50/70 transition-colors"
                        style={{ animationDelay: `${i * 35}ms` }}
                      >
                        {/* User Details (Large Round Avatar) */}
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

                        {/* Current Rank Badge */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gold-50 text-gold-900 text-xs font-semibold border border-gold-300 shadow-2xs whitespace-nowrap font-poppins">
                            <RiTrophyLine size={13} className="text-gold-600" />
                            {u.currentRank || 'Level 1 (Starter)'}
                          </span>
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
                            {u.totalReferrals || 0} Members
                          </span>
                        </td>

                        {/* Network Turnover */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50/90 text-amber-900 text-xs font-semibold border border-amber-300/80 whitespace-nowrap font-poppins">
                            <RiCoinsLine size={13} className="text-amber-600" />
                            ${u.teamVolume.toLocaleString()}.00
                          </span>
                        </td>

                        {/* Cash Reward Bonus */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-300/80 whitespace-nowrap font-poppins shadow-2xs">
                            <RiMoneyDollarCircleLine size={14} className="text-emerald-600" />
                            +${u.rankCashBonus.toLocaleString()}.00
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <Badge variant={u.status === 'Active' ? 'success' : 'danger'} size="sm">
                            {u.status}
                          </Badge>
                        </td>

                        {/* Action: Audit Button (Prominent Gold Button) */}
                        <td className="text-right pr-6">
                          <button
                            onClick={() => setSelectedLeader(u)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-900 text-xs font-semibold transition-all border border-gold-400 hover:border-gold-500 active:scale-95 shadow-gold font-poppins"
                            title="Audit rank milestone progress"
                          >
                            <RiCalculatorLine size={14} className="text-slate-900" />
                            <span>Audit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredLeaders.length === 0 && (
              <div className="p-12 text-center text-xs text-slate-400 font-poppins">
                No rank achievers recorded yet. Achievers will appear here as users progress their turnover milestones.
              </div>
            )}

            {/* ──────────────── 20 ITEMS PER PAGE PAGINATION BAR ──────────────── */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredLeaders.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* ──────────────── EDIT RANK SLIDE-OVER DRAWER WITH IN-DRAWER AUTO CALCULATION (NO DARK BOX, NO EMOJI) ──────────────── */}
      <Modal
        isOpen={!!editingRank}
        onClose={() => setEditingRank(null)}
        title={`Configure Rank: Level ${editingRank?.level} (${editingRank?.name})`}
        subtitle="Live auto-calculation engine for volume thresholds, reward margins & scale projections"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingRank(null)}>Cancel</Button>
            <Button variant="primary" icon={<RiCheckLine />} onClick={handleSaveRank}>
              Save Thresholds
            </Button>
          </>
        }
      >
        {editingRank && (() => {
          const targetNum = Number(editMinInvest) || 1;
          const rewardNum = Number(editReward) || 0;
          const rewardRatio = targetNum > 0 ? ((rewardNum / targetNum) * 100).toFixed(2) : '0.00';
          const netPlatformRetained = Math.max(0, targetNum - rewardNum);
          const platformMargin = targetNum > 0 ? (((targetNum - rewardNum) / targetNum) * 100).toFixed(1) : '100.0';
          const testVolNum = Number(testUserVolume) || 0;
          const testProgress = Math.min(100, Math.round((testVolNum / targetNum) * 100));
          const isUnlocked = testVolNum >= targetNum;
          const remainingVol = Math.max(0, targetNum - testVolNum);

          return (
            <div className="space-y-4 font-poppins">
              {/* Threshold & Bonus Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Referral Turnover ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      value={editMinInvest}
                      onChange={e => setEditMinInvest(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 font-mono outline-none focus:border-gold-400 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Milestone Cash Reward Bonus ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-emerald-600 font-mono">+$</span>
                    <input
                      type="number"
                      value={editReward}
                      onChange={e => setEditReward(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-emerald-600 font-mono outline-none focus:border-gold-400 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* ──────────────── IN-DRAWER AUTO CALCULATION BREAKDOWN ──────────────── */}
              <div className="p-4 bg-gold-50/60 rounded-2xl border border-gold-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <RiCalculatorLine size={16} className="text-gold-600" />
                    In-Drawer Auto Calculation & Profit Margins
                  </h4>
                  <span className="text-[10px] font-bold text-gold-700 bg-gold-100/80 px-2 py-0.5 rounded-md border border-gold-200">
                    Real-Time Math
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                  <div className="p-2.5 bg-white rounded-xl border border-gold-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Reward Yield %</span>
                    <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                      {rewardRatio}%
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-gold-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Platform Margin</span>
                    <span className="text-sm font-extrabold text-slate-800 block mt-0.5">
                      {platformMargin}%
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-gold-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Net Inflow / User</span>
                    <span className="text-sm font-extrabold text-gold-800 block mt-0.5">
                      +${netPlatformRetained.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Scale Projection (100 Achievers Multiplier) */}
                <div className="p-3 bg-white rounded-xl border border-gold-200/70 text-xs space-y-1">
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>When 100 Leaders Achieve Level {editingRank.level}:</span>
                    <span className="font-mono text-slate-800 font-bold">${(targetNum * 100).toLocaleString()} Total Capital</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>Total Cash Rewards Disbursed:</span>
                    <span className="text-red-500 font-semibold">-${(rewardNum * 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-700 font-mono font-bold pt-1 border-t border-slate-100">
                    <span>Net Platform Retained Liquidity:</span>
                    <span>+${(netPlatformRetained * 100).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* ──────────────── LIVE INVESTOR QUALIFICATION TESTER ──────────────── */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Interactive Downline Turnover Tester ($)
                  </label>
                  <span className="text-[11px] font-mono font-bold text-slate-700">
                    {testProgress}% Qualified
                  </span>
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={testUserVolume}
                    onChange={e => setTestUserVolume(e.target.value)}
                    placeholder="Enter test volume..."
                    className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:border-gold-400 outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setTestUserVolume(String(targetNum))}
                    className="px-3 py-2 bg-gold-400 hover:bg-gold-500 text-slate-900 text-xs font-bold rounded-xl shadow-2xs transition-colors"
                  >
                    Match 100%
                  </button>
                </div>

                {/* Progress Visual Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${isUnlocked ? 'bg-emerald-500' : 'bg-gold-400'}`}
                    style={{ width: `${testProgress}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">
                    {isUnlocked ? (
                      <strong className="text-emerald-600 font-sans">Level {editingRank.level} Milestone Unlocked</strong>
                    ) : (
                      <span>${remainingVol.toLocaleString()} remaining to unlock</span>
                    )}
                  </span>
                  <span className="font-bold text-emerald-700">
                    Reward: +${isUnlocked ? rewardNum.toLocaleString() : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ──────────────── CREATE NEW RANK MILESTONE MODAL ──────────────── */}
      <Modal
        isOpen={isAddRankOpen}
        onClose={() => setIsAddRankOpen(false)}
        title="Create New Rank Milestone"
        subtitle="Define turnover requirement and cash reward bonus for new leadership tier"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddRankOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={<RiCheckLine />} onClick={handleCreateRank}>
              Save Milestone
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-poppins text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Rank Level Number *
              </label>
              <input
                type="number"
                value={newRankLevel}
                onChange={e => setNewRankLevel(e.target.value)}
                placeholder="e.g. 11"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 font-mono outline-none focus:border-gold-400 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Rank Title / Name *
              </label>
              <input
                type="text"
                value={newRankName}
                onChange={e => setNewRankName(e.target.value)}
                placeholder="e.g. Sovereign Vanguard"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Turnover ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  value={newRankMinInvest}
                  onChange={e => setNewRankMinInvest(e.target.value)}
                  placeholder="e.g. 25000000"
                  className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 font-mono outline-none focus:border-gold-400 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Cash Reward Bonus ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-emerald-600 font-mono">+$</span>
                <input
                  type="number"
                  value={newRankReward}
                  onChange={e => setNewRankReward(e.target.value)}
                  placeholder="e.g. 1500000"
                  className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-emerald-600 font-mono outline-none focus:border-gold-400 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tier Description & Badge Title
            </label>
            <textarea
              rows={2}
              value={newRankDesc}
              onChange={e => setNewRankDesc(e.target.value)}
              placeholder="e.g. Ultra-high volume continental director commanding nine-figure liquidity."
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-normal text-slate-800 outline-none focus:border-gold-400 shadow-2xs resize-none"
            />
          </div>

          <div className="p-3 bg-gold-50/60 rounded-xl border border-gold-200 text-[11px] text-slate-700 space-y-1">
            <strong>Auto-Sync Engine:</strong>
            <p>Once saved, this new milestone tier instantly synchronizes to the User Platform and updates all leader qualification calculators.</p>
          </div>
        </div>
      </Modal>

      {/* ──────────────── LEADER AUDIT DRAWER ──────────────── */}
      <Modal
        isOpen={!!selectedLeader}
        onClose={() => setSelectedLeader(null)}
        title="Rank Milestone Audit"
        subtitle={selectedLeader ? `${selectedLeader.name} (${selectedLeader.customId})` : ''}
        size="md"
        footer={
          <Button variant="primary" onClick={() => setSelectedLeader(null)}>
            Done
          </Button>
        }
      >
        {selectedLeader && (
          <div className="space-y-4 font-poppins">
            <div className="p-4 bg-gold-50/60 rounded-2xl border border-gold-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-300 to-amber-500 text-slate-900 font-bold flex items-center justify-center text-xs ring-2 ring-gold-200">
                  {selectedLeader.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{selectedLeader.name}</h4>
                  <p className="text-xs text-slate-400">{selectedLeader.email}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gold-400 text-slate-900 text-xs font-bold shadow-2xs">
                <RiTrophyLine size={13} />
                {selectedLeader.currentRank || 'Level 1'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Network Volume</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                  ${selectedLeader.teamVolume.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">Cash Bonus Unlocked</span>
                <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
                  +${selectedLeader.rankCashBonus.toLocaleString()}.00
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
