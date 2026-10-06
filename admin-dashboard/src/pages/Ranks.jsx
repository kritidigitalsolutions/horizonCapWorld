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
import { useToast } from '../context/ToastContext';
import {
  getAllRanks,
  createRank,
  updateRank,
  deleteRank,
  getAchieversLeaderboard
} from '../api/ranksApi';
import { adjustUserWallet } from '../api/usersApi';

// Initial 12-Tier Rank Ladder (Spreadsheet Standard)
const defaultRanksList = [
  {
    level: 1,
    name: 'Associate',
    ownDeposit: 50,
    totalClientDeposit: 5000,
    minInvest: 5000,
    reward: 100,
    condition: 'Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )',
    companyProfitSharing: '0',
    salaryCondition: '',
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
    condition: 'Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )',
    companyProfitSharing: '0',
    salaryCondition: '',
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
    condition: 'Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )',
    companyProfitSharing: '0',
    salaryCondition: '',
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
    condition: 'Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )',
    companyProfitSharing: '0',
    salaryCondition: '',
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
    condition: 'Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )',
    companyProfitSharing: '0',
    salaryCondition: '',
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
    condition: 'Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )',
    companyProfitSharing: '0.20% of the total company Profit + 500$ Per Month Salary',
    salaryCondition: 'Monthly salary requires maintaining active direct clients and team turnover criteria each month.',
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
    condition: 'Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )',
    companyProfitSharing: '0.50% of the Total Company Profit + 1000$ Per Month Salary',
    salaryCondition: 'Monthly salary requires maintaining active direct clients and team turnover criteria each month.',
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
    reward: 30000,
    condition: 'Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )',
    companyProfitSharing: '0.75% of the Total Company Profit + 1500$ Per Month Salary',
    salaryCondition: 'Monthly salary requires maintaining active direct clients and team turnover criteria each month.',
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
    reward: 50000,
    condition: 'Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )',
    companyProfitSharing: '1% of the Total Company Profit + 3000$ Per Month Salary',
    salaryCondition: 'Monthly salary requires maintaining active direct clients and team turnover criteria each month.',
    downlineStructureRequired: '10 Active Direct Clients ( Min. 2 Diamonds )',
    achievers: 11,
    desc: 'Apex global ambassador commanding global network volume.',
    status: 'Active',
  },
  {
    level: 10,
    name: 'Titan',
    ownDeposit: 0,
    totalClientDeposit: 5000000,
    minInvest: 5000000,
    reward: 250000,
    condition: 'Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )',
    companyProfitSharing: '1.25% of the Total Company Profit + 5000$ Per Month Salary',
    salaryCondition: 'Monthly salary requires maintaining active direct clients and team turnover criteria each month.',
    downlineStructureRequired: '15 Active Direct Clients ( Min. 2 Crown Diamond )',
    achievers: 5,
    desc: 'Titan council leader commanding multi-million network turnover.',
    status: 'Active',
  },
  {
    level: 11,
    name: 'Crown Titan',
    ownDeposit: 0,
    totalClientDeposit: 10000000,
    minInvest: 10000000,
    reward: 500000,
    condition: 'Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )',
    companyProfitSharing: '1.50% of the Total Company Profit + 7500$ Per Month Salary',
    salaryCondition: 'Monthly salary requires maintaining active direct clients and team turnover criteria each month.',
    downlineStructureRequired: '20 Active Direct Clients ( Min. 2 Global Ambassador )',
    achievers: 2,
    desc: 'Crown titan executive with premier corporate profit share.',
    status: 'Active',
  },
  {
    level: 12,
    name: 'Global Titan',
    ownDeposit: 0,
    totalClientDeposit: 25000000,
    minInvest: 25000000,
    reward: 1250000,
    condition: 'Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )',
    companyProfitSharing: '2% of the Total Company Profit + 10000$ Per Month Salary',
    salaryCondition: 'Monthly salary requires maintaining active direct clients and team turnover criteria each month.',
    downlineStructureRequired: '25 Active Direct Clients ( Min. 2 Titan )',
    achievers: 1,
    desc: 'Pinnacle global titan summit leader commanding worldwide operations.',
    status: 'Active',
  },
];

const extractRankBenefits = (rankObj) => {
  if (!rankObj) return { reward: 100, profitPercent: 0, salary: 0 };
  const reward = Number(rankObj.reward) || 100;
  
  let profitPercent = 0;
  const pctMatch = String(rankObj.companyProfitSharing || '').match(/([\d.]+)%\s*of/i);
  if (pctMatch) {
    profitPercent = parseFloat(pctMatch[1]) || 0;
  }

  let salary = 0;
  const salaryMatch = String(rankObj.companyProfitSharing || '').match(/(\d+)\s*\$\s*Per Month Salary/i);
  if (salaryMatch) {
    salary = parseFloat(salaryMatch[1]) || 0;
  }

  return { reward, profitPercent, salary };
};

