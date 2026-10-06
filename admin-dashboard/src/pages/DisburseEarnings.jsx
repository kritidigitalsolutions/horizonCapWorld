import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  RiCoinsLine, RiAwardLine, RiPercentLine, RiBriefcaseLine,
  RiWallet3Line, RiArrowUpCircleLine, RiArrowDownCircleLine,
  RiCheckLine, RiCloseLine, RiAlertLine, RiUserLine,
  RiSearchLine, RiHistoryLine, RiRefreshLine,
  RiCalculatorLine, RiTrophyLine, RiExchangeDollarLine,
  RiTimeLine, RiFilterLine, RiInformationLine, RiSparklingLine,
  RiGroupLine, RiCheckDoubleLine, RiSendPlaneLine, RiCheckboxCircleLine,
  RiUserSharedLine
} from 'react-icons/ri';
import PageHeader from '../components/ui/PageHeader';
import KPICard from '../components/ui/KPICard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { getAllUsers, adjustUserWallet, batchAdjustWallets } from '../api/usersApi';
import { getTransactions } from '../api/transactionsApi';

// 12-Tier Rank Configuration with Cash Rewards, Company Profit %, Monthly Salaries, and Qualification Targets
const RANK_LADDER_CONFIG = [
  { level: 1, name: 'Associate', reward: 100, profitPercent: 0, salary: 0, ownDeposit: 50, totalClientDeposit: 5000, requiredDirects: 2 },
  { level: 2, name: 'Senior Associate', reward: 300, profitPercent: 0, salary: 0, ownDeposit: 100, totalClientDeposit: 10000, requiredDirects: 3 },
  { level: 3, name: 'Team Leader', reward: 875, profitPercent: 0, salary: 0, ownDeposit: 250, totalClientDeposit: 25000, requiredDirects: 3 },
  { level: 4, name: 'Director', reward: 2000, profitPercent: 0, salary: 0, ownDeposit: 500, totalClientDeposit: 50000, requiredDirects: 4 },
  { level: 5, name: 'Regional Director', reward: 5000, profitPercent: 0, salary: 0, ownDeposit: 1000, totalClientDeposit: 10000, requiredDirects: 4 },
  { level: 6, name: 'Executive Director', reward: 10000, profitPercent: 0.20, salary: 500, ownDeposit: 1500, totalClientDeposit: 200000, requiredDirects: 5 },
  { level: 7, name: 'Diamond', reward: 15000, profitPercent: 0.50, salary: 1000, ownDeposit: 2000, totalClientDeposit: 300000, requiredDirects: 6 },
  { level: 8, name: 'Crown Diamond', reward: 30000, profitPercent: 0.75, salary: 1500, ownDeposit: 3000, totalClientDeposit: 600000, requiredDirects: 8 },
  { level: 9, name: 'Global Ambassador', reward: 50000, profitPercent: 1.00, salary: 3000, ownDeposit: 5000, totalClientDeposit: 1000000, requiredDirects: 10 },
  { level: 10, name: 'Titan', reward: 250000, profitPercent: 1.25, salary: 5000, ownDeposit: 0, totalClientDeposit: 5000000, requiredDirects: 15 },
  { level: 11, name: 'Crown Titan', reward: 500000, profitPercent: 1.50, salary: 7500, ownDeposit: 0, totalClientDeposit: 10000000, requiredDirects: 20 },
  { level: 12, name: 'Global Titan', reward: 1250000, profitPercent: 2.00, salary: 10000, ownDeposit: 0, totalClientDeposit: 25000000, requiredDirects: 25 },
];

const getUserRankConfig = (user) => {
  if (!user) return RANK_LADDER_CONFIG[0];
  const rankStr = (
    user.currentRank ||
    user.rank?.name ||
    user.rank ||
    ''
  ).toString().toLowerCase().trim();

  let found = RANK_LADDER_CONFIG.find(r => r.name.toLowerCase() === rankStr);
  if (found) return found;

  const lvl = Number(user.level || user.rankLevel || user.rank?.level);
  if (lvl) {
    found = RANK_LADDER_CONFIG.find(r => r.level === lvl);
    if (found) return found;
  }

  if (rankStr) {
    found = RANK_LADDER_CONFIG.find(r => rankStr.includes(r.name.toLowerCase()));
    if (found) return found;
  }

  return RANK_LADDER_CONFIG[0]; // fallback Associate
};

// Check if user is actively eligible for their rank milestone reward & disbursals
const checkUserRankEligibility = (user, rankConfig) => {
  if (!user || !rankConfig) {
    return {
      isEligible: false,
      reason: 'No user or rank configuration found.',
      pendingDetails: [],
      userOwnDeposit: 0,
      userTurnover: 0,
      userDirects: 0,
      isOwnMet: false,
      isTurnoverMet: false,
      isDirectsMet: false
    };
  }

  if (user.isRankActive === true || user.isRankQualified === true) {
    return {
      isEligible: true,
      reason: 'Rank is actively confirmed by system.',
      pendingDetails: [],
      userOwnDeposit: Number(user.totalInvested || user.depositWallet || 0),
      userTurnover: Number(user.teamTurnover || user.turnover || user.teamVolume || 0),
      userDirects: Number(user.directReferrals || user.totalReferrals || user.directRefs || 0),
      isOwnMet: true,
      isTurnoverMet: true,
      isDirectsMet: true
    };
  }

  const userOwnDeposit = Number(user.totalInvested || user.depositWallet || 0);
  const userTurnover = Number(user.teamTurnover || user.turnover || user.teamVolume || 0);
  const userDirects = Number(user.directReferrals || user.totalReferrals || user.directRefs || 0);

  const ownReq = Number(rankConfig.ownDeposit || 0);
  const turnoverReq = Number(rankConfig.totalClientDeposit || 0);
  const directsReq = Number(rankConfig.requiredDirects || 2);

  const isOwnMet = userOwnDeposit >= ownReq;
  const isTurnoverMet = userTurnover >= turnoverReq;
  const isDirectsMet = userDirects >= directsReq;

  const userLvl = Number(user.rankLevel || user.rank?.level || 0);
  const passedHigherTier = userLvl > rankConfig.level;

  const isEligible = passedHigherTier || (isOwnMet && isTurnoverMet && isDirectsMet);

  const pendingDetails = [];
  if (!isOwnMet) {
    pendingDetails.push(`Own Deposit: $${userOwnDeposit.toLocaleString()} / $${ownReq.toLocaleString()} ($${(ownReq - userOwnDeposit).toLocaleString()} needed)`);
  }
  if (!isTurnoverMet) {
    pendingDetails.push(`Client Turnover: $${userTurnover.toLocaleString()} / $${turnoverReq.toLocaleString()} ($${(turnoverReq - userTurnover).toLocaleString()} needed)`);
  }
  if (!isDirectsMet) {
    pendingDetails.push(`Direct Referrals: ${userDirects} / ${directsReq} (${directsReq - userDirects} needed)`);
  }

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
    directsReq,
    pendingDetails,
  };
};

