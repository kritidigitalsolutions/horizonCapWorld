import React, { useState, useEffect } from 'react';
import {
  RiTrophyLine, RiMedalLine, RiAwardLine, RiVipCrownLine, RiGroupLine,
  RiMoneyDollarCircleLine, RiCheckLine, RiPercentLine,
  RiArrowUpCircleLine, RiSparklingLine, RiShieldStarLine, RiTeamLine,
  RiFlashlightLine, RiGlobalLine, RiTimeLine, RiCalculatorLine,
  RiSearchLine, RiInformationLine, RiArrowRightLine, RiCoinsLine, RiWallet3Line,
  RiUserLine, RiStarLine, RiProgress3Line, RiLockLine, RiExternalLinkLine,
  RiShieldCheckLine, RiEyeLine
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { getRankLadder, getMyRankStatus, getLeaderboard } from '../api/ranksApi';
import PageHeader from '../components/ui/PageHeader';
import KPICard from '../components/ui/KPICard';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';

export default function Ranks() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ladder'); // 'ladder', 'leaderboard'
  const [search, setSearch] = useState('');
  const [selectedRankDrawer, setSelectedRankDrawer] = useState(null);
  const [ranks, setRanks] = useState([]);
  const [myRankData, setMyRankData] = useState(null);
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankData = async () => {
      try {
        const [ladderRes, myRankRes, lbRes] = await Promise.allSettled([
          getRankLadder(),
          getMyRankStatus(),
          getLeaderboard(),
        ]);

        if (ladderRes.status === 'fulfilled' && ladderRes.value?.success && Array.isArray(ladderRes.value.ranks)) {
          setRanks(ladderRes.value.ranks);
        } else {
          setRanks([]);
        }

        if (myRankRes.status === 'fulfilled' && myRankRes.value?.success && myRankRes.value.data) {
          setMyRankData(myRankRes.value.data);
        }

        if (lbRes.status === 'fulfilled' && lbRes.value?.success && Array.isArray(lbRes.value.leaderboard)) {
          setLeaderboardList(lbRes.value.leaderboard);
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
    };

    fetchRankData();
  }, []);

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setRanks(e.detail);
      } else {
        const saved = localStorage.getItem('horizon_rank_ladder');
        if (saved) {
          try {
            setRanks(JSON.parse(saved));
          } catch (err) {}
        }
      }
    };

    window.addEventListener('horizon-ranks-change', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('horizon-ranks-change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Safe extraction of currentLevel
  let currentLevel = myRankData?.currentLevel || (user?.rank?.level ? Number(user.rank.level) : 1);
  if (user?.rank) {
    if (typeof user.rank === 'object' && user.rank !== null && user.rank.level) {
      currentLevel = Number(user.rank.level) || currentLevel;
    } else if (typeof user.rank === 'number') {
      currentLevel = user.rank;
    } else if (typeof user.rank === 'string') {
      const match = user.rank.match(/\d+/);
      currentLevel = match ? parseInt(match[0], 10) : currentLevel;
    }
  }
  currentLevel = Math.max(1, Math.min(10, currentLevel));

  const currentRankObj = ranks.find(r => r.level === currentLevel) || ranks[0] || {
    level: 1,
    name: 'Bronze Explorer',
    minInvest: 100,
    reward: 7.5,
    desc: 'Entry leadership rank'
  };
  const nextRankObj = ranks.find(r => r.level === currentLevel + 1) || currentRankObj || ranks[ranks.length - 1] || currentRankObj;

  const currentRankReward = Number(currentRankObj?.reward ?? currentRankObj?.rewardUnlocked ?? 0);
  const nextRankReward = Number(nextRankObj?.reward ?? myRankData?.nextRank?.rewardOnUnlock ?? nextRankObj?.rewardOnUnlock ?? 0);
  const nextRankMinInvest = Number(nextRankObj?.minInvest ?? myRankData?.nextRank?.minInvestRequired ?? nextRankObj?.minInvestRequired ?? 10000);

  // User dynamic turnover
  const userTurnover = Number(myRankData?.teamTurnover ?? user?.teamTurnover ?? user?.totalInvested ?? 0);
  const progressPercent = myRankData?.nextRank?.progressPercent !== undefined
    ? myRankData.nextRank.progressPercent
    : Math.min(100, Math.round((userTurnover / Math.max(1, nextRankMinInvest)) * 100));

  const getRankIcon = (lvl) => {
    if (lvl >= 9) return <RiVipCrownLine size={24} className="text-amber-500" />;
    if (lvl >= 7) return <RiShieldStarLine size={24} className="text-purple-500" />;
    if (lvl >= 5) return <RiSparklingLine size={24} className="text-blue-500" />;
    if (lvl >= 3) return <RiMedalLine size={24} className="text-gold-600" />;
    return <RiAwardLine size={24} className="text-emerald-500" />;
  };

  const filteredLeaders = (leaderboardList || []).filter(l => {
    const q = search.trim().toLowerCase();
    return !q ||
      l.name?.toLowerCase().includes(q) ||
      (l.id || l.customId || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').toLowerCase().includes(q) ||
      (l.rank || l.currentRank || '').toLowerCase().includes(q);
  });

  return (
    <div className="page-enter space-y-6 pb-8 font-poppins">
      {/* ──────── PAGE HEADER ──────── */}
      <PageHeader
        title="Rank Progression Ladder"
        subtitle="Climb leadership ranks and unlock instant cash milestone rewards based on network turnover"
        badge="10-Tier Ladder"
        actions={
          <button
            type="button"
            onClick={() => setSelectedRankDrawer(nextRankObj || currentRankObj)}
            className="btn btn-outline-gold text-xs px-4 py-2.5 rounded-xl font-bold shadow-xs flex items-center gap-2 cursor-pointer bg-white"
          >
            <RiCalculatorLine size={18} className="text-gold-700" />
            <span>Milestone Calculator</span>
          </button>
        }
      />

      {/* ──────────────── 4 ROLLING ODOMETER KPI CARDS (DESIGN.MD) ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Rank Rewards Distributed"
          numericValue={leaderboardList.reduce((sum, l) => sum + Number(l.rewardsEarned || l.reward || 0), 0)}
          prefix="$"
          decimals={0}
          change={leaderboardList.length > 0 ? "Live Rewards" : "Ready"}
          positive={true}
          icon="money"
        />
        <KPICard
          title="Active Rank Achievers"
          numericValue={leaderboardList.length}
          prefix=""
          decimals={0}
          change={leaderboardList.length > 0 ? "Global Achievers" : "Ready"}
          positive={true}
          icon="users"
        />
        <KPICard
          title="Network Referral Turnover"
          numericValue={leaderboardList.reduce((sum, l) => sum + Number(l.teamTurnover || l.teamVolume || l.turnover || 0), 0)}
          prefix="$"
          decimals={0}
          change={leaderboardList.length > 0 ? "Total Turnover" : "Ready"}
          positive={true}
          icon="chart"
        />
        <KPICard
          title="Top Level Titans"
          numericValue={leaderboardList.filter(l => Number(l.rankLevel || l.level || 0) >= 8).length}
          prefix=""
          decimals={0}
          change="Apex Leaders"
          positive={true}
          icon="wallet"
        />
      </div>

      {/* ──────────────── CURRENT USER RANK PROGRESSION BANNER CARD ──────────────── */}
      <div className="card-gold p-6 rounded-2xl shadow-gold border border-gold-300 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 flex items-center justify-center text-slate-950 shadow-gold ring-2 ring-gold-200/80 flex-shrink-0">
              {getRankIcon(currentLevel)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold-900/70 font-poppins">
                YOUR CURRENT LEADERSHIP RANK
              </p>
              <h3 className="text-2xl sm:text-3xl font-black font-display text-slate-950 leading-tight">
                {currentRankObj?.name || 'Explorer'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-gold-400 font-extrabold text-xs shadow-xs">
                  Level {currentLevel} of 10
                </span>
                <span className="text-xs font-bold text-emerald-800">
                  +${currentRankReward.toLocaleString()}.00 Cash Bonus Claimed
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="p-3.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-gold-200 shadow-2xs text-center min-w-[130px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Your Team Turnover
              </span>
              <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">
                ${userTurnover.toLocaleString()}.00
              </span>
            </div>

            <div className="p-3.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-gold-200 shadow-2xs text-center min-w-[130px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Next Rank Bonus
              </span>
              <span className="text-base font-extrabold text-emerald-600 font-mono mt-0.5 block">
                +${nextRankReward.toLocaleString()}.00
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar to Next Level */}
        {currentLevel < 10 && (
          <div className="mt-6 pt-5 border-t border-gold-300/60 relative z-10 space-y-2">
            <div className="flex items-center justify-between text-xs font-poppins">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <RiProgress3Line size={16} className="text-gold-800" />
                Progress towards <strong>{nextRankObj?.name || 'Next Rank'} (Level {nextRankObj?.level || currentLevel + 1})</strong>:
              </span>
              <span className="font-extrabold font-mono text-gold-950">
                ${userTurnover.toLocaleString()} / ${nextRankMinInvest.toLocaleString()} ({progressPercent}%)
              </span>
            </div>

            <div className="h-3 rounded-full bg-white/80 border border-gold-300 p-0.5 shadow-inner overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-500 via-amber-500 to-gold-600 shadow-gold transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-700 font-medium text-right pt-0.5">
              ${Math.max(0, nextRankMinInvest - userTurnover).toLocaleString()} more downline turnover needed to unlock +${nextRankReward.toLocaleString()}.00 reward.
            </p>
          </div>
        )}
      </div>

      {/* ──────────────── TABS SWITCHER (MATCHING SUPER ADMIN) ──────────────── */}
      <div className="card p-2">
        <div className="flex items-center gap-2 overflow-x-auto font-poppins">
          {[
            { id: 'ladder', label: '10-Level Rank Ladder', count: 'Levels 1–10', icon: <RiTrophyLine /> },
            { id: 'leaderboard', label: 'Top Rank Achievers Leaderboard', count: `${leaderboardList.length} Leaders`, icon: <RiGroupLine /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gold-400 text-slate-900 font-bold shadow-gold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

      {/* ──────────────── TAB 1: 10-LEVEL RANK LADDER GRID (MATCHING SUPER ADMIN) ──────────────── */}
      {activeTab === 'ladder' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 bg-gold-50/50 rounded-2xl border border-gold-200/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-400 text-slate-900 flex items-center justify-center font-bold shadow-xs">
                <RiTrophyLine size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-poppins">
                  Milestone Cash Bonus Ladder
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  Unlock one-time instant cash bonuses as your downline referral investment reaches turnover milestones.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-white rounded-xl border border-gold-200 text-gold-800 shadow-2xs self-start sm:self-auto">
              Auto-Credited to Earning Wallet
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ranks.map((r, i) => {
              const isAchieved = r.level <= currentLevel;
              const isCurrent = r.level === currentLevel;
              const isTitan = r.level === 10;

              return (
                <div
                  key={r.level}
                  onClick={() => setSelectedRankDrawer(r)}
                  className={`card p-5 animate-slide-up hover:shadow-card-hover transition-all border flex flex-col justify-between relative cursor-pointer group ${
                    isCurrent
                      ? 'border-gold-400 ring-2 ring-gold-300 bg-gradient-to-br from-gold-50/60 via-white to-white shadow-gold'
                      : isTitan
                      ? 'border-amber-400 bg-gradient-to-br from-amber-50/40 via-gold-50/20 to-white hover:border-amber-500'
                      : isAchieved
                      ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                      : 'border-slate-200/90 hover:border-gold-300'
                  }`}
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  {/* Status Badge in Corner */}
                  {isCurrent && (
                    <div className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full bg-slate-950 text-gold-400 text-[10px] font-extrabold uppercase shadow-sm border border-gold-400">
                      Your Current Rank
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Top Row: Icon + Level + Name */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          {getRankIcon(r.level)}
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-gold-700 uppercase tracking-wider block">
                            Level {r.level}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 font-poppins leading-tight">
                            {r.name}
                          </h4>
                        </div>
                      </div>

                      <Badge variant={isAchieved ? 'success' : 'default'} size="sm">
                        {isAchieved ? 'Unlocked' : 'Locked'}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 font-normal leading-relaxed">
                      {r.desc}
                    </p>

                    {/* Requirements & Rewards Grid (Matching Super Admin) */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                        <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                          Required Turnover
                        </span>
                        <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                          ${(Number(r.minInvest) || 0).toLocaleString()}.00
                        </span>
                      </div>

                      <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/70">
                        <span className="text-[10px] text-emerald-700 font-medium block uppercase tracking-wider">
                          Cash Reward Bonus
                        </span>
                        <span className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5 block">
                          +${(Number(r.reward) || 0).toLocaleString()}.00
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Achievers + Prominent Audit CTA */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <RiGroupLine size={14} className="text-gold-600" />
                      <strong>{(Number(r.achievers) || 0).toLocaleString()}</strong> Active Achievers
                    </span>

                    <span className="text-xs font-bold text-gold-800 group-hover:text-gold-950 inline-flex items-center gap-1 transition-colors">
                      Audit Milestone <RiArrowRightLine size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: GLOBAL ACHIEVERS LEADERBOARD (MATCHING SUPER ADMIN USERS TABLE EXACTLY) ──────────────── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4 font-poppins">
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <SearchBar
                placeholder="Search leader by name, user ID (HORIZON-USR-01), email, or rank..."
                value={search}
                onChange={setSearch}
                className="flex-1 w-full"
              />
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                Showing {filteredLeaders.length} Registered Leaders
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
                  {filteredLeaders.map((u, i) => {
                    const matchedRank = ranks.find(r => r.level === (u.level || u.rankLevel) || r.name?.toLowerCase() === (u.rank || u.currentRank || '').toLowerCase()) || ranks[0] || null;

                    return (
                      <tr
                        key={u.id}
                        className="animate-fade-in hover:bg-slate-50/70 transition-colors"
                        style={{ animationDelay: `${i * 35}ms` }}
                      >
                        {/* User Details (Large Round Avatar with Initials) */}
                        <td>
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-900 font-bold flex items-center justify-center flex-shrink-0 shadow-xs ring-2 ring-gold-200/80 text-xs font-poppins">
                              {(u.name || 'User').split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate leading-tight font-poppins">
                                {u.name}
                              </p>
                              <p className="text-[11px] font-medium text-gold-600 font-poppins tracking-tight mt-0.5 font-mono">
                                {u.id}
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
                            {u.rank} (L{u.level})
                          </span>
                        </td>

                        {/* Referred By / Sponsor */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-50/80 text-slate-700 text-xs font-medium border border-gold-200/80 whitespace-nowrap font-poppins">
                            <RiGroupLine size={13} className="text-gold-600" />
                            {u.sponsor}
                          </span>
                        </td>

                        {/* Direct Referrals */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200/80 whitespace-nowrap font-poppins">
                            <RiGroupLine size={13} className="text-blue-500" />
                            {u.directRefs} Members
                          </span>
                        </td>

                        {/* Network Turnover */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50/90 text-amber-900 text-xs font-semibold border border-amber-300/80 whitespace-nowrap font-poppins font-mono">
                            <RiCoinsLine size={13} className="text-amber-600" />
                            ${(Number(u.turnover) || 0).toLocaleString()}.00
                          </span>
                        </td>

                        {/* Cash Reward Bonus */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-300/80 whitespace-nowrap font-poppins shadow-2xs font-mono">
                            <RiMoneyDollarCircleLine size={14} className="text-emerald-600" />
                            +${(Number(u.reward) || 0).toLocaleString()}.00
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
                            type="button"
                            onClick={() => setSelectedRankDrawer(matchedRank)}
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
                No rank achievers recorded yet. Achievers will appear here as network milestones are reached.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── SLIDE-OVER DRAWER: MILESTONE CALCULATOR & BREAKDOWN (MATCHING SUPER ADMIN) ──────────────── */}
      <Modal
        isOpen={Boolean(selectedRankDrawer)}
        onClose={() => setSelectedRankDrawer(null)}
        title={selectedRankDrawer ? `${selectedRankDrawer.name} — Level ${selectedRankDrawer.level} Audit` : 'Rank Details'}
        subtitle="Turnover milestone specifications, instant cash bonuses & unlock audit"
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setSelectedRankDrawer(null)}
            className="btn btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-gold cursor-pointer"
          >
            Close Breakdown
          </button>
        }
      >
        {selectedRankDrawer && (
          <div className="space-y-5 font-poppins">
            {/* Header Card */}
            <div className="p-4 bg-gradient-to-r from-gold-50/80 via-white to-slate-50 rounded-2xl border border-gold-200 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white border border-gold-300 shadow-xs flex items-center justify-center">
                  {getRankIcon(selectedRankDrawer.level)}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gold-700 uppercase tracking-wider">
                    Leadership Tier L{selectedRankDrawer.level}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 font-display leading-tight">
                    {selectedRankDrawer.name}
                  </h4>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Cash Bonus
                </span>
                <span className="text-lg font-extrabold text-emerald-600 font-mono">
                  +${(selectedRankDrawer.reward || 0).toLocaleString()}.00
                </span>
              </div>
            </div>

            {/* Turnover Gap & Estimation Calculation */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <RiCalculatorLine size={15} className="text-gold-700" />
                Personal Milestone Qualification
              </h5>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Your Current Turnover:</span>
                  <span className="font-mono font-bold text-slate-900">${userTurnover.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Target Turnover Required:</span>
                  <span className="font-mono font-bold text-slate-900">${(selectedRankDrawer.minInvest || 0).toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Remaining Volume Gap:</span>
                  <span className="font-mono font-bold text-amber-600">
                    ${Math.max(0, (selectedRankDrawer.minInvest || 0) - userTurnover).toLocaleString()}.00
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Auto-Credit Destination:</span>
                  <span className="font-bold text-slate-900">Earning Wallet (Instant Withdrawal)</span>
                </div>
              </div>
            </div>

            {/* 3-Step Unlock Instructions */}
            <div className="p-4 bg-gold-50/60 rounded-2xl border border-gold-200 space-y-2 text-xs">
              <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <RiShieldCheckLine size={15} className="text-gold-700" />
                How to Unlock This Milestone:
              </h5>
              <ul className="space-y-1.5 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-gold-400 text-slate-950 font-extrabold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Share your affiliate link with partners & active investors.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-gold-400 text-slate-950 font-extrabold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Total investment volume across your multi-tier downline accumulates automatically.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-gold-400 text-slate-950 font-extrabold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>When target is reached, +${(selectedRankDrawer.reward || 0).toLocaleString()}.00 is credited to your wallet with zero admin hold.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