const checkLeaderRankEligibility = (leader, rankObj) => {
  if (!leader || !rankObj) {
    return { isEligible: false, isOwnMet: false, isTurnoverMet: false, isDirectsMet: false, userOwnDeposit: 0, userTurnover: 0, userDirects: 0 };
  }

  const userTurnover = Number(leader.teamTurnover || leader.teamVolume || leader.turnover || 0);
  const userOwnDeposit = Number(leader.totalInvested || leader.depositWallet || 0);
  const userDirects = Number(leader.directReferrals || leader.directRefs || leader.totalReferrals || 0);

  const ownReq = Number(rankObj.ownDeposit || 0);
  const turnoverReq = Number(rankObj.totalClientDeposit || rankObj.minInvest || 0);
  const reqDirectsMatch = (rankObj.downlineStructureRequired || '').match(/\d+/);
  const directsReq = reqDirectsMatch ? parseInt(reqDirectsMatch[0], 10) : 2;

  const isOwnMet = userOwnDeposit >= ownReq;
  const isTurnoverMet = userTurnover >= turnoverReq;
  const isDirectsMet = userDirects >= directsReq;

  const userLvl = Number(leader.level || leader.rankLevel || 0);
  const passedHigherTier = userLvl > Number(rankObj.level || 0);

  const isEligible = passedHigherTier || (isOwnMet && isTurnoverMet && isDirectsMet);

  return {
    isEligible,
    isOwnMet,
    isTurnoverMet,
    isDirectsMet,
    userOwnDeposit,
    userTurnover,
    userDirects,
    ownReq,
    turnoverReq,
    directsReq
  };
};