export default function DisburseEarnings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserIdParam = searchParams.get('userId');

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  // Mode: 'single' (Individual Investor) or 'bulk' (Batch / All in Rank)
  const [consoleMode, setConsoleMode] = useState('single');

  // ──────── SINGLE INVESTOR MODE STATE ────────
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [singleRankFilter, setSingleRankFilter] = useState('all');
  const [singleEligibleOnly, setSingleEligibleOnly] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Single form state
  const [walletType, setWalletType] = useState('rankReward'); // 'rankReward', 'companyProfit', 'salary', 'depositWallet'
  const [action, setAction] = useState('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [companyProfitInput, setCompanyProfitInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ──────── BULK / BATCH MODE STATE ────────
  const [bulkRank, setBulkRank] = useState(1); // Default Tier 1: Associate
  const [bulkWalletType, setBulkWalletType] = useState('rankReward');
  const [bulkEligibleOnly, setBulkEligibleOnly] = useState(true);
  const [bulkCompanyProfit, setBulkCompanyProfit] = useState('');
  const [bulkCustomAmount, setBulkCustomAmount] = useState('');
  const [bulkSearchQuery, setBulkSearchQuery] = useState('');
  const [selectedBulkUserIds, setSelectedBulkUserIds] = useState([]);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Recent Disbursal History
  const [recentDisbursals, setRecentDisbursals] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');

  // Load users & initial user from query param
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, txnsRes] = await Promise.allSettled([
        getAllUsers({ limit: 'all' }),
        getTransactions({ limit: 100 })
      ]);

      let formattedUsers = [];
      if (usersRes.status === 'fulfilled' && usersRes.value?.success && Array.isArray(usersRes.value.users)) {
        formattedUsers = usersRes.value.users.map(u => ({
          ...u,
          _id: u._id,
          id: u.customId || u._id,
          name: u.name || u.userName || 'Investor',
          email: u.email || '',
          phone: u.phone || '',
          currentRank: u.currentRank || 'Associate',
          rankLevel: Number(u.rankLevel || 1),
          totalInvested: Number(u.totalInvested || 0),
          teamTurnover: Number(u.teamTurnover || 0),
          directReferrals: Number(u.directReferrals || u.totalReferrals || 0),
          earningWallet: Number(u.earningWallet || 0),
          depositWallet: Number(u.depositWallet || 0),
        }));
        setUsers(formattedUsers);

        // Pre-select user if parameter present
        if (targetUserIdParam) {
          const matched = formattedUsers.find(u => String(u._id) === String(targetUserIdParam) || String(u.id) === String(targetUserIdParam));
          if (matched) {
            handleSelectUser(matched, formattedUsers);
          } else if (formattedUsers.length > 0) {
            handleSelectUser(formattedUsers[0], formattedUsers);
          }
        } else if (formattedUsers.length > 0 && !selectedUser) {
          handleSelectUser(formattedUsers[0], formattedUsers);
        }
      }

      if (txnsRes.status === 'fulfilled' && txnsRes.value?.success && Array.isArray(txnsRes.value.transactions)) {
        const disburseTxns = txnsRes.value.transactions.filter(t => {
          const type = (t.type || '').toLowerCase();
          const rem = (t.remarks || t.description || t.reason || '').toLowerCase();
          return (
            type.includes('reward') ||
            type.includes('salary') ||
            type.includes('profit') ||
            type.includes('adjustment') ||
            rem.includes('disbursal') ||
            rem.includes('reward') ||
            rem.includes('salary') ||
            rem.includes('profit') ||
            rem.includes('rank')
          );
        });
        setRecentDisbursals(disburseTxns);
      }
    } catch (err) {
      console.warn('Error loading disbursal data:', err.message);
      toast.error('Failed to load users data.', 'Error');
    } finally {
      setLoading(false);
    }
  }, [targetUserIdParam, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Single User Selection
  const handleSelectUser = (user, userList = users) => {
    setSelectedUser(user);
    setUserDropdownOpen(false);

    const rankInfo = getUserRankConfig(user);
    const eligibility = checkUserRankEligibility(user, rankInfo);
    setCompanyProfitInput('');

    if (walletType === 'rankReward') {
      if (eligibility.isEligible) {
        setAmount(String(rankInfo.reward || 100));
        setReason(`One Time Cash Reward ($${(rankInfo.reward || 100).toLocaleString()}) - ${rankInfo.name} Rank (Eligible)`);
      } else {
        setAmount('');
        setReason(`One Time Cash Reward - ${rankInfo.name} Rank`);
      }
    } else if (walletType === 'salary') {
      if (eligibility.isEligible && rankInfo.salary > 0) {
        setAmount(String(rankInfo.salary));
        setReason(`Per Month Salary ($${rankInfo.salary.toLocaleString()}) - ${rankInfo.name} Rank (Eligible)`);
      } else {
        setAmount('');
        setReason(`Per Month Salary - ${rankInfo.name} Rank`);
      }
    } else if (walletType === 'companyProfit') {
      setAmount('');
      setReason(`Company Profit Share - ${rankInfo.name} Rank`);
    } else {
      setAmount('');
      setReason('Capital Balance Adjustment (Deposit Wallet)');
    }
  };

  // Handle Single Wallet Type Change
  const handleWalletTypeChange = (newType) => {
    setWalletType(newType);
    if (!selectedUser) return;
    const rankInfo = getUserRankConfig(selectedUser);
    const eligibility = checkUserRankEligibility(selectedUser, rankInfo);

    if (newType === 'rankReward') {
      if (eligibility.isEligible) {
        setAmount(String(rankInfo.reward || 100));
        setReason(`One Time Cash Reward ($${(rankInfo.reward || 100).toLocaleString()}) - ${rankInfo.name} Rank (Eligible)`);
      } else {
        setAmount('');
        setReason(`One Time Cash Reward - ${rankInfo.name} Rank`);
      }
    } else if (newType === 'salary') {
      if (eligibility.isEligible && rankInfo.salary > 0) {
        setAmount(String(rankInfo.salary));
        setReason(`Per Month Salary ($${rankInfo.salary.toLocaleString()}) - ${rankInfo.name} Rank (Eligible)`);
      } else {
        setAmount('');
        setReason(`Per Month Salary - ${rankInfo.name} Rank`);
      }
    } else if (newType === 'companyProfit') {
      const numProfit = parseFloat(companyProfitInput) || 0;
      if (numProfit > 0 && rankInfo.profitPercent > 0 && eligibility.isEligible) {
        const calculated = ((numProfit * rankInfo.profitPercent) / 100).toFixed(2);
        setAmount(String(Number(calculated)));
        setReason(`Company Profit Share (${rankInfo.profitPercent}% of $${numProfit.toLocaleString()}) - ${rankInfo.name} Rank`);
      } else {
        setAmount('');
        setReason(`Company Profit Share (${rankInfo.profitPercent}%) - ${rankInfo.name} Rank`);
      }
    } else if (newType === 'depositWallet') {
      setAmount('');
      setReason('Capital Balance Adjustment (Deposit Wallet)');
    }
  };

  // Handle Company Profit Input Change (Single Mode)
  const handleCompanyProfitInputChange = (profitValStr) => {
    setCompanyProfitInput(profitValStr);
    if (!selectedUser) return;
    const rankInfo = getUserRankConfig(selectedUser);
    const eligibility = checkUserRankEligibility(selectedUser, rankInfo);
    const numProfit = parseFloat(profitValStr) || 0;

    if (numProfit > 0 && rankInfo.profitPercent > 0 && eligibility.isEligible) {
      const calculated = ((numProfit * rankInfo.profitPercent) / 100).toFixed(2);
      setAmount(String(Number(calculated)));
      setReason(`Company Profit Share (${rankInfo.profitPercent}% of $${numProfit.toLocaleString()}) - ${rankInfo.name} Rank`);
    } else if (numProfit > 0 && rankInfo.profitPercent > 0 && !eligibility.isEligible) {
      setAmount('');
      setReason(`Company Profit Share (${rankInfo.profitPercent}% of $${numProfit.toLocaleString()}) - Criteria Pending`);
    } else if (numProfit > 0 && rankInfo.profitPercent === 0) {
      setAmount('0');
      setReason(`Company Profit Share (0%) - ${rankInfo.name} Rank`);
    } else {
      setAmount('');
    }
  };

  // Handle Single Disbursal Submit
  const handleSubmitSingleDisbursal = async (e) => {
    e?.preventDefault();
    if (!selectedUser) {
      toast.error('Please select an investor first.', 'Validation Error');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid positive dollar amount.', 'Validation Error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await adjustUserWallet(selectedUser._id || selectedUser.id, {
        walletType,
        action,
        amount: Number(amount),
        reason: reason.trim() || `Manual Disbursal by Admin (${walletType})`,
      });

      if (res?.success) {
        toast.success(
          res.message || `Successfully disbursed $${Number(amount).toLocaleString()} to ${selectedUser.name}!`,
          'Disbursal Completed'
        );

        // Update local user balances
        const updatedUser = res.user;
        if (updatedUser) {
          setUsers(prev => prev.map(u => (u._id === selectedUser._id || u.id === selectedUser.id) ? { ...u, ...updatedUser } : u));
          setSelectedUser(prev => ({ ...prev, ...updatedUser }));
        }

        // Refresh recent disbursals
        try {
          const txnsRes = await getTransactions({ limit: 100 });
          if (txnsRes?.success && Array.isArray(txnsRes.transactions)) {
            const disburseTxns = txnsRes.transactions.filter(t => {
              const type = (t.type || '').toLowerCase();
              const rem = (t.remarks || t.description || t.reason || '').toLowerCase();
              return (
                type.includes('reward') ||
                type.includes('salary') ||
                type.includes('profit') ||
                type.includes('adjustment') ||
                rem.includes('disbursal') ||
                rem.includes('reward') ||
                rem.includes('salary') ||
                rem.includes('profit') ||
                rem.includes('rank')
              );
            });
            setRecentDisbursals(disburseTxns);
          }
        } catch {
          // ignore
        }
      } else {
        toast.error(res?.message || 'Failed to disburse income.', 'Disbursal Failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error processing disbursal.', 'Disbursal Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ──────── FILTERED USERS FOR SINGLE INVESTOR SELECTOR ────────
  const filteredUsersList = useMemo(() => {
    let list = users;

    // 1. Rank filter
    if (singleRankFilter !== 'all') {
      const targetLvl = Number(singleRankFilter);
      list = list.filter(u => {
        const rInfo = getUserRankConfig(u);
        return rInfo.level === targetLvl;
      });
    }

    // 2. Eligibility filter
    if (singleEligibleOnly) {
      list = list.filter(u => {
        const rInfo = getUserRankConfig(u);
        const elig = checkUserRankEligibility(u, rInfo);
        return elig.isEligible;
      });
    }

    // 3. Search query
    const q = userSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.id || u.customId || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q) ||
        (u.currentRank || '').toLowerCase().includes(q)
      );
    }

    return list.slice(0, 50);
  }, [users, singleRankFilter, singleEligibleOnly, userSearchQuery]);

  // Derived Single stats
  const selectedRankConfig = useMemo(() => getUserRankConfig(selectedUser), [selectedUser]);
  const selectedEligibility = useMemo(() => checkUserRankEligibility(selectedUser, selectedRankConfig), [selectedUser, selectedRankConfig]);

  // Count of eligible users in the currently selected user's rank
  const eligibleCountInSelectedRank = useMemo(() => {
    if (!selectedRankConfig) return 0;
    return users.filter(u => {
      const rInfo = getUserRankConfig(u);
      if (rInfo.level !== selectedRankConfig.level) return false;
      const el = checkUserRankEligibility(u, rInfo);
      return el.isEligible;
    }).length;
  }, [users, selectedRankConfig]);

  // ──────── BULK MODE CALCULATIONS & CANDIDATES ────────
  const selectedBulkRankConfig = useMemo(() => {
    return RANK_LADDER_CONFIG.find(r => r.level === Number(bulkRank)) || RANK_LADDER_CONFIG[0];
  }, [bulkRank]);

  // Candidates for bulk disbursal based on chosen rank and filters
  const bulkCandidateUsers = useMemo(() => {
    let list = users.filter(u => {
      const rInfo = getUserRankConfig(u);
      return rInfo.level === Number(bulkRank);
    });

    // Map each candidate with eligibility & calculated payout amount
    return list.map(u => {
      const rInfo = getUserRankConfig(u);
      const elig = checkUserRankEligibility(u, rInfo);

      let calculatedAmount = 0;
      if (bulkWalletType === 'rankReward') {
        calculatedAmount = rInfo.reward || 0;
      } else if (bulkWalletType === 'salary') {
        calculatedAmount = rInfo.salary || 0;
      } else if (bulkWalletType === 'companyProfit') {
        const numProfit = parseFloat(bulkCompanyProfit) || 0;
        calculatedAmount = Number(((numProfit * rInfo.profitPercent) / 100).toFixed(2));
      } else if (bulkWalletType === 'depositWallet') {
        calculatedAmount = parseFloat(bulkCustomAmount) || 0;
      }

      return {
        ...u,
        rankInfo: rInfo,
        eligibility: elig,
        calculatedAmount,
      };
    });
  }, [users, bulkRank, bulkWalletType, bulkCompanyProfit, bulkCustomAmount]);

  // Filtered candidate list based on bulkEligibleOnly and bulkSearchQuery
  const filteredBulkUsers = useMemo(() => {
    let list = bulkCandidateUsers;

    if (bulkEligibleOnly) {
      list = list.filter(u => u.eligibility.isEligible);
    }

    const q = bulkSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.id || u.customId || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [bulkCandidateUsers, bulkEligibleOnly, bulkSearchQuery]);

  // Auto-select eligible candidates when bulkRank or bulkEligibleOnly changes
  useEffect(() => {
    const defaultIds = filteredBulkUsers
      .filter(u => u.eligibility.isEligible)
      .map(u => u._id || u.id);
    setSelectedBulkUserIds(defaultIds);

    // Auto prefill reason
    if (bulkWalletType === 'rankReward') {
      setBulkReason(`Bulk One Time Cash Reward - Tier ${selectedBulkRankConfig.level}: ${selectedBulkRankConfig.name}`);
    } else if (bulkWalletType === 'salary') {
      setBulkReason(`Bulk Monthly Salary - Tier ${selectedBulkRankConfig.level}: ${selectedBulkRankConfig.name}`);
    } else if (bulkWalletType === 'companyProfit') {
      setBulkReason(`Bulk Company Profit Share (${selectedBulkRankConfig.profitPercent}%) - Tier ${selectedBulkRankConfig.level}: ${selectedBulkRankConfig.name}`);
    } else {
      setBulkReason(`Bulk Capital Balance Adjustment (Deposit Wallet) - Tier ${selectedBulkRankConfig.level}: ${selectedBulkRankConfig.name}`);
    }
  }, [bulkRank, bulkWalletType, selectedBulkRankConfig]);

  // Toggle selection of a single bulk user
  const handleToggleBulkUser = (userId) => {
    setSelectedBulkUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Select all or deselect all visible bulk users
  const handleToggleSelectAllBulk = () => {
    const visibleIds = filteredBulkUsers.map(u => u._id || u.id);
    const allSelected = visibleIds.every(id => selectedBulkUserIds.includes(id));
    if (allSelected) {
      setSelectedBulkUserIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedBulkUserIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Grand Total Calculation for Bulk Mode
  const bulkSelectedUsers = useMemo(() => {
    return bulkCandidateUsers.filter(u => selectedBulkUserIds.includes(u._id || u.id));
  }, [bulkCandidateUsers, selectedBulkUserIds]);

  const bulkGrandTotalAmount = useMemo(() => {
    return bulkSelectedUsers.reduce((sum, u) => sum + (Number(u.calculatedAmount) || 0), 0);
  }, [bulkSelectedUsers]);

  // Handle Execute Bulk Disbursal
  const handleExecuteBulkDisbursal = async () => {
    if (bulkSelectedUsers.length === 0) {
      toast.error('Please select at least 1 investor to receive disbursal.', 'Validation Error');
      return;
    }
    if (bulkGrandTotalAmount <= 0) {
      toast.error('Calculated payout is $0. Enter a valid company profit or amount.', 'Validation Error');
      return;
    }

    setBulkSubmitting(true);
    try {
      const adjustments = bulkSelectedUsers.map(u => ({
        userId: u._id || u.id,
        walletType: bulkWalletType,
        action: 'credit',
        amount: Number(u.calculatedAmount),
        reason: bulkReason.trim() || `Bulk Disbursal to ${selectedBulkRankConfig.name} Achievers`,
      }));

      const res = await batchAdjustWallets({ adjustments });

      if (res?.success) {
        toast.success(
          res.message || `Successfully disbursed $${bulkGrandTotalAmount.toLocaleString()} to ${bulkSelectedUsers.length} investors!`,
          'Bulk Disbursal Success'
        );

        // Update local users
        if (Array.isArray(res.results)) {
          const successMap = {};
          res.results.forEach(r => {
            if (r.success) successMap[r.userId] = r;
          });

          setUsers(prev => prev.map(u => {
            const hit = successMap[u._id || u.id];
            if (hit) {
              const numAmt = Number(hit.amount || 0);
              return {
                ...u,
                earningWallet: (u.earningWallet || 0) + numAmt,
              };
            }
            return u;
          }));
        }

        // Refresh recent txns
        try {
          const txnsRes = await getTransactions({ limit: 100 });
          if (txnsRes?.success && Array.isArray(txnsRes.transactions)) {
            const disburseTxns = txnsRes.transactions.filter(t => {
              const type = (t.type || '').toLowerCase();
              const rem = (t.remarks || t.description || t.reason || '').toLowerCase();
              return (
                type.includes('reward') ||
                type.includes('salary') ||
                type.includes('profit') ||
                type.includes('adjustment') ||
                rem.includes('disbursal') ||
                rem.includes('reward') ||
                rem.includes('salary') ||
                rem.includes('profit') ||
                rem.includes('rank')
              );
            });
            setRecentDisbursals(disburseTxns);
          }
        } catch {
          // ignore
        }
      } else {
        toast.error(res?.message || 'Bulk disbursal failed.', 'Error');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error processing batch disbursal.', 'Error');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Top KPI values
  const totalRewardsDistributed = useMemo(() => {
    return recentDisbursals
      .filter(t => (t.type || '').toLowerCase().includes('reward') || (t.remarks || '').toLowerCase().includes('reward'))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [recentDisbursals]);

  const totalSalariesDistributed = useMemo(() => {
    return recentDisbursals
      .filter(t => (t.type || '').toLowerCase().includes('salary') || (t.remarks || '').toLowerCase().includes('salary'))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [recentDisbursals]);

  const totalProfitDistributed = useMemo(() => {
    return recentDisbursals
      .filter(t => (t.type || '').toLowerCase().includes('profit') || (t.remarks || '').toLowerCase().includes('profit'))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [recentDisbursals]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" count={4} />
        <div className="skeleton w-full h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-poppins">
      {/* ──────────────── TOP PAGE HEADER ──────────────── */}
      <PageHeader
        title="Disburse Earnings & Leadership Rewards"
        subtitle="Dedicated administrative console to disburse milestone cash bonuses, monthly leadership salaries & company profit sharing"
        badge="Rank-Based Streams"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<RiRefreshLine />}
              onClick={loadData}
              className="text-xs font-semibold"
            >
              Refresh Data
            </Button>
            <Button
              variant="secondary"
              icon={<RiTrophyLine />}
              onClick={() => navigate('/admin/ranks')}
              className="text-xs font-semibold"
            >
              Rank Ladder
            </Button>
            <Button
              variant="secondary"
              icon={<RiUserLine />}
              onClick={() => navigate('/admin/users')}
              className="text-xs font-semibold"
            >
              Users Table
            </Button>
          </div>
        }
      />

      {/* ──────────────── SUMMARY KPI CARDS ──────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Rank Rewards Disbursed"
          numericValue={totalRewardsDistributed}
          prefix="$"
          decimals={0}
          change="One-Time Bonuses"
          positive={true}
          icon="money"
        />
        <KPICard
          title="Monthly Salaries Paid"
          numericValue={totalSalariesDistributed}
          prefix="$"
          decimals={0}
          change="Leadership Allowances"
          positive={true}
          icon="chart"
        />
        <KPICard
          title="Profit Share Distributed"
          numericValue={totalProfitDistributed}
          prefix="$"
          decimals={0}
          change="Corporate Dividends"
          positive={true}
          icon="money"
        />
        <KPICard
          title="Total Registered Investors"
          numericValue={users.length}
          prefix=""
          decimals={0}
          change="Recipients Pool"
          positive={true}
          icon="users"
        />
      </div>

      {/* ──────────────── MAIN DISBURSAL CONSOLE (2-COLUMN GRID) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ACTIVE DISBURSAL FORM (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          {/* CONSOLE HEADER & MODE SWITCHER TABS */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold-50 text-gold-700 flex items-center justify-center font-bold">
                <RiCoinsLine size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Live Disbursal Console</h3>
                <p className="text-[11px] text-slate-500 font-normal">Choose individual investor or batch disburse to all eligible by rank</p>
              </div>
            </div>

            {/* MODE SWITCHER PILLS */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/90 shadow-2xs">
              <button
                type="button"
                onClick={() => setConsoleMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  consoleMode === 'single'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RiUserLine size={14} className={consoleMode === 'single' ? 'text-gold-600' : 'text-slate-400'} />
                <span>Single Investor</span>
              </button>
              <button
                type="button"
                onClick={() => setConsoleMode('bulk')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  consoleMode === 'bulk'
                    ? 'bg-gold-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RiGroupLine size={14} />
                <span>Batch / All in Rank</span>
                <span className="text-[9px] bg-slate-900 text-gold-300 px-1.5 py-0.2 rounded-full font-mono font-bold">
                  1-Click
                </span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ──────────────── MODE 1: SINGLE INVESTOR DISBURSAL ──────────────── */}
          {/* ========================================================================= */}
          {consoleMode === 'single' && (
            <div className="space-y-5 animate-fade-in">
              {/* STEP 1: SELECT INVESTOR WITH ADVANCED RANK & ELIGIBILITY FILTERS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>1. Select Target Investor *</span>
                  </label>
                  <span className="text-[10.5px] text-slate-400">
                    Use rank filter to find eligible achievers
                  </span>
                </div>

                {/* RANK FILTER BAR ABOVE DROPDOWN */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-2">
                  {/* Rank Dropdown Filter */}
                  <div className="sm:col-span-8 relative">
                    <select
                      value={singleRankFilter}
                      onChange={(e) => setSingleRankFilter(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-gold-400 cursor-pointer shadow-2xs"
                    >
                      <option value="all">🎯 Filter by Rank: All 12 Tiers ({users.length} Users)</option>
                      {RANK_LADDER_CONFIG.map((r) => {
                        const rankUserCount = users.filter(u => getUserRankConfig(u).level === r.level).length;
                        return (
                          <option key={r.level} value={r.level}>
                            Tier {r.level}: {r.name} ({rankUserCount} registered • ${r.reward.toLocaleString()} bonus)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Eligible Achievers Only Toggle */}
                  <div className="sm:col-span-4">
                    <button
                      type="button"
                      onClick={() => setSingleEligibleOnly(!singleEligibleOnly)}
                      className={`w-full py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                        singleEligibleOnly
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                      title="Show only users who have satisfied rank criteria targets"
                    >
                      {singleEligibleOnly ? <RiCheckLine size={14} className="text-emerald-600" /> : <RiFilterLine size={13} className="text-slate-400" />}
                      <span>{singleEligibleOnly ? '✔ Eligible Only' : 'All Users'}</span>
                    </button>
                  </div>
                </div>

                {/* Custom Searchable User Dropdown */}
                <div className="relative">
                  <div
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer flex items-center justify-between transition-colors shadow-2xs"
                  >
                    {selectedUser ? (
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-full bg-gold-400 text-slate-950 font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                          {(selectedUser.name || 'U').charAt(0)}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-900">{selectedUser.name}</span>
                          <span className="text-slate-400 ml-2 font-mono text-[11px]">({selectedUser.customId || selectedUser.id})</span>
                          <span className="text-gold-700 font-semibold ml-2 text-[10px] bg-gold-50 px-1.5 py-0.5 rounded border border-gold-200">
                            {selectedRankConfig.name} (Tier {selectedRankConfig.level})
                          </span>
                          {selectedEligibility.isEligible ? (
                            <span className="ml-1.5 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                              ✔ Eligible
                            </span>
                          ) : (
                            <span className="ml-1.5 text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded">
                              ⏳ In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Click to choose an investor...</span>
                    )}
                    <RiFilterLine size={15} className="text-slate-400 flex-shrink-0 ml-2" />
                  </div>

                  {/* Floating Dropdown Search Menu */}
                  {userDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 animate-fade-in space-y-2">
                      <div className="relative">
                        <RiSearchLine size={15} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          placeholder="Search filtered investors by name, email, or ID..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400"
                        />
                      </div>

                      <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
                        <span>Showing {filteredUsersList.length} matches</span>
                        {singleRankFilter !== 'all' && (
                          <span className="text-gold-700 font-semibold">
                            Rank: {RANK_LADDER_CONFIG.find(r => r.level === Number(singleRankFilter))?.name}
                          </span>
                        )}
                      </div>

                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {filteredUsersList.map(u => {
                          const rConf = getUserRankConfig(u);
                          const el = checkUserRankEligibility(u, rConf);
                          const isSelected = selectedUser?._id === u._id;

                          return (
                            <div
                              key={u._id || u.id}
                              onClick={() => handleSelectUser(u)}
                              className={`p-2 rounded-xl cursor-pointer text-xs flex items-center justify-between transition-colors ${
                                isSelected ? 'bg-gold-50 text-gold-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="min-w-0 truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold truncate">{u.name}</span>
                                  {el.isEligible ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      ✔ Eligible
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                      ⏳ Pending
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                                  {u.email} • {u.customId || u.id}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 ml-2 whitespace-nowrap">
                                {rConf.name}
                              </span>
                            </div>
                          );
                        })}
                        {filteredUsersList.length === 0 && (
                          <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                            <p>No investors match the selected criteria.</p>
                            {singleEligibleOnly && (
                              <button
                                type="button"
                                onClick={() => setSingleEligibleOnly(false)}
                                className="text-gold-700 font-bold underline hover:text-gold-800 cursor-pointer text-[11px]"
                              >
                                Turn off &quot;Eligible Only&quot; to see all rank members
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* SHORTCUT TO BATCH MODE IF MULTIPLE ELIGIBLE USERS EXIST */}
                {selectedUser && eligibleCountInSelectedRank > 1 && (
                  <div className="mt-2 p-2 rounded-xl bg-gradient-to-r from-gold-50 to-amber-50/60 border border-gold-200 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-gold-950 font-medium">
                      <RiGroupLine className="text-gold-700 flex-shrink-0" size={15} />
                      <span>
                        Found <strong>{eligibleCountInSelectedRank} eligible {selectedRankConfig.name}</strong> achievers on the platform.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBulkRank(selectedRankConfig.level);
                        setBulkWalletType(walletType);
                        setConsoleMode('bulk');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-gold-400 hover:bg-gold-500 text-slate-950 font-black text-[10.5px] cursor-pointer whitespace-nowrap shadow-2xs flex items-center gap-1"
                    >
                      <span>Disburse to All {eligibleCountInSelectedRank} at Once</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SELECTED INVESTOR LIVE DOSSIER BANNER */}
              {selectedUser && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50/80 via-gold-50/40 to-white rounded-2xl border border-gold-200/90 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-300 to-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-2xs">
                        {(selectedUser.name || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{selectedUser.name}</p>
                        <p className="text-[10.5px] text-slate-500">{selectedUser.email} • {selectedUser.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold-400 text-slate-950 border border-gold-500 shadow-2xs">
                        {selectedRankConfig.name} (Tier {selectedRankConfig.level})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gold-200/60 font-mono text-[11px]">
                    <div className="bg-white/80 p-1.5 rounded-lg border border-gold-100">
                      <span className="text-[9px] text-slate-400 uppercase font-sans block">Own Invested</span>
                      <span className="font-bold text-slate-800">${Number(selectedUser.totalInvested || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-gold-100">
                      <span className="text-[9px] text-slate-400 uppercase font-sans block">Team Turnover</span>
                      <span className="font-bold text-slate-800">${Number(selectedUser.teamTurnover || 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-gold-100">
                      <span className="text-[9px] text-slate-400 uppercase font-sans block">Direct Clients</span>
                      <span className="font-bold text-slate-800">{selectedUser.directReferrals || 0} Active</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-gold-100">
                      <span className="text-[9px] text-slate-400 uppercase font-sans block">Earning Wallet</span>
                      <span className="font-bold text-emerald-700">${Number(selectedUser.earningWallet || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: CHOOSE TARGET STREAM */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Target Wallet / Income Stream *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'rankReward', label: 'One Time Cash Reward ($)', desc: 'Milestone Achievement Bonus', icon: RiAwardLine },
                    { id: 'companyProfit', label: 'Company Profit %ge', desc: 'Profit Share Dividend', icon: RiPercentLine },
                    { id: 'salary', label: 'Per Month Salary', desc: 'Leadership Monthly Allowance', icon: RiBriefcaseLine },
                    { id: 'depositWallet', label: 'Deposit Wallet (Capital)', desc: 'Direct Capital Balance Adjustment', icon: RiWallet3Line },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleWalletTypeChange(st.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        walletType === st.id
                          ? 'border-gold-500 bg-gold-50/80 ring-2 ring-gold-200 text-slate-950 font-bold shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <st.icon size={18} className={walletType === st.id ? 'text-gold-700 mt-0.5' : 'text-slate-400 mt-0.5'} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight">{st.label}</p>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">{st.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 3: LIVE STREAM CALCULATION & ELIGIBILITY STATUS CARDS */}
              {selectedUser && (
                <div>
                  {/* 1. One Time Cash Reward Card */}
                  {walletType === 'rankReward' && (
                    <div className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                      selectedEligibility.isEligible
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50/90 border-amber-300 text-amber-950'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold flex items-center gap-1.5 text-xs">
                          <RiAwardLine className={selectedEligibility.isEligible ? 'text-emerald-700' : 'text-amber-700'} size={18} />
                          <span>One Time Cash Reward Entitlement</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white border border-slate-300 text-slate-800">
                            Tier {selectedRankConfig.level}: {selectedRankConfig.name}
                          </span>
                          {selectedEligibility.isEligible ? (
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
                          {selectedEligibility.isEligible ? (
                            <span className="text-emerald-800 font-black">
                              ${selectedRankConfig.reward.toLocaleString()} USD (Auto-filled)
                            </span>
                          ) : (
                            <span className="text-rose-700 font-black">
                              ${selectedRankConfig.reward.toLocaleString()} USD (Not Auto-filled)
                            </span>
                          )}
                        </span>
                      </div>

                      {selectedEligibility.isEligible ? (
                        <div className="p-2.5 rounded-lg bg-emerald-100/70 border border-emerald-300 text-[11px] text-emerald-900 space-y-0.5">
                          <p className="font-bold flex items-center gap-1">
                            <RiCheckLine className="text-emerald-700" size={14} />
                            Rank qualification verified! All targets fulfilled:
                          </p>
                          <p className="text-[10.5px] text-emerald-800">
                            Own Deposit: ${selectedEligibility.userOwnDeposit.toLocaleString()} / ${selectedRankConfig.ownDeposit.toLocaleString()} • Turnover: ${selectedEligibility.userTurnover.toLocaleString()} / ${selectedRankConfig.totalClientDeposit.toLocaleString()} • Directs: {selectedEligibility.userDirects} / {selectedRankConfig.requiredDirects}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-white/95 border border-amber-300 text-[11px] text-amber-950 space-y-2 shadow-2xs">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-rose-800 flex items-center gap-1">
                              <RiAlertLine className="text-rose-600 flex-shrink-0" size={14} />
                              <span>Rank qualification criteria pending (Reward not auto-filled):</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setAmount(String(selectedRankConfig.reward || 100));
                                setReason(`One Time Cash Reward ($${(selectedRankConfig.reward || 100).toLocaleString()}) - ${selectedRankConfig.name} Rank (Admin Override)`);
                              }}
                              className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded cursor-pointer transition-colors whitespace-nowrap"
                            >
                              ⚡ Force Fill ${selectedRankConfig.reward.toLocaleString()}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 border-t border-amber-100 text-[10px] font-mono">
                            <div className={`px-2 py-1 rounded border ${selectedEligibility.isOwnMet ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                              <div className="text-[9px] uppercase font-bold text-slate-500 font-sans">Own Deposit</div>
                              <div className="font-bold">${selectedEligibility.userOwnDeposit.toLocaleString()} / ${selectedRankConfig.ownDeposit.toLocaleString()}</div>
                              <div>{selectedEligibility.isOwnMet ? '✔ Met' : '❌ Pending'}</div>
                            </div>
                            <div className={`px-2 py-1 rounded border ${selectedEligibility.isTurnoverMet ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                              <div className="text-[9px] uppercase font-bold text-slate-500 font-sans">Client Turnover</div>
                              <div className="font-bold">${selectedEligibility.userTurnover.toLocaleString()} / ${selectedRankConfig.totalClientDeposit.toLocaleString()}</div>
                              <div>{selectedEligibility.isTurnoverMet ? '✔ Met' : '❌ Pending'}</div>
                            </div>
                            <div className={`px-2 py-1 rounded border ${selectedEligibility.isDirectsMet ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                              <div className="text-[9px] uppercase font-bold text-slate-500 font-sans">Direct Clients</div>
                              <div className="font-bold">{selectedEligibility.userDirects} / {selectedRankConfig.requiredDirects} Directs</div>
                              <div>{selectedEligibility.isDirectsMet ? '✔ Met' : '❌ Pending'}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Company Profit Share Card */}
                  {walletType === 'companyProfit' && (
                    <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-xs space-y-2.5 font-poppins">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-purple-950 flex items-center gap-1.5">
                          <RiPercentLine className="text-purple-700" size={17} />
                          <span>Company Profit Share Live Calculator</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-200 text-purple-900 border border-purple-300">
                            {selectedRankConfig.name}: {selectedRankConfig.profitPercent}%
                          </span>
                          {selectedRankConfig.profitPercent === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                              Tier 6+ Required
                            </span>
                          ) : selectedEligibility.isEligible ? (
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
                          <span className="absolute left-3 top-2.5 text-xs text-purple-400 font-mono">$</span>
                          <input
                            type="number"
                            step="any"
                            value={companyProfitInput}
                            onChange={(e) => handleCompanyProfitInputChange(e.target.value)}
                            placeholder="e.g. 100000"
                            className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-purple-300 text-xs font-bold text-purple-950 font-mono outline-none focus:border-purple-500 shadow-2xs"
                          />
                        </div>
                        {/* Quick preset buttons */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-purple-600 font-medium">Quick presets:</span>
                          {[25000, 50000, 100000, 250000, 500000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => handleCompanyProfitInputChange(String(amt))}
                              className="px-2 py-0.5 rounded bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-mono font-semibold cursor-pointer"
                            >
                              ${amt.toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {companyProfitInput && Number(companyProfitInput) > 0 && (
                        <div className="p-2.5 rounded-lg bg-white border border-purple-200 text-[11px] space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>Calculation Formula:</span>
                            <span className="font-mono text-purple-900 font-bold">
                              ${Number(companyProfitInput).toLocaleString()} × {selectedRankConfig.profitPercent}%
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-purple-100">
                            <span>Calculated Disbursal:</span>
                            <span className="font-mono text-emerald-700 text-xs font-black">
                              ${((Number(companyProfitInput) * selectedRankConfig.profitPercent) / 100).toFixed(2)} USD {selectedEligibility.isEligible ? '(Auto-filled below)' : '(Criteria pending - Not auto-filled)'}
                            </span>
                          </div>
                          {!selectedEligibility.isEligible && selectedRankConfig.profitPercent > 0 && (
                            <div className="pt-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const calculated = ((Number(companyProfitInput) * selectedRankConfig.profitPercent) / 100).toFixed(2);
                                  setAmount(String(Number(calculated)));
                                  setReason(`Company Profit Share (${selectedRankConfig.profitPercent}% of $${Number(companyProfitInput).toLocaleString()}) - ${selectedRankConfig.name} Rank (Admin Override)`);
                                }}
                                className="text-[10px] font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                ⚡ Force Fill Calculated Amount (${((Number(companyProfitInput) * selectedRankConfig.profitPercent) / 100).toFixed(2)})
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedRankConfig.profitPercent === 0 && (
                        <p className="text-[10.5px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-relaxed">
                          ⚠️ Note: Rank &quot;{selectedRankConfig.name}&quot; has <strong>0%</strong> profit share on the rank ladder (Profit sharing starts at Executive Director Tier 6 with 0.20%).
                        </p>
                      )}
                    </div>
                  )}

                  {/* 3. Monthly Salary Card */}
                  {walletType === 'salary' && (
                    <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-2 font-poppins">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold text-blue-950 flex items-center gap-1.5">
                          <RiBriefcaseLine className="text-blue-700" size={17} />
                          <span>Monthly Leadership Salary Entitlement</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-200 text-blue-900 border border-blue-300">
                            Tier {selectedRankConfig.level}: {selectedRankConfig.name}
                          </span>
                          {selectedRankConfig.salary === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                              Tier 6+ Required
                            </span>
                          ) : selectedEligibility.isEligible ? (
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
                          {selectedRankConfig.salary > 0 ? (
                            selectedEligibility.isEligible ? (
                              `$${selectedRankConfig.salary.toLocaleString()} USD / Month (Auto-filled)`
                            ) : (
                              `$${selectedRankConfig.salary.toLocaleString()} USD / Month (Not Auto-filled)`
                            )
                          ) : (
                            '$0 USD (Not eligible on ladder)'
                          )}
                        </span>
                      </div>
                      {selectedRankConfig.salary === 0 && (
                        <p className="text-[10.5px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-relaxed">
                          ⚠️ Note: Rank &quot;{selectedRankConfig.name}&quot; has no fixed monthly salary on the ladder (Salary starts from Executive Director Tier 6 at $500/month).
                        </p>
                      )}
                      {selectedRankConfig.salary > 0 && !selectedEligibility.isEligible && (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                          <span className="text-[10.5px] text-amber-800">
                            User rank criteria is pending. Salary is not auto-filled.
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAmount(String(selectedRankConfig.salary));
                              setReason(`Per Month Salary ($${selectedRankConfig.salary.toLocaleString()}) - ${selectedRankConfig.name} Rank (Admin Override)`);
                            }}
                            className="text-[10px] font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 border border-blue-300 px-2 py-0.5 rounded cursor-pointer transition-colors whitespace-nowrap"
                          >
                            ⚡ Force Fill ${selectedRankConfig.salary.toLocaleString()}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: OPERATION ACTION & AMOUNT (SINGLE MODE) */}
              <form onSubmit={handleSubmitSingleDisbursal} className="space-y-4 pt-2 border-t border-slate-100">
                {/* Action Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    3. Operation Action *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAction('credit')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        action === 'credit'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <RiArrowUpCircleLine size={16} className="text-emerald-600" />
                      <span>Credit (+) Add Funds</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAction('debit')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        action === 'debit'
                          ? 'bg-red-50 text-red-800 border-red-400 ring-2 ring-red-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <RiArrowDownCircleLine size={16} className="text-red-600" />
                      <span>Debit (-) Deduct Funds</span>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      4. Disbursal Amount ($ USD) *
                    </label>
                    {(walletType === 'rankReward' || walletType === 'salary' || walletType === 'companyProfit') && (
                      selectedEligibility.isEligible ? (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ⚡ Auto-filled (Rank Active)
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          ⚠️ Not Auto-filled (In Progress)
                        </span>
                      )
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full pl-7 pr-3 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 font-mono outline-none focus:border-gold-400 shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    5. Reason / Note (Visible to Investor)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. One Time Cash Reward - Team Leader Rank"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                  />
                </div>

                {/* Submit Disburse Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    icon={<RiCoinsLine />}
                    loading={submitting}
                    className="w-full py-3 text-sm font-bold shadow-gold cursor-pointer"
                  >
                    Confirm & Disburse Funds
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ──────────────── MODE 2: BATCH / BULK DISBURSAL TO ALL ──────────────── */}
          {/* ========================================================================= */}
          {consoleMode === 'bulk' && (
            <div className="space-y-5 animate-fade-in font-poppins">
              {/* STEP 1: CHOOSE TARGET RANK */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>1. Choose Target Rank *</span>
                  <span className="text-[10.5px] text-slate-400 font-normal">Select rank to bulk disburse to all achievers</span>
                </label>
                <div className="relative">
                  <select
                    value={bulkRank}
                    onChange={(e) => setBulkRank(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-gold-400 cursor-pointer shadow-2xs"
                  >
                    {RANK_LADDER_CONFIG.map((r) => {
                      const inRank = users.filter(u => getUserRankConfig(u).level === r.level);
                      const eligibleInRank = inRank.filter(u => checkUserRankEligibility(u, r).isEligible);
                      return (
                        <option key={r.level} value={r.level}>
                          Tier {r.level}: {r.name} — ({eligibleInRank.length} Eligible / {inRank.length} Total) • Reward: ${r.reward.toLocaleString()} • Profit: {r.profitPercent}% • Salary: ${r.salary.toLocaleString()}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* STEP 2: CHOOSE TARGET INCOME STREAM */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  2. Choose Income Stream to Disburse *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'rankReward', label: 'One Time Cash Reward ($)', desc: `Tier ${selectedBulkRankConfig.level}: $${selectedBulkRankConfig.reward.toLocaleString()} USD per eligible user`, icon: RiAwardLine },
                    { id: 'companyProfit', label: 'Company Profit %ge', desc: `Tier ${selectedBulkRankConfig.level}: ${selectedBulkRankConfig.profitPercent}% Profit Share`, icon: RiPercentLine },
                    { id: 'salary', label: 'Per Month Salary', desc: `Tier ${selectedBulkRankConfig.level}: $${selectedBulkRankConfig.salary.toLocaleString()} USD / month`, icon: RiBriefcaseLine },
                    { id: 'depositWallet', label: 'Deposit Wallet (Capital)', desc: 'Custom dollar balance adjustment to all', icon: RiWallet3Line },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setBulkWalletType(st.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        bulkWalletType === st.id
                          ? 'border-gold-500 bg-gold-50/80 ring-2 ring-gold-200 text-slate-950 font-bold shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <st.icon size={18} className={bulkWalletType === st.id ? 'text-gold-700 mt-0.5' : 'text-slate-400 mt-0.5'} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight">{st.label}</p>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">{st.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* DYNAMIC STREAM CONTROLS FOR BULK (IF PROFIT SHARE OR CUSTOM) */}
              {bulkWalletType === 'companyProfit' && (
                <div className="p-3.5 rounded-xl bg-purple-50/90 border border-purple-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950 flex items-center gap-1.5">
                      <RiPercentLine className="text-purple-700" size={16} />
                      <span>Company Profit Pool Allocation</span>
                    </span>
                    <span className="text-[10.5px] font-bold text-purple-900 bg-purple-200 px-2 py-0.5 rounded">
                      Rank {selectedBulkRankConfig.name}: {selectedBulkRankConfig.profitPercent}%
                    </span>
                  </div>

                  {selectedBulkRankConfig.profitPercent === 0 ? (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      ⚠️ Note: Rank &quot;{selectedBulkRankConfig.name}&quot; has 0% company profit share entitlement (Profit sharing starts at Executive Director Tier 6 with 0.20%).
                    </p>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-purple-950 mb-1">
                        Enter Company Total Profit ($ USD):
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-purple-400 font-mono">$</span>
                        <input
                          type="number"
                          step="any"
                          value={bulkCompanyProfit}
                          onChange={(e) => setBulkCompanyProfit(e.target.value)}
                          placeholder="e.g. 100000"
                          className="w-full pl-7 pr-3 py-1.5 bg-white rounded-xl border border-purple-300 text-xs font-bold text-purple-950 font-mono outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-purple-600 font-medium">Quick presets:</span>
                        {[25000, 50000, 100000, 250000, 500000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setBulkCompanyProfit(String(amt))}
                            className="px-2 py-0.5 rounded bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-mono font-semibold cursor-pointer"
                          >
                            ${amt.toLocaleString()}
                          </button>
                        ))}
                      </div>

                      {bulkCompanyProfit && Number(bulkCompanyProfit) > 0 && (
                        <div className="mt-2 p-2 rounded-lg bg-white border border-purple-200 text-[11px] text-purple-900 font-medium flex items-center justify-between">
                          <span>Calculated share per eligible user:</span>
                          <span className="font-mono font-black text-emerald-700 text-xs">
                            ${((Number(bulkCompanyProfit) * selectedBulkRankConfig.profitPercent) / 100).toFixed(2)} USD
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {bulkWalletType === 'depositWallet' && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Amount to Deposit into Each Selected Investor&apos;s Capital Wallet ($ USD):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="any"
                      value={bulkCustomAmount}
                      onChange={(e) => setBulkCustomAmount(e.target.value)}
                      placeholder="e.g. 250"
                      className="w-full pl-7 pr-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900 font-mono outline-none focus:border-gold-400"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: ELIGIBLE RECIPIENTS CHECKLIST & FILTERS */}
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      3. Select Recipients Pool ({filteredBulkUsers.length} Users)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Eligible Filter Toggle */}
                    <button
                      type="button"
                      onClick={() => setBulkEligibleOnly(!bulkEligibleOnly)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        bulkEligibleOnly
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <RiCheckLine size={13} />
                      <span>Eligible Achievers Only</span>
                    </button>

                    {/* Master Checkbox Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleSelectAllBulk}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                    >
                      {filteredBulkUsers.length > 0 && filteredBulkUsers.every(u => selectedBulkUserIds.includes(u._id || u.id))
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* Search Box within Bulk candidates */}
                <div className="relative mb-2">
                  <RiSearchLine size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={bulkSearchQuery}
                    onChange={(e) => setBulkSearchQuery(e.target.value)}
                    placeholder="Search users in this rank by name or ID..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs outline-none focus:border-gold-400"
                  />
                </div>

                {/* Candidate List Container */}
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                  {filteredBulkUsers.map(u => {
                    const isChecked = selectedBulkUserIds.includes(u._id || u.id);
                    return (
                      <div
                        key={u._id || u.id}
                        onClick={() => handleToggleBulkUser(u._id || u.id)}
                        className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-gold-50/70 hover:bg-gold-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent onClick
                            className="w-4 h-4 rounded border-slate-300 text-gold-500 focus:ring-gold-400 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 truncate">{u.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({u.customId || u.id})</span>
                              {u.eligibility.isEligible ? (
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                                  ✔ Eligible
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  ⏳ Pending
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] text-slate-400 truncate">
                              Own: ${Number(u.totalInvested || 0).toLocaleString()} • Turnover: ${Number(u.teamTurnover || 0).toLocaleString()} • Directs: {u.directReferrals || 0}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 ml-2 font-mono">
                          <span className="text-xs font-black text-emerald-700">
                            ${Number(u.calculatedAmount || 0).toLocaleString()}
                          </span>
                          <span className="block text-[9.5px] text-slate-400 font-sans">
                            Entitled Payout
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredBulkUsers.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                      <p>No investors found for Tier {selectedBulkRankConfig.level}: {selectedBulkRankConfig.name}.</p>
                      {bulkEligibleOnly && (
                        <button
                          type="button"
                          onClick={() => setBulkEligibleOnly(false)}
                          className="text-gold-700 font-bold underline cursor-pointer"
                        >
                          View all registered users in this rank
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 4: GRAND TOTAL SUMMARY CARD & 1-CLICK ACTION BUTTON */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-gold-500/40 shadow-lg space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gold-400 text-slate-950 flex items-center justify-center font-black text-xs">
                      ∑
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gold-300 uppercase tracking-wider block">
                        Batch Total Calculation
                      </span>
                      <span className="text-[10.5px] text-slate-400">
                        All selected investors will receive their entitled balance in 1 go
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 border border-gold-500/40">
                    Tier {selectedBulkRankConfig.level}: {selectedBulkRankConfig.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-center">
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-sans block">Selected Achievers</span>
                    <span className="text-base font-black text-white">{bulkSelectedUsers.length} Users</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-sans block">Per User Payout</span>
                    <span className="text-base font-black text-gold-300">
                      ${bulkSelectedUsers.length > 0 ? (Number(bulkGrandTotalAmount) / bulkSelectedUsers.length).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1 bg-gradient-to-r from-gold-500/20 to-amber-500/20 p-2.5 rounded-xl border border-gold-400/60 shadow-2xs">
                    <span className="text-[10px] text-gold-300 uppercase font-sans font-bold block">Grand Total Payout</span>
                    <span className="text-lg font-black text-gold-400">
                      ${bulkGrandTotalAmount.toLocaleString()} USD
                    </span>
                  </div>
                </div>

                {/* Bulk Reason Note */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Reason / Note (Logged in User Audit Trail):
                  </label>
                  <input
                    type="text"
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    placeholder="e.g. One Time Cash Reward to Associate Achievers"
                    className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-xs font-medium text-white outline-none focus:border-gold-400"
                  />
                </div>

                {/* EXECUTE 1-CLICK BUTTON */}
                <div>
                  <Button
                    type="button"
                    variant="primary"
                    icon={<RiSendPlaneLine />}
                    loading={bulkSubmitting}
                    disabled={bulkSelectedUsers.length === 0 || bulkGrandTotalAmount <= 0}
                    onClick={handleExecuteBulkDisbursal}
                    className="w-full py-3.5 text-sm font-black shadow-gold cursor-pointer"
                  >
                    {bulkSelectedUsers.length === 0
                      ? 'Please Select at Least 1 Investor'
                      : bulkGrandTotalAmount <= 0
                        ? 'Payout is $0 (Specify Profit or Amount)'
                        : `⚡ Disburse Total $${bulkGrandTotalAmount.toLocaleString()} to ${bulkSelectedUsers.length} Selected Investors in 1-Click`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: RECENT DISBURSAL AUDIT & HISTORY (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <RiHistoryLine size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Disbursal Audit Log</h3>
                <p className="text-[11px] text-slate-500 font-normal">Recent administrative transfers & rewards</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {recentDisbursals.length} Records
            </span>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            {['all', 'reward', 'salary', 'profit'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setHistoryFilter(f)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer capitalize ${
                  historyFilter === f
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f === 'all' ? 'All Logs' : f}
              </button>
            ))}
          </div>

          {/* Records List */}
          <div className="max-h-[560px] overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
            {recentDisbursals
              .filter(tx => {
                if (historyFilter === 'all') return true;
                const rem = ((tx.type || '') + ' ' + (tx.remarks || tx.description || tx.reason || '')).toLowerCase();
                return rem.includes(historyFilter);
              })
              .slice(0, 30)
              .map((tx) => (
                <div key={tx._id || tx.id} className="pt-2.5 first:pt-0 space-y-1 font-poppins">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">
                      {tx.userName || tx.userEmail || 'Investor'}
                    </span>
                    <span className="font-black text-xs font-mono text-emerald-700">
                      +${Number(tx.amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                    <span className="truncate max-w-[200px]" title={tx.remarks || tx.reason || tx.type}>
                      {tx.remarks || tx.reason || tx.type || 'Disbursal'}
                    </span>
                    <span className="font-mono text-[10px]">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                      {tx.customId || tx.transactionId || 'TXN-DISBURSE'}
                    </span>
                    <Badge variant="success" size="sm">Completed</Badge>
                  </div>
                </div>
              ))}

            {recentDisbursals.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No manual disbursal transactions found yet. Disbursed funds will appear here in real-time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
