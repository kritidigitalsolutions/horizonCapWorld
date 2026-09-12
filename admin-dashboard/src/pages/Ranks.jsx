import React, { useState, useEffect, useCallback } from 'react';
import {
  RiTrophyLine, RiMedalLine, RiAwardLine, RiVipCrownLine, RiGroupLine,
  RiMoneyDollarCircleLine, RiEditLine, RiCheckLine, RiPercentLine,
  RiArrowUpCircleLine, RiSparklingLine, RiShieldStarLine, RiTeamLine,
  RiFlashlightLine, RiGlobalLine, RiTimeLine, RiCalculatorLine,
  RiSearchLine, RiInformationLine, RiArrowRightLine, RiCoinsLine, RiWallet3Line,
  RiAddLine, RiCloseLine, RiAlertLine
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

// Initial 9-Tier Rank Ladder (Spreadsheet Standard)
const defaultRanksList = [
  {
    level: 1,
    name: 'Associate',
    ownDeposit: 50,
    totalClientDeposit: 5000,
    minInvest: 5000,
    reward: 100,
    condition: '1 Leg should not be more than 40% of the GV',
    companyProfitSharing: '0',
    downlineStructureRequired: '2 Active Direct Client',
    achievers: 4890,
    desc: 'Entry leadership rank unlocked with active direct network.',
    status: 'Active',
  },
  {
    level: 2,
    name: 'Senior Associate',
    ownDeposit: 100,
    totalClientDeposit: 10000,
    minInvest: 10000,
    reward: 300,
    condition: '1 Leg should not be more than 40% of the GV',
    companyProfitSharing: '0',
    downlineStructureRequired: '3 Active Direct Clients',
    achievers: 2340,
    desc: 'Demonstrated network volume builder.',
    status: 'Active',
  },
  {
    level: 3,
    name: 'Team Leader',
    ownDeposit: 250,
    totalClientDeposit: 25000,
    minInvest: 25000,
    reward: 875,
    condition: '1 Leg should not be more than 40% of the GV',
    companyProfitSharing: '0',
    downlineStructureRequired: '3 Active Direct Clients ( Min. 1 Associate )',
    achievers: 1210,
    desc: 'Regional leadership leader managing team turnover.',
    status: 'Active',
  },
  {
    level: 4,
    name: 'Director',
    ownDeposit: 500,
    totalClientDeposit: 50000,
    minInvest: 50000,
    reward: 2000,
    condition: '1 Leg should not be more than 40% of the GV',
    companyProfitSharing: '0',
    downlineStructureRequired: '4 Active Direct Clients ( Min 2 Sr. Associate )',
    achievers: 680,
    desc: 'Executive director supervising multi-tier syndicates.',
    status: 'Active',
  },
  {
    level: 5,
    name: 'Regional Director',
    ownDeposit: 1000,
    totalClientDeposit: 100000,
    minInvest: 100000,
    reward: 5000,
    condition: '1 Leg should not be more than 40% of the GV',
    companyProfitSharing: '0',
    downlineStructureRequired: '4 Active Direct Clients ( Min. 2 Team Leaders )',
    achievers: 340,
    desc: 'Senior regional executive commanding six-figure volume.',
    status: 'Active',
  },
  {
    level: 6,
    name: 'Executive Director',
    ownDeposit: 1500,
    totalClientDeposit: 200000,
    minInvest: 200000,
    reward: 10000,
    condition: '1 Leg should not be more than 40% of the GV',
    companyProfitSharing: '0.20% of the total company Profit + 500$ Per Month Salary',
    downlineStructureRequired: '5 Active Direct Clients ( Min. 2 Directors )',
    achievers: 160,
    desc: 'Corporate syndicate leader receiving monthly salary and profit share.',
    status: 'Active',
  },
  {
    level: 7,
    name: 'Diamond',
    ownDeposit: 2000,
    totalClientDeposit: 300000,
    minInvest: 300000,
    reward: 15000,
    condition: '1 Leg should not be more than 40% of the GV',
    companyProfitSharing: '0.50% of the Total Company Profit + 1000$ Per Month Salary',
    downlineStructureRequired: '6 Active Direct Clients ( Min. 2 Regional Directors )',
    achievers: 72,
    desc: 'High-tier executive with expanded profit share and salary.',
    status: 'Active',
  },
  {
    level: 8,
    name: 'Crown Diamond',
    ownDeposit: 3000,
    totalClientDeposit: 600000,
    minInvest: 600000,
    reward: 35000,
    condition: '1 Leg should not be more than 40% of the GV',
    companyProfitSharing: '0.75% of the Total Company Profit + 1500$ Per Month Salary',
    downlineStructureRequired: '8 Active Direct Clients ( Min. 2 Executive Directors )',
    achievers: 28,
    desc: 'Elite summit council member with premier dividends.',
    status: 'Active',
  },
  {
    level: 9,
    name: 'Global Ambassador',
    ownDeposit: 5000,
    totalClientDeposit: 1000000,
    minInvest: 1000000,
    reward: 60000,
    condition: '1 Leg should not be more than 40% of the GV',
    companyProfitSharing: '1% of the Total Company Profit + 3000$ Per Month Salary',
    downlineStructureRequired: '10 Active Direct Clients ( Min. 2 Diamonds )',
    achievers: 11,
    desc: 'Apex global ambassador commanding global network volume.',
    status: 'Active',
  },
];

export default function Ranks() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ladder'); // 'ladder', 'cards', 'achievers'
  const [ranks, setRanks] = useState(defaultRanksList);
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Edit Rank Modal State
  const [editingRank, setEditingRank] = useState(null);
  const [editName, setEditName] = useState('');
  const [editOwnDeposit, setEditOwnDeposit] = useState('');
  const [editTotalClientDeposit, setEditTotalClientDeposit] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editReward, setEditReward] = useState('');
  const [editCompanyProfitSharing, setEditCompanyProfitSharing] = useState('');
  const [editDownlineStructureRequired, setEditDownlineStructureRequired] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editDesc, setEditDesc] = useState('');

  // Add New Rank Modal State
  const [isAddRankOpen, setIsAddRankOpen] = useState(false);
  const [newRankLevel, setNewRankLevel] = useState('');
  const [newRankName, setNewRankName] = useState('');
  const [newRankOwnDeposit, setNewRankOwnDeposit] = useState('5000');
  const [newRankTotalClientDeposit, setNewRankTotalClientDeposit] = useState('2000000');
  const [newRankCondition, setNewRankCondition] = useState('1 Leg should not be more than 40% of the GV');
  const [newRankReward, setNewRankReward] = useState('100000');
  const [newRankCompanyProfitSharing, setNewRankCompanyProfitSharing] = useState('1.5% of the Total Company Profit + 5000$ Per Month Salary');
  const [newRankDownlineStructureRequired, setNewRankDownlineStructureRequired] = useState('12 Active Direct Clients ( Min. 2 Global Ambassadors )');
  const [newRankDesc, setNewRankDesc] = useState('');

  // Leader Calculation Breakdown Drawer State
  const [selectedLeader, setSelectedLeader] = useState(null);

  const fetchRanksData = useCallback(async () => {
    try {
      const [ranksRes, leaderRes] = await Promise.allSettled([
        getAllRanks(),
        getAchieversLeaderboard()
      ]);

      if (ranksRes.status === 'fulfilled' && ranksRes.value?.success && Array.isArray(ranksRes.value.ranks) && ranksRes.value.ranks.length > 0) {
        setRanks(ranksRes.value.ranks);
      } else {
        const saved = localStorage.getItem('horizon_rank_ladder');
        if (saved) {
          try {
            setRanks(JSON.parse(saved));
          } catch (e) {
            setRanks(defaultRanksList);
          }
        } else {
          setRanks(defaultRanksList);
        }
      }

      if (leaderRes.status === 'fulfilled' && leaderRes.value?.success && Array.isArray(leaderRes.value.leaderboard)) {
        setLeaderboardList(leaderRes.value.leaderboard);
      } else {
        setLeaderboardList([]);
      }
    } catch (err) {
      console.warn('Error fetching ranks data:', err.message);
      setRanks(defaultRanksList);
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
    setEditName(r.name || '');
    setEditOwnDeposit(String(r.ownDeposit !== undefined ? r.ownDeposit : 0));
    setEditTotalClientDeposit(String(r.totalClientDeposit !== undefined ? r.totalClientDeposit : (r.minInvest || 5000)));
    setEditCondition(r.condition || '1 Leg should not be more than 40% of the GV');
    setEditReward(String(r.reward || 100));
    setEditCompanyProfitSharing(r.companyProfitSharing !== undefined ? String(r.companyProfitSharing) : '0');
    setEditDownlineStructureRequired(r.downlineStructureRequired || '');
    setEditStatus(r.status || 'Active');
    setEditDesc(r.desc || '');
  };

  const handleSaveRank = async () => {
    if (!editingRank) return;

    const payload = {
      name: editName.trim() || editingRank.name,
      ownDeposit: Number(editOwnDeposit) || 0,
      totalClientDeposit: Number(editTotalClientDeposit) || 0,
      minInvest: Number(editTotalClientDeposit) || 0,
      reward: Number(editReward) || 0,
      condition: editCondition.trim(),
      companyProfitSharing: editCompanyProfitSharing.trim(),
      downlineStructureRequired: editDownlineStructureRequired.trim(),
      status: editStatus,
      desc: editDesc.trim(),
    };

    try {
      if (editingRank._id || editingRank.level) {
        await updateRank(editingRank._id || editingRank.level, payload);
      }
    } catch (err) {
      console.warn('API update rank error:', err.message);
    }

    const updated = ranks.map(r => r.level === editingRank.level ? {
      ...r,
      ...payload,
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
      ownDeposit: Number(newRankOwnDeposit) || 0,
      totalClientDeposit: Number(newRankTotalClientDeposit) || 0,
      minInvest: Number(newRankTotalClientDeposit) || 0,
      reward: Number(newRankReward) || 0,
      condition: newRankCondition.trim() || '1 Leg should not be more than 40% of the GV',
      companyProfitSharing: newRankCompanyProfitSharing.trim() || '0',
      downlineStructureRequired: newRankDownlineStructureRequired.trim(),
      achievers: 0,
      desc: newRankDesc.trim() || 'Leadership milestone tier.',
      status: 'Active',
    };

    try {
      await createRank(newRankItem);
    } catch (err) {
      console.warn('API create rank error:', err.message);
    }

    const updated = [...ranks.filter(r => r.level !== lvl), newRankItem].sort((a, b) => a.level - b.level);
    setRanks(updated);
    localStorage.setItem('horizon_rank_ladder', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('horizon-ranks-change', { detail: updated }));
    setIsAddRankOpen(false);
    setNewRankName('');
    setNewRankLevel('');
    setNewRankOwnDeposit('5000');
    setNewRankTotalClientDeposit('2000000');
    setNewRankReward('100000');
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
      currentRank: u.currentRank || u.rank || (rankObj?.name || 'Associate'),
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
        subtitle="Configure milestone turnover requirements, instant cash rewards, company profit sharing & downline structures"
        badge={`${ranks.length}-Tier Ladder`}
        actions={
          <Button
            variant="primary"
            icon={<RiAddLine />}
            onClick={() => {
              setNewRankLevel(String(ranks.length + 1));
              setNewRankName('');
              setNewRankOwnDeposit('5000');
              setNewRankTotalClientDeposit('2000000');
              setNewRankReward('100000');
              setNewRankDesc('');
              setIsAddRankOpen(true);
            }}
          >
            Add Rank Milestone
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
          numericValue={leaderboardList.filter(l => Number(l.rankLevel || l.level || 0) >= 7).length}
          prefix=""
          decimals={0}
          change={leaderboardList.filter(l => Number(l.rankLevel || l.level || 0) >= 7).length > 0 ? 'Apex Leaders' : 'Pending'}
          positive={true}
          icon="wallet"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="card p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'ladder', label: 'Rank Ladder (Spreadsheet View)', count: `${ranks.length} Tiers`, icon: <RiTrophyLine /> },
            { id: 'cards', label: 'Milestone Cards Grid', count: 'Visual', icon: <RiAwardLine /> },
            { id: 'achievers', label: 'Rank Achievers Directory', count: `${filteredLeaders.length} Members`, icon: <RiGroupLine /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gold-400 text-slate-900 font-bold shadow-gold'
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

      {/* ──────────────── TAB 1: RANK LADDER SPREADSHEET TABLE (MATCHING USER SCREENSHOT) ──────────────── */}
      {activeTab === 'ladder' && (
        <div className="space-y-6">
          <div className="card overflow-hidden shadow-sm border border-gold-300">
            {/* Bright Yellow Header Banner matching exact spreadsheet design */}
            <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-5 py-3.5 flex items-center justify-between text-slate-950 font-poppins">
              <div className="flex items-center gap-2.5">
                <RiTrophyLine size={22} className="text-slate-950" />
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">
                  Rank Ladder
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-slate-950 text-gold-300 px-3 py-1 rounded-full uppercase tracking-wider">
                  {ranks.length} Active Ranks
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNewRankLevel(String(ranks.length + 1));
                    setNewRankName('');
                    setNewRankOwnDeposit('5000');
                    setNewRankTotalClientDeposit('2000000');
                    setNewRankReward('100000');
                    setNewRankDesc('');
                    setIsAddRankOpen(true);
                  }}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs rounded-lg shadow-2xs border border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RiAddLine size={15} /> Add Rank
                </button>
              </div>
            </div>

            {/* Exact Spreadsheet Columns Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-poppins">
                <thead>
                  <tr className="bg-amber-100/70 border-b border-amber-300 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4 text-center border-r border-amber-200/80 w-16">#</th>
                    <th className="py-3 px-4 border-r border-amber-200/80 min-w-[170px]">Rank Name</th>
                    <th className="py-3 px-4 text-center border-r border-amber-200/80 min-w-[120px]">Own Deposit ($)</th>
                    <th className="py-3 px-4 text-center border-r border-amber-200/80 min-w-[150px]">Total Client Deposit ($)</th>
                    <th className="py-3 px-4 border-r border-amber-200/80 min-w-[220px]">Condition</th>
                    <th className="py-3 px-4 text-center border-r border-amber-200/80 min-w-[150px]">One Time Cash Reward ($)</th>
                    <th className="py-3 px-4 border-r border-amber-200/80 min-w-[240px]">Company Profit %ge</th>
                    <th className="py-3 px-4 border-r border-amber-200/80 min-w-[240px]">Downline Structure required</th>
                    <th className="py-3 px-4 text-right pr-6 min-w-[100px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                  {ranks.map((r, i) => {
                    const ownDep = Number(r.ownDeposit !== undefined ? r.ownDeposit : 0);
                    const clientDep = Number(r.totalClientDeposit !== undefined ? r.totalClientDeposit : (r.minInvest || 0));
                    const rewardAmt = Number(r.reward || 0);
                    const condText = r.condition || '1 Leg should not be more than 40% of the GV';
                    const profitShare = r.companyProfitSharing !== undefined ? String(r.companyProfitSharing) : '0';
                    const downlineReq = r.downlineStructureRequired || '-';

                    return (
                      <tr
                        key={r._id || r.level}
                        className={`hover:bg-amber-50/60 transition-colors ${
                          i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        {/* Level Index */}
                        <td className="py-3.5 px-4 text-center font-black text-slate-900 font-mono text-sm bg-amber-50/40 border-r border-slate-200">
                          {r.level}
                        </td>

                        {/* Rank Name with Icon */}
                        <td className="py-3.5 px-4 border-r border-slate-200">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white border border-gold-300 shadow-2xs flex items-center justify-center flex-shrink-0">
                              {getRankIcon(r.level)}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 text-sm block font-poppins">
                                {r.name}
                              </span>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded uppercase tracking-wider">
                                Tier {r.level}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Own Deposit */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 text-sm border-r border-slate-200">
                          ${ownDep.toLocaleString()}
                        </td>

                        {/* Total Client Deposit */}
                        <td className="py-3.5 px-4 text-center font-mono font-extrabold text-slate-950 text-sm border-r border-slate-200">
                          ${clientDep.toLocaleString()}
                        </td>

                        {/* Condition */}
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700 border-r border-slate-200">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-mono text-[11px]">
                            {condText}
                          </span>
                        </td>

                        {/* One Time Cash Reward */}
                        <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-700 text-sm border-r border-slate-200 bg-emerald-50/20">
                          +${rewardAmt.toLocaleString()}
                        </td>

                        {/* Company Profit %ge */}
                        <td className="py-3.5 px-4 text-xs border-r border-slate-200">
                          {profitShare === '0' || profitShare === 0 || !profitShare ? (
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono font-bold">
                              0
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 font-bold border border-purple-200 text-[11px] leading-tight">
                              {profitShare}
                            </span>
                          )}
                        </td>

                        {/* Downline Structure required */}
                        <td className="py-3.5 px-4 text-xs border-r border-slate-200">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-950 font-semibold border border-amber-200 text-[11px]">
                            {downlineReq}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right pr-6">
                          <button
                            type="button"
                            onClick={() => openEditRank(r)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold-400 hover:bg-gold-500 text-slate-950 text-xs font-bold transition-all border border-gold-500 shadow-2xs active:scale-95 cursor-pointer"
                          >
                            <RiEditLine size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: MILESTONE CARDS GRID ──────────────── */}
      {activeTab === 'cards' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 bg-gold-50/50 rounded-2xl border border-gold-200/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-400 text-slate-900 flex items-center justify-center font-bold shadow-xs">
                <RiTrophyLine size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-poppins">
                  {ranks.length}-Tier Rank Progression Milestone Grid
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
                  r.level === ranks.length
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
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-gold-50 text-slate-600 hover:text-gold-800 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                    title="Edit Rank Thresholds"
                  >
                    <RiEditLine size={15} />
                  </button>
                </div>

                {/* Requirements & Rewards Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
                    <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Own Dep.</span>
                    <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                      ${Number(r.ownDeposit || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
                    <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Client Dep.</span>
                    <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                      ${Number(r.totalClientDeposit || r.minInvest || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200/70 text-center">
                    <span className="text-[10px] text-emerald-700 font-medium block uppercase tracking-wider">Cash Reward</span>
                    <span className="text-xs font-extrabold text-emerald-700 font-mono mt-0.5 block">
                      +${Number(r.reward || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Structure requirement */}
                <div className="mt-3 p-2 bg-amber-50/50 rounded-xl border border-amber-200/70 text-[11px] text-slate-700">
                  <strong className="text-amber-950 font-bold block mb-0.5">Required Downline:</strong>
                  <span>{r.downlineStructureRequired || 'Direct Clients Required'}</span>
                </div>

                {/* Profit sharing if any */}
                {r.companyProfitSharing && r.companyProfitSharing !== '0' && (
                  <div className="mt-2 p-2 bg-purple-50/50 rounded-xl border border-purple-200/70 text-[11px] text-purple-950">
                    <strong className="font-bold block mb-0.5">Profit %ge & Salary:</strong>
                    <span>{r.companyProfitSharing}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: RANK ACHIEVERS DIRECTORY TABLE ──────────────── */}
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
                        <td className="text-xs font-normal text-slate-500 font-poppins font-mono">
                          {u.phone || '+91 98765 43210'}
                        </td>

                        {/* Current Rank Badge */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gold-50 border border-gold-300/80 text-slate-900 font-medium text-xs shadow-2xs font-poppins">
                            <RiTrophyLine size={13} className="text-gold-600" />
                            {u.currentRank}
                          </span>
                        </td>

                        {/* Sponsor */}
                        <td className="text-xs font-mono font-medium text-slate-600 font-poppins">
                          {u.sponsor}
                        </td>

                        {/* Direct Referrals Count */}
                        <td className="text-center font-bold text-slate-800 text-xs font-mono font-poppins">
                          {u.directRefs} Directs
                        </td>

                        {/* Network Turnover */}
                        <td className="font-bold text-slate-900 text-xs font-mono font-poppins">
                          ${u.turnover.toLocaleString()}.00
                        </td>

                        {/* Cash Bonus Unlocked */}
                        <td className="font-extrabold text-emerald-600 text-xs font-mono font-poppins">
                          +${u.reward.toLocaleString()}.00
                        </td>

                        {/* Status Badge */}
                        <td>
                          <Badge variant={u.status === 'Active' ? 'success' : 'neutral'} size="sm">
                            {u.status}
                          </Badge>
                        </td>

                        {/* Action: Audit Button */}
                        <td className="text-right pr-6">
                          <button
                            onClick={() => setSelectedLeader(u)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-900 text-xs font-semibold transition-all border border-gold-400 hover:border-gold-500 active:scale-95 shadow-gold font-poppins cursor-pointer"
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

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredLeaders.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* ──────────────── EDIT RANK MODAL (ALL SPREADSHEET FIELDS) ──────────────── */}
      <Modal
        isOpen={!!editingRank}
        onClose={() => setEditingRank(null)}
        title={`Edit Rank: Level ${editingRank?.level} (${editingRank?.name})`}
        subtitle="Update own deposit, total client deposit, cash rewards, conditions, and profit sharing"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingRank(null)}>Cancel</Button>
            <Button variant="primary" icon={<RiCheckLine />} onClick={handleSaveRank}>
              Save Rank Changes
            </Button>
          </>
        }
      >
        {editingRank && (
          <div className="space-y-4 font-poppins">
            {/* Row 1: Name and Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rank Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. Associate"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Row 2: Own Deposit, Total Client Deposit, One Time Cash Reward */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Own Deposit ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    value={editOwnDeposit}
                    onChange={e => setEditOwnDeposit(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 font-mono outline-none focus:border-gold-400 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Total Client Deposit ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    value={editTotalClientDeposit}
                    onChange={e => setEditTotalClientDeposit(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 font-mono outline-none focus:border-gold-400 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  One Time Cash Reward ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-emerald-600 font-mono">+$</span>
                  <input
                    type="number"
                    value={editReward}
                    onChange={e => setEditReward(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-emerald-600 font-mono outline-none focus:border-gold-400 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Condition Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Condition
              </label>
              <input
                type="text"
                value={editCondition}
                onChange={e => setEditCondition(e.target.value)}
                placeholder="1 Leg should not be more than 40% of the GV"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              />
            </div>

            {/* Row 4: Company Profit %ge and Salary */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Company Profit %ge & Monthly Salary
              </label>
              <input
                type="text"
                value={editCompanyProfitSharing}
                onChange={e => setEditCompanyProfitSharing(e.target.value)}
                placeholder="0 or 0.20% of the total company Profit + 500$ Per Month Salary"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              />
            </div>

            {/* Row 5: Downline Structure required */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Downline Structure required
              </label>
              <input
                type="text"
                value={editDownlineStructureRequired}
                onChange={e => setEditDownlineStructureRequired(e.target.value)}
                placeholder="e.g. 2 Active Direct Client or 3 Active Direct Clients ( Min. 1 Associate )"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              />
            </div>

            {/* In-Drawer Calculation Summary */}
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-300 space-y-2">
              <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <RiCalculatorLine size={15} className="text-amber-700" />
                Live Reward Margin Breakdown
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-lg border border-amber-200 font-mono">
                  <span className="text-[10px] text-slate-400 block font-sans uppercase">Required Volume</span>
                  <span className="font-bold text-slate-800">${Number(editTotalClientDeposit || 0).toLocaleString()}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-amber-200 font-mono">
                  <span className="text-[10px] text-slate-400 block font-sans uppercase">Cash Reward</span>
                  <span className="font-bold text-emerald-600">+${Number(editReward || 0).toLocaleString()}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-amber-200 font-mono">
                  <span className="text-[10px] text-slate-400 block font-sans uppercase">Reward Yield</span>
                  <span className="font-bold text-amber-800">
                    {Number(editTotalClientDeposit) > 0 ? ((Number(editReward) / Number(editTotalClientDeposit)) * 100).toFixed(2) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── ADD NEW RANK MODAL ──────────────── */}
      <Modal
        isOpen={isAddRankOpen}
        onClose={() => setIsAddRankOpen(false)}
        title="Add New Rank Milestone Tier"
        subtitle="Create a new leadership level with turnover thresholds, cash rewards, conditions, and profit sharing"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddRankOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={<RiAddLine />} onClick={handleCreateRank}>
              Create Rank Milestone
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-poppins">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tier Level Number *
              </label>
              <input
                type="number"
                value={newRankLevel}
                onChange={e => setNewRankLevel(e.target.value)}
                placeholder="e.g. 10"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 font-mono outline-none focus:border-gold-400 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Rank Name *
              </label>
              <input
                type="text"
                value={newRankName}
                onChange={e => setNewRankName(e.target.value)}
                placeholder="e.g. Global Sovereign"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Own Deposit ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  value={newRankOwnDeposit}
                  onChange={e => setNewRankOwnDeposit(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 font-mono outline-none focus:border-gold-400 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Client Deposit ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  value={newRankTotalClientDeposit}
                  onChange={e => setNewRankTotalClientDeposit(e.target.value)}
                  placeholder="e.g. 2000000"
                  className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 font-mono outline-none focus:border-gold-400 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                One Time Cash Reward ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-emerald-600 font-mono">+$</span>
                <input
                  type="number"
                  value={newRankReward}
                  onChange={e => setNewRankReward(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-emerald-600 font-mono outline-none focus:border-gold-400 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Condition
            </label>
            <input
              type="text"
              value={newRankCondition}
              onChange={e => setNewRankCondition(e.target.value)}
              placeholder="1 Leg should not be more than 40% of the GV"
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Company Profit %ge & Salary
            </label>
            <input
              type="text"
              value={newRankCompanyProfitSharing}
              onChange={e => setNewRankCompanyProfitSharing(e.target.value)}
              placeholder="e.g. 1.5% of the Total Company Profit + 5000$ Per Month Salary"
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Downline Structure required
            </label>
            <input
              type="text"
              value={newRankDownlineStructureRequired}
              onChange={e => setNewRankDownlineStructureRequired(e.target.value)}
              placeholder="e.g. 12 Active Direct Clients ( Min. 2 Global Ambassadors )"
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
            />
          </div>

          <div className="p-3 bg-gold-50/60 rounded-xl border border-gold-200 text-[11px] text-slate-700 space-y-1">
            <strong>Instant Synchronization:</strong>
            <p>Once saved, this new milestone tier instantly synchronizes to the User Platform.</p>
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
                {selectedLeader.currentRank || 'Associate'}
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