export default function Ranks() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ladder'); // 'ladder', 'achievers'
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
  const [editSalaryCondition, setEditSalaryCondition] = useState('');
  const [editDownlineStructureRequired, setEditDownlineStructureRequired] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editDesc, setEditDesc] = useState('');

  // Add New Rank Modal State
  const [isAddRankOpen, setIsAddRankOpen] = useState(false);
  const [newRankLevel, setNewRankLevel] = useState('');
  const [newRankName, setNewRankName] = useState('');
  const [newRankOwnDeposit, setNewRankOwnDeposit] = useState('0');
  const [newRankTotalClientDeposit, setNewRankTotalClientDeposit] = useState('50000000');
  const [newRankCondition, setNewRankCondition] = useState('Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )');
  const [newRankReward, setNewRankReward] = useState('2500000');
  const [newRankCompanyProfitSharing, setNewRankCompanyProfitSharing] = useState('2.5% of the Total Company Profit + 15000$ Per Month Salary');
  const [newRankSalaryCondition, setNewRankSalaryCondition] = useState('Monthly salary requires maintaining active direct clients and team turnover criteria each month.');
  const [newRankDownlineStructureRequired, setNewRankDownlineStructureRequired] = useState('30 Active Direct Clients ( Min. 2 Global Titan )');
  const [newRankDesc, setNewRankDesc] = useState('');

  // Leader Calculation Breakdown Drawer State
  const [selectedLeader, setSelectedLeader] = useState(null);

  // Disburse Reward / Income Modal State
  const [disburseModalLeader, setDisburseModalLeader] = useState(null);
  const [disburseIncomeType, setDisburseIncomeType] = useState('rankReward');
  const [companyProfitInput, setCompanyProfitInput] = useState('');
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disburseReason, setDisburseReason] = useState('');
  const [disbursing, setDisbursing] = useState(false);

  const openDisburseModal = (leader, defaultType = 'rankReward') => {
    setDisburseModalLeader(leader);
    setDisburseIncomeType(defaultType);
    setCompanyProfitInput('');

    const matchingRank = ranks.find(r => 
      (r.name && leader.rank && r.name.toLowerCase() === leader.rank.toLowerCase()) ||
      (r.level && leader.level && Number(r.level) === Number(leader.level))
    ) || ranks[0];

    const benefits = extractRankBenefits(matchingRank);
    const eligibility = checkLeaderRankEligibility(leader, matchingRank);

    let defaultAmt = '';
    let defaultReason = '';
    if (defaultType === 'rankReward') {
      if (eligibility.isEligible) {
        defaultAmt = String(benefits.reward);
        defaultReason = `One Time Cash Reward ($${benefits.reward.toLocaleString()}) - ${matchingRank.name} Rank (Eligible)`;
      } else {
        defaultAmt = '';
        defaultReason = `One Time Cash Reward - ${matchingRank.name} Rank`;
      }
    } else if (defaultType === 'salary') {
      if (eligibility.isEligible && benefits.salary > 0) {
        defaultAmt = String(benefits.salary);
        defaultReason = `Per Month Salary ($${benefits.salary.toLocaleString()}) - ${matchingRank.name} Rank (Eligible)`;
      } else {
        defaultAmt = '';
        defaultReason = `Per Month Salary - ${matchingRank.name} Rank`;
      }
    } else if (defaultType === 'companyProfit') {
      defaultAmt = '';
      defaultReason = `Company Profit %ge - ${matchingRank.name} Rank`;
    }

    setDisburseAmount(defaultAmt);
    setDisburseReason(defaultReason);
  };

  const handleIncomeTypeChange = (type) => {
    setDisburseIncomeType(type);
    if (!disburseModalLeader) return;
    const matchingRank = ranks.find(r => 
      (r.name && disburseModalLeader.rank && r.name.toLowerCase() === disburseModalLeader.rank.toLowerCase()) ||
      (r.level && disburseModalLeader.level && Number(r.level) === Number(disburseModalLeader.level))
    ) || ranks[0];

    const benefits = extractRankBenefits(matchingRank);
    const eligibility = checkLeaderRankEligibility(disburseModalLeader, matchingRank);
    let defaultAmt = '';
    let defaultReason = '';

    if (type === 'rankReward') {
      if (eligibility.isEligible) {
        defaultAmt = String(benefits.reward);
        defaultReason = `One Time Cash Reward ($${benefits.reward.toLocaleString()}) - ${matchingRank.name} Rank (Eligible)`;
      } else {
        defaultAmt = '';
        defaultReason = `One Time Cash Reward - ${matchingRank.name} Rank`;
      }
    } else if (type === 'salary') {
      if (eligibility.isEligible && benefits.salary > 0) {
        defaultAmt = String(benefits.salary);
        defaultReason = `Per Month Salary ($${benefits.salary.toLocaleString()}) - ${matchingRank.name} Rank (Eligible)`;
      } else {
        defaultAmt = '';
        defaultReason = `Per Month Salary - ${matchingRank.name} Rank`;
      }
    } else if (type === 'companyProfit') {
      const numProfit = parseFloat(companyProfitInput) || 0;
      if (numProfit > 0 && benefits.profitPercent > 0 && eligibility.isEligible) {
        const calculated = ((numProfit * benefits.profitPercent) / 100).toFixed(2);
        defaultAmt = String(Number(calculated));
        defaultReason = `Company Profit Share (${benefits.profitPercent}% of $${numProfit.toLocaleString()}) - ${matchingRank.name} Rank`;
      } else {
        defaultAmt = '';
        defaultReason = `Company Profit Share (${benefits.profitPercent}%) - ${matchingRank.name} Rank`;
      }
    }

    setDisburseAmount(defaultAmt);
    setDisburseReason(defaultReason);
  };

  const handleDisburseSubmit = async (e) => {
    e?.preventDefault();
    if (!disburseModalLeader || !disburseAmount || Number(disburseAmount) <= 0) return;
    setDisbursing(true);
    try {
      const res = await adjustUserWallet(disburseModalLeader.id, {
        walletType: disburseIncomeType,
        action: 'credit',
        amount: Number(disburseAmount),
        reason: disburseReason.trim() || `Manual Rank Disbursal - ${disburseIncomeType}`,
      });
      if (res?.success) {
        toast.success(
          res.message || `Successfully disbursed $${disburseAmount} to ${disburseModalLeader.name}!`,
          'Disbursal Completed'
        );
        setDisburseModalLeader(null);
        setDisburseAmount('');
        setDisburseReason('');
        fetchRanksData();
      } else {
        toast.error(res?.message || 'Failed to disburse income.', 'Disbursal Failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error processing disbursal.', 'Disbursal Failed');
    } finally {
      setDisbursing(false);
    }
  };

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
    setEditSalaryCondition(
      r.salaryCondition !== undefined
        ? r.salaryCondition
        : (String(r.companyProfitSharing || '').toLowerCase().includes('salary')
            ? 'Monthly salary requires maintaining active direct clients and team turnover criteria each month.'
            : '')
    );
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
      salaryCondition: editSalaryCondition.trim(),
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
    toast.success(`Rank tier "${payload.name}" updated successfully!`, 'Rank Updated');
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
      salaryCondition: newRankSalaryCondition.trim(),
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
    toast.success(`New rank "${newRankItem.name}" (Level ${newRankItem.level}) added successfully!`, 'Rank Created');
    setIsAddRankOpen(false);
    setNewRankName('');
    setNewRankLevel('');
    setNewRankOwnDeposit('5000');
    setNewRankTotalClientDeposit('2000000');
    setNewRankReward('100000');
    setNewRankSalaryCondition('Monthly salary requires maintaining active direct clients and team turnover criteria each month.');
    setNewRankDesc('');
  };

  const getRankIcon = (lvl) => {
    if (lvl >= 10) return <RiVipCrownLine size={24} className="text-amber-500" />;
    if (lvl >= 9) return <RiVipCrownLine size={24} className="text-gold-500" />;
    if (lvl >= 7) return <RiShieldStarLine size={24} className="text-purple-500" />;
    if (lvl >= 5) return <RiSparklingLine size={24} className="text-blue-500" />;
    if (lvl >= 3) return <RiMedalLine size={24} className="text-gold-600" />;
    return <RiAwardLine size={24} className="text-emerald-500" />;
  };

  // Enriched Leaders List with rank metrics
  const leaderData = leaderboardList.map((u) => {
    const teamVolume = Number(u.teamTurnover || u.teamVolume || u.turnover || 0);
    const rankObj = ranks.find(r => (r.level === u.level) || r.name.toLowerCase() === (u.currentRank || u.rank || '').toLowerCase().replace(/level \d+ \(|\)/g, '')) || ranks[0];
    const rankCashBonus = Number(u.rewardsEarned || u.reward || 0);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 sm:gap-4 xl:gap-5">
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
      <div className="grid grid-cols-2 sm:grid-cols-2 2xl:grid-cols-4 gap-2.5 sm:gap-4 xl:gap-5">
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
      <div className="card p-1.5 sm:p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'ladder', label: 'Rank Ladder', count: `${ranks.length} Tiers`, icon: <RiTrophyLine /> },
            { id: 'achievers', label: 'Rank Achievers Directory', count: `${filteredLeaders.length} Members`, icon: <RiGroupLine /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gold-400 text-slate-900 font-bold shadow-gold'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/80 text-slate-800 font-bold border border-slate-200/80 shadow-2xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ──────────────── TAB 1: RANK LADDER TABLE (LUXURY WHITE & GOLD THEME) ──────────────── */}
      {activeTab === 'ladder' && (
        <div className="mt-6 space-y-6">
          <div className="card p-5 sm:p-6 space-y-5 shadow-card border border-slate-200/80">
            {/* Elegant Top Toolbar with proper margin & padding */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 font-poppins">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-gold-400/20 text-gold-700 flex items-center justify-center border border-gold-300 shadow-2xs flex-shrink-0">
                  <RiTrophyLine size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      Rank Ladder
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold-100 text-gold-900 border border-gold-300 shadow-2xs">
                      {ranks.length} Active Ranks
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Official progression tiers, turnover thresholds, instant cash rewards & profit-sharing bonuses
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
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
                  className="px-4 py-2 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-slate-950 font-bold text-xs rounded-full shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <RiAddLine size={16} /> Add Rank
                </button>
              </div>
            </div>

            {/* Mobile Horizontal Scroll Helper Banner */}
            <div className="md:hidden flex items-center justify-between text-xs text-amber-900 bg-amber-50/90 px-3.5 py-2 rounded-xl border border-amber-200/80 font-medium">
              <span className="flex items-center gap-1.5 font-bold">
                <RiTrophyLine size={14} className="text-amber-600" />
                <span>Swipe table left to view all {ranks.length} tier criteria & rewards &rarr;</span>
              </span>
            </div>

            {/* Grid Table with proper spacing from top */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
              <table className="w-full text-left border-collapse font-poppins">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-50/90 via-gold-50/70 to-amber-50/50 border-b-2 border-gold-300 text-slate-900 text-[11px] font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-3 text-center border-r border-slate-200/90 w-12">#</th>
                    <th className="py-3 px-3.5 text-left border-r border-slate-200/90 min-w-[170px]">Rank Name</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200/90 min-w-[110px]">Own Deposit ($)</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200/90 min-w-[140px]">Total Client Deposit ($)</th>
                    <th className="py-3 px-3.5 text-left border-r border-slate-200/90 min-w-[190px]">Condition</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200/90 min-w-[130px]">One Time Cash Reward ($)</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200/90 min-w-[180px]">Company Profit %ge</th>
                    <th className="py-3 px-3.5 text-left border-r border-slate-200/90 min-w-[210px]">Downline Structure Required</th>
                    <th className="py-3 px-3 text-center min-w-[95px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                  {ranks.map((r, i) => {
                    const ownDep = Number(r.ownDeposit !== undefined ? r.ownDeposit : 0);
                    const clientDep = Number(r.totalClientDeposit !== undefined ? r.totalClientDeposit : (r.minInvest || 0));
                    const rewardAmt = Number(r.reward || 0);
                    const condText = r.condition || '1 Leg should not be more than 40% of the GV';
                    const profitShare = r.companyProfitSharing !== undefined ? String(r.companyProfitSharing) : '0';
                    const salaryCondText = r.salaryCondition || (profitShare.toLowerCase().includes('salary') ? 'Monthly salary requires maintaining active direct clients and team turnover criteria each month.' : '');
                    const downlineReq = r.downlineStructureRequired || '-';

                    return (
                      <tr
                        key={r._id || r.level}
                        className={`hover:bg-amber-50/40 transition-colors ${
                          i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        {/* Level Index */}
                        <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono text-xs border-r border-slate-200 bg-gold-50/30">
                          <span className="w-7 h-7 rounded-full bg-gold-100/90 text-gold-950 font-bold border border-gold-300 inline-flex items-center justify-center shadow-2xs">
                            {r.level}
                          </span>
                        </td>

                        {/* Rank Name with Icon */}
                        <td className="py-3 px-3.5 border-r border-slate-200">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-gold-50/90 border border-gold-300 shadow-2xs flex items-center justify-center flex-shrink-0">
                              {getRankIcon(r.level)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-xs block font-poppins leading-tight">
                                {r.name}
                              </span>
                              <span className="text-[10px] font-bold text-gold-900 bg-gold-100/90 border border-gold-300 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mt-0.5">
                                Tier {r.level}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Own Deposit */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 text-xs border-r border-slate-200">
                          ${ownDep.toLocaleString()}
                        </td>

                        {/* Total Client Deposit */}
                        <td className="py-3 px-3 text-center font-mono font-black text-slate-950 text-xs border-r border-slate-200">
                          ${clientDep.toLocaleString()}
                        </td>

                        {/* Condition */}
                        <td className="py-3 px-3.5 border-r border-slate-200">
                          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px] leading-snug">
                            {condText}
                          </span>
                        </td>

                        {/* One Time Cash Reward */}
                        <td className="py-3 px-3 text-center border-r border-slate-200 bg-emerald-50/20">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-xs">
                            +${rewardAmt.toLocaleString()}
                          </span>
                        </td>

                        {/* Company Profit %ge */}
                        <td className="py-3 px-3 text-center border-r border-slate-200">
                          <div className="inline-flex items-center justify-center gap-1.5 max-w-full">
                            {profitShare === '0' || profitShare === 0 || !profitShare ? (
                              <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-mono font-bold text-xs border border-slate-200">
                                0
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-900 font-medium border border-purple-200 text-[11px] leading-tight text-left">
                                {profitShare}
                              </span>
                            )}

                            {salaryCondText && (
                              <div className="relative group/salary inline-flex items-center flex-shrink-0">
                                <span
                                  className="w-5 h-5 rounded-full bg-amber-100/90 text-amber-800 hover:bg-gold-400 hover:text-slate-950 flex items-center justify-center cursor-pointer border border-amber-300 transition-colors shadow-2xs"
                                  title="Salary Condition"
                                >
                                  <RiInformationLine size={13} />
                                </span>

                                {/* Tooltip on hover */}
                                <div className={`absolute ${
                                  r.level <= 2 ? 'top-full mt-2' : 'bottom-full mb-2'
                                } left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-2xl z-50 opacity-0 invisible group-hover/salary:opacity-100 group-hover/salary:visible transition-all duration-200 pointer-events-none border border-gold-400/40 text-left`}>
                                  <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-slate-700 text-gold-400 font-bold text-xs">
                                    <RiInformationLine size={14} className="text-gold-400" />
                                    <span>Salary Condition</span>
                                  </div>
                                  <p className="text-[11px] font-normal text-slate-200 leading-relaxed font-sans whitespace-normal">
                                    {salaryCondText}
                                  </p>
                                  <div className={`absolute ${
                                    r.level <= 2
                                      ? 'bottom-full -mb-1 border-b-slate-900 border-t-transparent'
                                      : 'top-full -mt-1 border-t-slate-900 border-b-transparent'
                                  } left-1/2 -translate-x-1/2 border-4 border-transparent`} />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Downline Structure required */}
                        <td className="py-3 px-3.5 border-r border-slate-200">
                          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-950 font-medium border border-amber-200 text-[11px] leading-tight">
                            {downlineReq}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => openEditRank(r)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold-400 hover:bg-gold-500 text-slate-950 text-xs font-bold transition-all shadow-2xs border border-gold-500 active:scale-95 cursor-pointer"
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
                          {u.phone || '—'}
                        </td>

                        {/* Current Rank Badge */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gold-50 border border-gold-300/80 text-slate-900 font-medium text-xs shadow-2xs font-poppins">
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
                        <td className="text-right pr-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedLeader(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-400 hover:bg-gold-500 text-slate-900 text-xs font-semibold transition-all border border-gold-400 hover:border-gold-500 active:scale-95 shadow-gold font-poppins cursor-pointer"
                              title="Audit rank milestone progress"
                            >
                              <RiCalculatorLine size={14} className="text-slate-900" />
                              <span>Audit</span>
                            </button>
                          </div>
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

            {/* Row 4.5: Salary Condition */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Salary Condition (Hover &apos;i&apos; Info Tooltip)
                </label>
                <span className="text-[11px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Visible on &apos;i&apos; hover in Company Profit %ge
                </span>
              </div>
              <textarea
                rows={2}
                value={editSalaryCondition}
                onChange={e => setEditSalaryCondition(e.target.value)}
                placeholder="e.g. Monthly salary requires maintaining active direct clients and team turnover criteria each month."
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs resize-none"
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
              placeholder="Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )"
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
              placeholder="e.g. 2% of the Total Company Profit + 10000$ Per Month Salary"
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Salary Condition (Hover &apos;i&apos; Info Tooltip)
              </label>
              <span className="text-[11px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Visible on &apos;i&apos; hover in Company Profit %ge
              </span>
            </div>
            <textarea
              rows={2}
              value={newRankSalaryCondition}
              onChange={e => setNewRankSalaryCondition(e.target.value)}
              placeholder="e.g. Monthly salary requires maintaining active direct clients and team turnover criteria each month."
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs resize-none"
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
              placeholder="e.g. 25 Active Direct Clients ( Min. 2 Titan )"
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
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold-400 text-slate-900 text-xs font-bold shadow-2xs">
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

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const target = selectedLeader;
                  setSelectedLeader(null);
                  openDisburseModal(target);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <RiCoinsLine size={16} />
                <span>Disburse Reward / Salary to this Achiever</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── DISBURSE RANK REWARD / SALARY / PROFIT MODAL ──────────────── */}
      <Modal
        isOpen={!!disburseModalLeader}
        onClose={() => {
          if (!disbursing) setDisburseModalLeader(null);
        }}
        title="Disburse Rank Earnings & Rewards"
        subtitle={disburseModalLeader ? `${disburseModalLeader.name} (${disburseModalLeader.customId}) • Rank: ${disburseModalLeader.rank}` : ''}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisburseModalLeader(null)} disabled={disbursing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<RiCoinsLine />}
              onClick={handleDisburseSubmit}
              loading={disbursing}
            >
              Confirm Disbursal
            </Button>
          </>
        }
      >
        {disburseModalLeader && (
          <div className="space-y-4 font-poppins">
            {/* Achiever Info Banner */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-gold-50/50 rounded-2xl border border-gold-300 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{disburseModalLeader.name}</p>
                <p className="text-[11px] text-slate-500">{disburseModalLeader.email}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-gold-400 text-slate-950 text-xs font-bold shadow-2xs">
                {disburseModalLeader.rank}
              </span>
            </div>

            {/* Income Stream / Reward Type Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Reward / Income Stream *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'rankReward', label: 'Cash Reward ($)', desc: 'One-Time Rank Bonus' },
                  { id: 'companyProfit', label: 'Company Profit %', desc: 'Profit Share Dividend' },
                  { id: 'salary', label: 'Monthly Salary', desc: 'Leadership Allowance' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleIncomeTypeChange(st.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      disburseIncomeType === st.id
                        ? 'border-gold-500 bg-gold-50/80 ring-2 ring-gold-200 text-slate-950 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">{st.label}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 🎯 Stream Calculation & Eligibility Cards */}

            {/* 1. One Time Cash Reward Card */}
            {disburseIncomeType === 'rankReward' && (() => {
              const matchingRank = ranks.find(r => 
                (r.name && disburseModalLeader.rank && r.name.toLowerCase() === disburseModalLeader.rank.toLowerCase()) ||
                (r.level && disburseModalLeader.level && Number(r.level) === Number(disburseModalLeader.level))
              ) || ranks[0];
              const benefits = extractRankBenefits(matchingRank);
              const eligibility = checkLeaderRankEligibility(disburseModalLeader, matchingRank);

              return (
                <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 font-poppins transition-all ${
                  eligibility.isEligible
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50/90 border-amber-300 text-amber-950'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold flex items-center gap-1.5 text-xs">
                      <RiAwardLine className={eligibility.isEligible ? 'text-emerald-700' : 'text-amber-700'} size={17} />
                      <span>One Time Cash Reward Entitlement</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white border border-slate-300 text-slate-800">
                        Tier {matchingRank.level}: {matchingRank.name}
                      </span>
                      {eligibility.isEligible ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 border border-emerald-400 flex items-center gap-1">
                          <RiCheckLine size={12} /> Eligible (Rank Active)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <RiCloseLine size={12} /> Not Eligible (In Progress)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-xs">
                    <span className="text-slate-600 font-medium">Standard Ladder Reward:</span>
                    <span className="font-extrabold font-mono text-sm">
                      {eligibility.isEligible ? (
                        <span className="text-emerald-800 font-black">
                          ${benefits.reward.toLocaleString()} USD (Auto-filled)
                        </span>
                      ) : (
                        <span className="text-rose-700 font-black">
                          ${benefits.reward.toLocaleString()} USD (Not Auto-filled)
                        </span>
                      )}
                    </span>
                  </div>

                  {eligibility.isEligible ? (
                    <div className="p-2 rounded-lg bg-emerald-100/70 border border-emerald-300 text-[11px] text-emerald-900 space-y-0.5">
                      <p className="font-bold flex items-center gap-1">
                        <RiCheckLine className="text-emerald-700" size={14} />
                        Rank qualification active! Criteria fulfilled.
                      </p>
                      <p className="text-[10.5px] text-emerald-800">
                        Turnover: ${eligibility.userTurnover.toLocaleString()} / ${Number(matchingRank.totalClientDeposit || matchingRank.minInvest || 0).toLocaleString()} • Directs: {eligibility.userDirects} Directs
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-white/90 border border-amber-300 text-[11px] text-amber-950 space-y-1.5 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-rose-800 flex items-center gap-1">
                          <RiAlertLine className="text-rose-600 flex-shrink-0" size={14} />
                          <span>Rank qualification criteria pending (Reward not auto-filled):</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setDisburseAmount(String(benefits.reward));
                            setDisburseReason(`One Time Cash Reward ($${benefits.reward.toLocaleString()}) - ${matchingRank.name} Rank (Admin Override)`);
                          }}
                          className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded cursor-pointer transition-colors whitespace-nowrap"
                        >
                          ⚡ Force Fill ${benefits.reward.toLocaleString()}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-amber-100 text-[10px] font-mono">
                        <div className={`px-2 py-1 rounded border ${eligibility.isTurnoverMet ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                          <div className="text-[9px] uppercase font-bold text-slate-500">Client Turnover</div>
                          <div className="font-bold">${eligibility.userTurnover.toLocaleString()} / ${Number(matchingRank.totalClientDeposit || matchingRank.minInvest || 0).toLocaleString()}</div>
                          <div>{eligibility.isTurnoverMet ? '✔ Met' : '❌ Pending'}</div>
                        </div>
                        <div className={`px-2 py-1 rounded border ${eligibility.isDirectsMet ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                          <div className="text-[9px] uppercase font-bold text-slate-500">Direct Clients</div>
                          <div className="font-bold">{eligibility.userDirects} Directs</div>
                          <div>{eligibility.isDirectsMet ? '✔ Met' : '❌ Pending'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 2. Company Profit Share Live Calculator */}
            {disburseIncomeType === 'companyProfit' && (() => {
              const matchingRank = ranks.find(r => 
                (r.name && disburseModalLeader.rank && r.name.toLowerCase() === disburseModalLeader.rank.toLowerCase()) ||
                (r.level && disburseModalLeader.level && Number(r.level) === Number(disburseModalLeader.level))
              ) || ranks[0];
              const benefits = extractRankBenefits(matchingRank);
              const eligibility = checkLeaderRankEligibility(disburseModalLeader, matchingRank);
              const isProfitRankEligible = benefits.profitPercent > 0;

              return (
                <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-xs space-y-2.5 font-poppins">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-bold text-purple-950 flex items-center gap-1.5">
                      <RiPercentLine className="text-purple-700" size={16} />
                      <span>Company Profit Share Calculation</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-200 text-purple-900 border border-purple-300">
                        {matchingRank.name}: {benefits.profitPercent}%
                      </span>
                      {!isProfitRankEligible ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          Tier 6+ Required
                        </span>
                      ) : eligibility.isEligible ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✔ Eligible
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          ❌ Not Eligible (In Progress)
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1">
                      Enter Total Company Profit ($ USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-purple-400 font-mono">$</span>
                      <input
                        type="number"
                        step="any"
                        value={companyProfitInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCompanyProfitInput(val);
                          const num = parseFloat(val) || 0;
                          if (num > 0 && benefits.profitPercent > 0 && eligibility.isEligible) {
                            const calculated = ((num * benefits.profitPercent) / 100).toFixed(2);
                            setDisburseAmount(String(Number(calculated)));
                            setDisburseReason(`Company Profit Share (${benefits.profitPercent}% of $${num.toLocaleString()}) - ${matchingRank.name} Rank`);
                          } else if (num > 0 && benefits.profitPercent > 0 && !eligibility.isEligible) {
                            setDisburseAmount('');
                            setDisburseReason(`Company Profit Share (${benefits.profitPercent}% of $${num.toLocaleString()}) - Rank Criteria In Progress`);
                          } else if (num > 0 && benefits.profitPercent === 0) {
                            setDisburseAmount('0');
                            setDisburseReason(`Company Profit Share (0%) - ${matchingRank.name} Rank`);
                          } else {
                            setDisburseAmount('');
                          }
                        }}
                        placeholder="e.g. 100000"
                        className="w-full pl-7 pr-3 py-2 bg-white rounded-lg border border-purple-300 text-xs font-bold text-purple-950 font-mono outline-none focus:border-purple-500 shadow-2xs"
                      />
                    </div>
                    {/* Quick presets */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-purple-600 font-medium">Quick presets:</span>
                      {[25000, 50000, 100000, 250000, 500000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            const val = String(amt);
                            setCompanyProfitInput(val);
                            if (benefits.profitPercent > 0 && eligibility.isEligible) {
                              const calculated = ((amt * benefits.profitPercent) / 100).toFixed(2);
                              setDisburseAmount(String(Number(calculated)));
                              setDisburseReason(`Company Profit Share (${benefits.profitPercent}% of $${amt.toLocaleString()}) - ${matchingRank.name} Rank`);
                            }
                          }}
                          className="px-1.5 py-0.5 rounded bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-mono font-semibold cursor-pointer"
                        >
                          ${amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {companyProfitInput && Number(companyProfitInput) > 0 && (
                    <div className="p-2 rounded-lg bg-white border border-purple-200 text-[11px] space-y-0.5">
                      <div className="flex justify-between text-slate-600">
                        <span>Calculation Formula:</span>
                        <span className="font-mono text-purple-900 font-bold">
                          ${Number(companyProfitInput).toLocaleString()} × {benefits.profitPercent}%
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-purple-100">
                        <span>Calculated Disbursal:</span>
                        <span className="font-mono text-emerald-700 text-xs font-black">
                          ${((Number(companyProfitInput) * benefits.profitPercent) / 100).toFixed(2)} USD {eligibility.isEligible ? '(Auto-filled below)' : '(Criteria pending - Not auto-filled)'}
                        </span>
                      </div>
                      {!eligibility.isEligible && isProfitRankEligible && (
                        <div className="pt-1.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const calculated = ((Number(companyProfitInput) * benefits.profitPercent) / 100).toFixed(2);
                              setDisburseAmount(String(Number(calculated)));
                              setDisburseReason(`Company Profit Share (${benefits.profitPercent}% of $${Number(companyProfitInput).toLocaleString()}) - ${matchingRank.name} Rank (Admin Override)`);
                            }}
                            className="text-[10px] font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            ⚡ Force Fill Calculated Amount (${((Number(companyProfitInput) * benefits.profitPercent) / 100).toFixed(2)})
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {!isProfitRankEligible && (
                    <p className="text-[10.5px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-relaxed">
                      ⚠️ Note: Rank "{matchingRank.name}" has <strong>0%</strong> profit share on the rank ladder (Profit sharing starts at Executive Director Tier 6 with 0.20%).
                    </p>
                  )}
                </div>
              );
            })()}

            {/* 3. Monthly Salary Card */}
            {disburseIncomeType === 'salary' && (() => {
              const matchingRank = ranks.find(r => 
                (r.name && disburseModalLeader.rank && r.name.toLowerCase() === disburseModalLeader.rank.toLowerCase()) ||
                (r.level && disburseModalLeader.level && Number(r.level) === Number(disburseModalLeader.level))
              ) || ranks[0];
              const benefits = extractRankBenefits(matchingRank);
              const eligibility = checkLeaderRankEligibility(disburseModalLeader, matchingRank);
              const isSalaryEligible = benefits.salary > 0;

              return (
                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-1.5 font-poppins">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-blue-950 flex items-center gap-1.5">
                      <RiBriefcaseLine className="text-blue-700" size={16} />
                      <span>Monthly Leadership Salary Entitlement</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-200 text-blue-900 border border-blue-300">
                        Tier {matchingRank.level}: {matchingRank.name}
                      </span>
                      {!isSalaryEligible ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          Tier 6+ Required
                        </span>
                      ) : eligibility.isEligible ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✔ Eligible
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          ❌ Not Eligible (In Progress)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-blue-200/60 text-xs">
                    <span className="text-slate-600">Designated Monthly Salary:</span>
                    <span className="font-extrabold text-blue-900 font-mono text-sm">
                      {isSalaryEligible ? (
                        eligibility.isEligible ? (
                          `$${benefits.salary.toLocaleString()} USD / Month (Auto-filled)`
                        ) : (
                          `$${benefits.salary.toLocaleString()} USD / Month (Not Auto-filled)`
                        )
                      ) : (
                        '$0 USD (Not eligible on rank ladder)'
                      )}
                    </span>
                  </div>
                  {!isSalaryEligible && (
                    <p className="text-[10.5px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-relaxed">
                      ⚠️ Note: Rank "{matchingRank.name}" has no fixed monthly salary on the ladder (Salary starts from Executive Director Tier 6 at $500/month).
                    </p>
                  )}
                  {isSalaryEligible && !eligibility.isEligible && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                      <span className="text-[10.5px] text-amber-800">
                        User rank criteria is pending. Salary is not auto-filled.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDisburseAmount(String(benefits.salary));
                          setDisburseReason(`Per Month Salary ($${benefits.salary.toLocaleString()}) - ${matchingRank.name} Rank (Admin Override)`);
                        }}
                        className="text-[10px] font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 border border-blue-300 px-2 py-0.5 rounded cursor-pointer transition-colors whitespace-nowrap"
                      >
                        ⚡ Force Fill ${benefits.salary.toLocaleString()}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Amount Input ($) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Disbursal Amount ($ USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  step="any"
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 font-mono outline-none focus:border-gold-400 shadow-2xs"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Amount will be instantly credited to the user&apos;s selected stream and liquid Earning Wallet.
              </p>
            </div>

            {/* Reason / Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Reason / Note (Visible in User Transactions)
              </label>
              <input
                type="text"
                value={disburseReason}
                onChange={(e) => setDisburseReason(e.target.value)}
                placeholder="e.g. Rank Milestone Cash Reward / Monthly Salary"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
