import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiEyeLine, RiDeleteBinLine, RiMailLine, RiPhoneLine,
  RiGlobalLine, RiCalendarEventLine, RiUserLine, RiAlertLine,
  RiMoneyDollarCircleLine, RiFlashlightLine, RiShieldFlashLine,
  RiLeafLine, RiCoinsLine, RiWallet3Line, RiArrowUpCircleLine,
  RiArrowDownCircleLine, RiExchangeDollarLine, RiPercentLine, RiTimeLine,
  RiCalendarCheckLine, RiGroupLine, RiCheckLine, RiCloseLine,
  RiKeyLine, RiNodeTree, RiFileCopyLine, RiShieldCheckLine, RiShieldLine,
  RiExchangeLine, RiEyeOffLine, RiLockPasswordLine, RiSparklingLine,
  RiEditLine, RiAwardLine, RiBriefcaseLine, RiCalculatorLine,
  RiMore2Fill
} from 'react-icons/ri';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import PageHeader from '../components/ui/PageHeader';
import { useToast } from '../context/ToastContext';
import {
  getAllUsers,
  getUserById,
  updateUserDetails,
  updateUserStatus,
  adjustUserWallet,
  deleteUser,
  markUsersSeen,
  shiftUserSponsor
} from '../api/usersApi';

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

  // If user object has an explicit rank active verification flag
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

  // If user has already achieved a higher rank level than this tier
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

export default function Users() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userList, setUserList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  // Close floating 3-dots action menu when clicking anywhere else
  useEffect(() => {
    const handleCloseMenu = () => setActiveActionMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  // Shift Sponsor Modal State
  const [shiftModalUser, setShiftModalUser] = useState(null);
  const [targetSponsorInput, setTargetSponsorInput] = useState('');
  const [shifting, setShifting] = useState(false);

  // View Password State
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [modalShowPassword, setModalShowPassword] = useState(false);
  const [drawerShowPassword, setDrawerShowPassword] = useState(false);

  // Edit User Credentials (Email, Phone, Name, Country) State
  const [editModalUser, setEditModalUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', country: '' });
  const [savingUserEdit, setSavingUserEdit] = useState(false);

  // Adjust / Disburse Wallet Modal State
  const [adjustModalUser, setAdjustModalUser] = useState(null);
  const [companyProfitInput, setCompanyProfitInput] = useState('');
  const [adjustForm, setAdjustForm] = useState({
    walletType: 'rankReward',
    action: 'credit',
    amount: '',
    reason: '',
  });
  const [adjustingWallet, setAdjustingWallet] = useState(false);

  const handleOpenAdjustModal = (user, defaultType = 'rankReward') => {
    setAdjustModalUser(user);
    const rankInfo = getUserRankConfig(user);
    const eligibility = checkUserRankEligibility(user, rankInfo);
    setCompanyProfitInput('');

    let initAmount = '';
    let initReason = '';

    if (defaultType === 'rankReward') {
      if (eligibility.isEligible) {
        initAmount = String(rankInfo.reward || 100);
        initReason = `One Time Cash Reward ($${(rankInfo.reward || 100).toLocaleString()}) - ${rankInfo.name} Rank (Eligible)`;
      } else {
        initAmount = '';
        initReason = `One Time Cash Reward - ${rankInfo.name} Rank`;
      }
    } else if (defaultType === 'salary') {
      if (eligibility.isEligible && rankInfo.salary > 0) {
        initAmount = String(rankInfo.salary);
        initReason = `Per Month Salary ($${rankInfo.salary.toLocaleString()}) - ${rankInfo.name} Rank (Eligible)`;
      } else {
        initAmount = '';
        initReason = `Per Month Salary - ${rankInfo.name} Rank`;
      }
    } else if (defaultType === 'companyProfit') {
      initAmount = '';
      initReason = `Company Profit %ge - ${rankInfo.name} Rank`;
    } else {
      initAmount = '';
      initReason = 'Capital Balance Adjustment (Deposit Wallet)';
    }

    setAdjustForm({
      walletType: defaultType,
      action: 'credit',
      amount: initAmount,
      reason: initReason,
    });
  };

  const handleWalletTypeChange = (newType) => {
    if (!adjustModalUser) return;
    const rankInfo = getUserRankConfig(adjustModalUser);
    const eligibility = checkUserRankEligibility(adjustModalUser, rankInfo);
    let newAmount = '';
    let newReason = '';

    if (newType === 'rankReward') {
      if (eligibility.isEligible) {
        newAmount = String(rankInfo.reward || 100);
        newReason = `One Time Cash Reward ($${(rankInfo.reward || 100).toLocaleString()}) - ${rankInfo.name} Rank (Eligible)`;
      } else {
        newAmount = '';
        newReason = `One Time Cash Reward - ${rankInfo.name} Rank`;
      }
    } else if (newType === 'salary') {
      if (eligibility.isEligible && rankInfo.salary > 0) {
        newAmount = String(rankInfo.salary);
        newReason = `Per Month Salary ($${rankInfo.salary.toLocaleString()}) - ${rankInfo.name} Rank (Eligible)`;
      } else {
        newAmount = '';
        newReason = `Per Month Salary - ${rankInfo.name} Rank`;
      }
    } else if (newType === 'companyProfit') {
      const numProfit = parseFloat(companyProfitInput) || 0;
      if (numProfit > 0 && rankInfo.profitPercent > 0 && eligibility.isEligible) {
        const calculated = ((numProfit * rankInfo.profitPercent) / 100).toFixed(2);
        newAmount = String(Number(calculated));
        newReason = `Company Profit Share (${rankInfo.profitPercent}% of $${numProfit.toLocaleString()}) - ${rankInfo.name} Rank`;
      } else {
        newAmount = '';
        newReason = `Company Profit Share (${rankInfo.profitPercent}%) - ${rankInfo.name} Rank`;
      }
    } else if (newType === 'depositWallet') {
      newAmount = '';
      newReason = 'Capital Balance Adjustment (Deposit Wallet)';
    }

    setAdjustForm(prev => ({
      ...prev,
      walletType: newType,
      amount: newAmount,
      reason: newReason,
    }));
  };

  const handleCompanyProfitInputChange = (profitValStr) => {
    setCompanyProfitInput(profitValStr);
    if (!adjustModalUser) return;
    const rankInfo = getUserRankConfig(adjustModalUser);
    const eligibility = checkUserRankEligibility(adjustModalUser, rankInfo);
    const numProfit = parseFloat(profitValStr) || 0;

    if (numProfit > 0 && rankInfo.profitPercent > 0 && eligibility.isEligible) {
      const calculated = ((numProfit * rankInfo.profitPercent) / 100).toFixed(2);
      setAdjustForm(prev => ({
        ...prev,
        amount: String(Number(calculated)),
        reason: `Company Profit Share (${rankInfo.profitPercent}% of $${numProfit.toLocaleString()}) - ${rankInfo.name} Rank`,
      }));
    } else if (numProfit > 0 && rankInfo.profitPercent > 0 && !eligibility.isEligible) {
      setAdjustForm(prev => ({
        ...prev,
        amount: '',
        reason: `Company Profit Share (${rankInfo.profitPercent}% of $${numProfit.toLocaleString()}) - Criteria Pending`,
      }));
    } else if (numProfit > 0 && rankInfo.profitPercent === 0) {
      setAdjustForm(prev => ({
        ...prev,
        amount: '0',
        reason: `Company Profit Share (0%) - ${rankInfo.name} Rank`,
      }));
    } else {
      setAdjustForm(prev => ({
        ...prev,
        amount: '',
      }));
    }
  };

  const handleSaveWalletAdjustment = async (e) => {
    e?.preventDefault();
    if (!adjustModalUser || !adjustForm.amount || Number(adjustForm.amount) <= 0) {
      toast.error('Please enter a valid positive amount.', 'Validation Error');
      return;
    }
    setAdjustingWallet(true);
    try {
      const res = await adjustUserWallet(adjustModalUser._id || adjustModalUser.id, {
        walletType: adjustForm.walletType,
        action: adjustForm.action,
        amount: Number(adjustForm.amount),
        reason: adjustForm.reason.trim() || `Manual adjustment by Admin (${adjustForm.walletType})`,
      });

      if (res?.success) {
        toast.success(res.message || 'Wallet adjusted successfully.', 'Balance Updated');
        const updatedUser = res.user;
        setUserList(prev => prev.map(u => (u._id === adjustModalUser._id || u.id === adjustModalUser.id) ? { ...u, ...updatedUser } : u));
        if (selectedUser && (selectedUser._id === adjustModalUser._id || selectedUser.id === adjustModalUser.id)) {
          setSelectedUser(prev => ({ ...prev, ...updatedUser }));
        }
        setAdjustModalUser(null);
      } else {
        toast.error(res?.message || 'Failed to adjust wallet.', 'Adjustment Failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error processing wallet adjustment.', 'Adjustment Failed');
    } finally {
      setAdjustingWallet(false);
    }
  };

  const handleOpenEditModal = (user) => {
    setEditModalUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      country: user.country || '',
    });
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editModalUser) return;
    if (!editForm.email || !editForm.email.includes('@')) {
      toast.error('Please enter a valid email address.', 'Validation Error');
      return;
    }

    setSavingUserEdit(true);
    try {
      const res = await updateUserDetails(editModalUser._id || editModalUser.id, editForm);
      if (res?.success) {
        toast.success(`User ${editForm.name || editModalUser.name} credentials updated successfully!`, 'User Updated');
        
        // Update userList in table
        setUserList(prev => prev.map(u => (u._id === editModalUser._id || u.id === editModalUser.id) ? {
          ...u,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          country: editForm.country,
        } : u));

        // Update selectedUser if open in drawer
        if (selectedUser && (selectedUser._id === editModalUser._id || selectedUser.id === editModalUser.id)) {
          setSelectedUser(prev => ({
            ...prev,
            name: editForm.name,
            email: editForm.email,
            phone: editForm.phone,
            country: editForm.country,
          }));
        }

        setEditModalUser(null);
      } else {
        toast.error(res?.message || 'Failed to update user details.', 'Error');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error updating user details.', 'Error');
    } finally {
      setSavingUserEdit(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getAllUsers({
        limit: 'all',
      });

      if (res?.success && Array.isArray(res.users)) {
        const formatted = res.users.map(u => ({
          ...u,
          _id: u._id,
          id: u.customId || u._id,
          customId: u.customId || '',
          name: u.name || u.userName || 'Investor',
          userName: u.userName || '',
          fullName: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          country: u.country || 'Global',
          joined: u.createdAt ? u.createdAt.split('T')[0] : '2026-01-01',
          status: u.status || 'Active',
          isSeenByAdmin: u.isSeenByAdmin !== undefined ? u.isSeenByAdmin : true,
          payoutType: 'Per Second (Live)',
          activeContracts: u.activeInvestments || 0,
          totalInvested: Number(u.totalInvested || 0),
          totalEarned: Number(u.totalProfit || u.totalEarned || 0),
          totalWithdrawn: Number(u.totalWithdrawn || 0),
          depositWallet: Number(u.depositWallet || 0),
          earningWallet: Number(u.earningWallet || 0),
          referredBy: u.sponsorId || 'HORIZON-HQ',
          totalReferrals: u.totalReferrals || 0,
          directReferrals: u.directReferrals || 0,
          teamTurnover: Number(u.teamTurnover || 0),
          rankLevel: Number(u.rankLevel || 1),
          currentRank: u.currentRank || 'Associate',
          rank: {
            level: u.rankLevel || 1,
            name: u.currentRank || 'Starter',
          },
          is2FAEnabled: !!u.is2FAEnabled,
          plainPassword: u.plainPassword || '',
          recentTransactions: [],
        }));
        setUserList(formatted);

        // If there are unseen users, mark them seen in backend & sync sidebar
        if (res.unseenCount > 0 || res.users.some(u => u.isSeenByAdmin === false)) {
          markUsersSeen().catch(() => {});
          window.dispatchEvent(new CustomEvent('admin-users-seen'));
        }
      } else {
        setUserList([]);
      }
    } catch (err) {
      console.warn('Error fetching users:', err.message);
      setUserList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page to 1 on filter, search, or pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  const statusVariant = (status) =>
    status === 'Active' ? 'success' : status === 'Blocked' ? 'danger' : 'warning';

  // Handle Delete Confirmation
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      if (userToDelete._id) {
        await deleteUser(userToDelete._id);
      }
    } catch (err) {
      console.warn('API delete user offline:', err.message);
    }
    setUserList(prev => prev.filter(u => u.id !== userToDelete.id && u._id !== userToDelete._id));
    toast.info(`User ${userToDelete.name || userToDelete.id} removed from platform records.`, 'User Deleted');
    if (selectedUser?.id === userToDelete.id || selectedUser?._id === userToDelete._id) {
      setSelectedUser(null);
    }
    setUserToDelete(null);
  };

  // Toggle user status
  const handleToggleStatus = async (user, nextStatus) => {
    try {
      if (user._id) {
        await updateUserStatus(user._id, nextStatus);
      }
    } catch (err) {
      console.warn('API update user status offline:', err.message);
    }
    setUserList(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
    toast.success(`User ${user.name} status updated to ${nextStatus}.`, 'Status Updated');
    if (selectedUser?.id === user.id) {
      setSelectedUser(prev => ({ ...prev, status: nextStatus }));
    }
  };

  // Shift user sponsor internally (Silent hierarchy adjustment)
  const handleShiftSponsor = async (e) => {
    e?.preventDefault();
    if (!shiftModalUser || !targetSponsorInput.trim()) return;
    setShifting(true);
    try {
      const res = await shiftUserSponsor(shiftModalUser._id || shiftModalUser.id, targetSponsorInput.trim());
      if (res?.success) {
        toast.success(`User ${shiftModalUser.name} successfully shifted under ${targetSponsorInput.trim()} internally without notifying client.`, 'Hierarchy Reassigned');
        const newSponsor = targetSponsorInput.trim();
        setUserList(prev => prev.map(u => (u._id === shiftModalUser._id || u.id === shiftModalUser.id ? { ...u, referredBy: newSponsor } : u)));
        if (selectedUser && (selectedUser._id === shiftModalUser._id || selectedUser.id === shiftModalUser.id)) {
          setSelectedUser(prev => ({ ...prev, referredBy: newSponsor }));
        }
        setShiftModalUser(null);
        setTargetSponsorInput('');
      } else {
        toast.error(res?.message || 'Failed to shift sponsor.', 'Shift Failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error shifting sponsor hierarchy.', 'Shift Failed');
    } finally {
      setShifting(false);
    }
  };

  // Handle View User Details with dynamic Active Plans & Transaction History
  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    try {
      const res = await getUserById(user._id || user.id);
      if (res?.success) {
        setSelectedUser(prev => ({
          ...prev,
          ...(res.user || {}),
          activePlans: res.activePlans || [],
          recentTransactions: res.recentTransactions || [],
        }));
      }
    } catch (err) {
      console.warn('Error fetching user full details:', err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Robust Multi-Field Search across User Name, User ID, Email, and Phone Number
  const filtered = userList.filter(user => {
    const rawQ = (search || '').trim();
    if (!rawQ) {
      const matchStatus = statusFilter === 'all' || (user.status || '').toLowerCase() === statusFilter.toLowerCase();
      return matchStatus;
    }

    const q = rawQ.toLowerCase();

    // 1. User Name & Username Search (matches name, userName, fullName with substring & multi-token support)
    const nameStr = String(user.name || '').toLowerCase();
    const userNameStr = String(user.userName || '').toLowerCase();
    const fullNameStr = String(user.fullName || '').toLowerCase();
    const matchName =
      nameStr.includes(q) ||
      userNameStr.includes(q) ||
      fullNameStr.includes(q);
    const tokens = q.split(/\s+/).filter(Boolean);
    const matchNameTokens =
      tokens.length > 1 &&
      (tokens.every(token => nameStr.includes(token)) ||
       tokens.every(token => userNameStr.includes(token)) ||
       tokens.every(token => fullNameStr.includes(token)));

    // 2. User ID Search (customId e.g. HCW-USR-..., user.id, MongoDB _id, fallback formatted ID)
    const customIdStr = String(user.customId || '').toLowerCase();
    const idStr = String(user.id || '').toLowerCase();
    const mongoIdStr = String(user._id || '').toLowerCase();
    const fallbackIdStr = `horizon-usr-0${idStr}`;
    const matchId =
      customIdStr.includes(q) ||
      idStr.includes(q) ||
      mongoIdStr.includes(q) ||
      fallbackIdStr.includes(q);

    // 3. Email Address Search
    const emailStr = String(user.email || '').toLowerCase();
    const matchEmail = emailStr.includes(q);

    // 4. Phone Number Search (raw string match + stripped-digits matching)
    const rawPhone = String(user.phone || '').toLowerCase();
    const matchRawPhone = rawPhone.length > 0 && rawPhone.includes(q);
    const userPhoneDigits = rawPhone.replace(/\D/g, '');
    const queryDigits = q.replace(/\D/g, '');
    const isStrictPhoneQuery = q.replace(/[\d\s+\-()]/g, '').length === 0 && queryDigits.length > 0;
    const matchDigitsPhone =
      userPhoneDigits.length > 0 &&
      queryDigits.length > 0 &&
      (queryDigits.length >= 3 || isStrictPhoneQuery) &&
      (userPhoneDigits.includes(queryDigits) || (queryDigits.length >= 7 && queryDigits.includes(userPhoneDigits)));
    const matchPhone = matchRawPhone || matchDigitsPhone;

    // 5. Additional contextual matches (Country, Sponsor ID)
    const countryStr = String(user.country || '').toLowerCase();
    const sponsorStr = String(user.referredBy || user.sponsorId || '').toLowerCase();
    const matchCountry = countryStr.includes(q);
    const matchSponsor = sponsorStr.includes(q);

    const matchSearch =
      matchName ||
      matchNameTokens ||
      matchId ||
      matchEmail ||
      matchPhone ||
      matchCountry ||
      matchSponsor;

    const matchStatus = statusFilter === 'all' || (user.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  if (loading) {
    return <SkeletonLoader type="table" rows={6} cols={7} />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-poppins">
      {/* Header */}
      <PageHeader
        title="Users Management"
        subtitle="Real-time overview of platform investors, active payout modes & portfolio holdings"
        badge="User Directory"
        actions={
          <div className="flex items-center gap-2 text-sm font-poppins">
            <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full font-semibold text-xs shadow-2xs">
              {userList.filter(u => u.status === 'Active').length} Active Investors
            </span>
            <span className="px-3.5 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full font-semibold text-xs shadow-2xs">
              {userList.length} Total Users
            </span>
          </div>
        }
      />

      {/* Filters & Search */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            placeholder="Search by name, username, user ID, email, or phone number..."
            value={search}
            onChange={setSearch}
            className="flex-1 font-poppins text-xs"
          />
          <div className="flex gap-2 overflow-x-auto font-poppins scrollbar-none pb-0.5">
            {['all', 'Active', 'Blocked', 'Inactive'].map(st => {
              const count = st === 'all'
                ? userList.length
                : userList.filter(u => (u.status || '').toLowerCase() === st.toLowerCase()).length;

              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === st
                      ? 'bg-gold-400 text-slate-900 shadow-gold font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? `All Users (${count})` : `${st} (${count})`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table font-poppins">
            <thead>
              <tr className="text-slate-400 font-medium text-xs tracking-wider">
                <th className="font-medium text-slate-500">Investor Details</th>
                <th className="font-medium text-slate-500">User ID & Email</th>
                <th className="font-medium text-slate-500">Contact Phone</th>
                <th className="font-medium text-slate-500">Referred By (Sponsor)</th>
                <th className="font-medium text-slate-500">Password</th>
                <th className="font-medium text-slate-500">Country</th>
                <th className="font-medium text-slate-500">Status</th>
                <th className="text-right pr-6 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((user, i) => {
                const userCustomId = user.customId || `HORIZON-USR-0${user.id}`;

                return (
                  <tr
                    key={user.id}
                    className="animate-fade-in hover:bg-slate-50/70 transition-colors"
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    {/* Full Name & Avatar */}
                    <td>
                      <div className="flex items-center gap-3.5 font-poppins">
                        {/* Large Round Circle Avatar */}
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-900 font-bold flex items-center justify-center flex-shrink-0 shadow-xs ring-2 ring-gold-200/80 text-xs font-poppins">
                          {(user.name || 'Investor').trim().split(/\s+/).map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-800 truncate leading-tight font-poppins">
                              {user.name}
                            </p>
                            {!user.isSeenByAdmin && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gold-100 text-gold-900 border border-gold-300 shadow-2xs flex-shrink-0">
                                NEW
                              </span>
                            )}
                          </div>
                          {user.userName && user.userName !== user.name && (
                            <p className="text-[11px] text-amber-700 font-medium font-mono truncate">
                              @{user.userName}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400 font-normal font-poppins mt-0.5">
                            Joined {user.joined}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* User ID & Email */}
                    <td>
                      <div className="space-y-1 font-poppins">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gold-700 text-xs tracking-tight bg-gold-50/80 px-2 py-0.5 rounded-md border border-gold-200/80">
                            {userCustomId}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(userCustomId);
                              toast.info(`Copied ID: ${userCustomId}`, 'Copied');
                            }}
                            className="text-slate-400 hover:text-slate-700 p-0.5 transition-colors"
                            title="Copy User ID"
                          >
                            <RiFileCopyLine size={13} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="truncate max-w-[180px]">{user.email}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(user.email);
                              toast.info(`Copied Email: ${user.email}`, 'Copied');
                            }}
                            className="text-slate-400 hover:text-slate-700 p-0.5 transition-colors"
                            title="Copy Email"
                          >
                            <RiFileCopyLine size={12} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Mobile Number */}
                    <td className="text-xs font-medium text-slate-600 font-poppins whitespace-nowrap">
                      {user.phone || '—'}
                    </td>

                    {/* Referred By / Sponsor with quick Shift trigger */}
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-50/80 text-slate-700 text-xs font-semibold border border-gold-200/80 whitespace-nowrap font-poppins">
                          <RiGroupLine size={13} className="text-gold-600" />
                          {user.referredBy || 'Direct Platform'}
                        </span>
                        <button
                          onClick={() => {
                            setShiftModalUser(user);
                            setTargetSponsorInput(user.referredBy || 'HORIZON-HQ');
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-gold-700 hover:bg-gold-50 transition-colors border border-transparent hover:border-gold-200"
                          title="Shift user downline hierarchy position internally"
                        >
                          <RiExchangeLine size={14} />
                        </button>
                      </div>
                    </td>

                    {/* Password View with Eye Toggle & Copy */}
                    <td>
                      <div className="flex items-center gap-1.5 font-poppins">
                        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 select-all tracking-wider min-w-[70px] text-center">
                          {showPasswordMap[user._id || user.id] ? (user.plainPassword || '••••••••') : '••••••••'}
                        </span>
                        <button
                          onClick={() => setShowPasswordMap(prev => ({ ...prev, [user._id || user.id]: !prev[user._id || user.id] }))}
                          className="p-1 rounded-md text-slate-400 hover:text-gold-700 hover:bg-gold-50 transition-colors cursor-pointer border border-transparent hover:border-gold-200"
                          title={showPasswordMap[user._id || user.id] ? "Hide password" : "Show password"}
                        >
                          {showPasswordMap[user._id || user.id] ? <RiEyeOffLine size={14} /> : <RiEyeLine size={14} />}
                        </button>
                        {user.plainPassword && (
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(user.plainPassword);
                              toast.info(`Copied password for ${user.name}`, 'Copied');
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-gold-700 hover:bg-gold-50 transition-colors cursor-pointer border border-transparent hover:border-gold-200"
                            title="Copy password"
                          >
                            <RiFileCopyLine size={13} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Country */}
                    <td className="text-xs font-medium text-slate-600 font-poppins whitespace-nowrap">
                      {user.country}
                    </td>

                    {/* Status */}
                    <td>
                      <Badge variant={statusVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </td>

                    {/* Actions: Compact 3-Dots Dropdown Menu */}
                    <td className="text-right pr-6 whitespace-nowrap">
                      <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setActiveActionMenu(activeActionMenu === (user._id || user.id) ? null : (user._id || user.id))}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs border ${
                            activeActionMenu === (user._id || user.id)
                              ? 'bg-gold-400 text-slate-950 border-gold-500 shadow-gold ring-2 ring-gold-200'
                              : 'bg-slate-100 hover:bg-gold-50 text-slate-600 hover:text-slate-900 border-slate-200/80 hover:border-gold-300'
                          }`}
                          title="Investor actions menu"
                        >
                          <RiMore2Fill size={18} />
                        </button>

                        {/* Floating Action Dropdown Menu */}
                        {activeActionMenu === (user._id || user.id) && (
                          <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fade-in font-poppins text-xs divide-y divide-slate-100 text-left">
                            <div className="py-1">
                              {/* 1. View Details */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenu(null);
                                  handleViewUser(user);
                                }}
                                className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-gold-50 hover:text-gold-950 transition-colors cursor-pointer font-medium"
                              >
                                <RiEyeLine size={15} className="text-slate-400" />
                                <span>View Details</span>
                              </button>

                              {/* 2. Disburse Earnings (Redirects to Dedicated Page) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenu(null);
                                  navigate(`/admin/disburse?userId=${user._id || user.id}`);
                                }}
                                className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-950 transition-colors cursor-pointer font-bold"
                              >
                                <RiCoinsLine size={15} className="text-emerald-600" />
                                <span>Disburse Earnings</span>
                              </button>

                              {/* 3. Edit User Info */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenu(null);
                                  handleOpenEditModal(user);
                                }}
                                className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors cursor-pointer font-medium"
                              >
                                <RiEditLine size={15} className="text-blue-500" />
                                <span>Edit User</span>
                              </button>

                              {/* 4. Shift Sponsor */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenu(null);
                                  setShiftModalUser(user);
                                  setTargetSponsorInput(user.referredBy || 'HORIZON-HQ');
                                }}
                                className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors cursor-pointer font-medium"
                              >
                                <RiNodeTree size={15} className="text-amber-600" />
                                <span>Shift Sponsor</span>
                              </button>

                              {/* 5. View Password */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenu(null);
                                  setPasswordModalUser(user);
                                  setModalShowPassword(false);
                                }}
                                className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors cursor-pointer font-medium"
                              >
                                <RiKeyLine size={15} className="text-indigo-500" />
                                <span>View Password</span>
                              </button>
                            </div>

                            {/* 6. Delete Action */}
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionMenu(null);
                                  setUserToDelete(user);
                                }}
                                className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer font-medium"
                              >
                                <RiDeleteBinLine size={15} className="text-rose-500" />
                                <span>Delete User</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-poppins">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RiUserLine size={32} className="text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No users found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {search.trim()
                          ? `No matching records found for "${search}". Try searching by user name, ID, phone number, or email.`
                          : 'No user accounts found under this filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ──────────────── 10 ITEMS PER PAGE PAGINATION BAR ──────────────── */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 120, behavior: 'smooth' });
          }}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* ──────────────── View User Details & Complete Investment Portfolio Slide-Over Drawer ──────────────── */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Investor Profile & Portfolio Data"
        subtitle={selectedUser ? `ID: ${selectedUser.customId || `HORIZON-USR-0${selectedUser.id}`} • ${selectedUser.country}` : ''}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              icon={<RiEditLine />}
              onClick={() => handleOpenEditModal(selectedUser)}
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              Edit Contact
            </Button>
            {selectedUser && selectedUser.status === 'Blocked' ? (
              <Button
                variant="secondary"
                onClick={() => handleToggleStatus(selectedUser, 'Active')}
                className="bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              >
                Unblock User
              </Button>
            ) : selectedUser && selectedUser.status === 'Active' ? (
              <Button
                variant="secondary"
                onClick={() => handleToggleStatus(selectedUser, 'Blocked')}
                className="bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                Block User
              </Button>
            ) : null}
            <Button
              variant="danger"
              icon={<RiDeleteBinLine />}
              onClick={() => {
                const u = selectedUser;
                setSelectedUser(null);
                setUserToDelete(u);
              }}
            >
              Delete User
            </Button>
            <Button variant="secondary" onClick={() => setSelectedUser(null)}>
              Close
            </Button>
          </>
        }
      >
        {selectedUser && (
          <div className="space-y-6 font-poppins">
            {/* Top Investor Header Banner */}
            <div className="p-5 bg-gradient-to-r from-gold-50/90 via-amber-50/40 to-white rounded-2xl border border-gold-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Large Round Circle Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-900 flex items-center justify-center shadow-gold flex-shrink-0 ring-4 ring-gold-200/60 font-poppins font-bold text-xl">
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 font-poppins leading-tight">{selectedUser.name}</h3>
                  <p className="text-xs font-medium text-gold-700 font-poppins mt-0.5">
                    {selectedUser.customId || `HORIZON-USR-0${selectedUser.id}`}
                  </p>
                  <p className="text-xs text-slate-500 font-poppins font-normal flex items-center gap-1.5">
                    <span>{selectedUser.email}</span>
                    <button
                      onClick={() => handleOpenEditModal(selectedUser)}
                      className="text-gold-700 hover:text-gold-900 text-[11px] font-semibold flex items-center gap-0.5 underline cursor-pointer"
                      title="Edit email or phone"
                    >
                      <RiEditLine size={12} /> Edit
                    </button>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 font-poppins">
                    <Badge variant={statusVariant(selectedUser.status)}>{selectedUser.status}</Badge>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-white text-slate-600 border border-slate-200 shadow-2xs">
                      <RiGlobalLine size={13} className="text-gold-600" /> {selectedUser.country}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-white text-slate-500 border border-slate-200 shadow-2xs">
                      <RiCalendarEventLine size={13} className="text-slate-400" /> Joined {selectedUser.joined}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-gold-200/70 sm:pl-6 space-y-2">
                <div>
                  <div className="flex items-center justify-end gap-1.5">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Contact Phone</p>
                    <button
                      onClick={() => handleOpenEditModal(selectedUser)}
                      className="text-gold-700 hover:text-gold-900 text-[10px] font-semibold flex items-center gap-0.5 underline cursor-pointer"
                      title="Edit phone"
                    >
                      <RiEditLine size={11} /> Edit
                    </button>
                  </div>
                  <p className="text-sm font-medium text-slate-700 font-poppins mt-0.5">{selectedUser.phone || '—'}</p>
                </div>
                <div className="pt-2 border-t border-gold-200/50">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Sponsor / Referred By</p>
                  <p className="text-xs font-semibold text-gold-800 font-poppins mt-0.5">{selectedUser.referredBy || 'Direct Platform'}</p>
                </div>
              </div>
            </div>

            {/* ──────────────── SECURITY, CREDENTIALS & HIERARCHY GOVERNANCE CARD ──────────────── */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-gold-400/30 text-white shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gold-400/10 text-gold-400 flex items-center justify-center border border-gold-400/30">
                    <RiShieldCheckLine size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
                      Credentials & Security Governance
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Client ID, Email, Password management, 2FA security & Hierarchy position
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gold-400/15 text-gold-300 border border-gold-400/30 uppercase tracking-wider">
                  Super Admin Exclusive
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs font-poppins">
                {/* 1. Client ID & Registered Email */}
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Login Identity
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-700">
                      <span className="text-slate-400 text-[11px]">User ID:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gold-400">{selectedUser.customId || `HORIZON-USR-0${selectedUser.id}`}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(selectedUser.customId || `HORIZON-USR-0${selectedUser.id}`);
                            toast.info('Copied User ID', 'Copied');
                          }}
                          className="text-slate-400 hover:text-white transition-colors"
                          title="Copy User ID"
                        >
                          <RiFileCopyLine size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-700">
                      <span className="text-slate-400 text-[11px]">Email:</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-medium text-slate-200 truncate max-w-[130px]">{selectedUser.email}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(selectedUser.email);
                            toast.info('Copied Email', 'Copied');
                          }}
                          className="text-slate-400 hover:text-white transition-colors"
                          title="Copy Email"
                        >
                          <RiFileCopyLine size={12} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(selectedUser)}
                          className="text-gold-400 hover:text-gold-300 transition-colors ml-0.5"
                          title="Edit user email, phone, name"
                        >
                          <RiEditLine size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Client Account Password (Eye View) */}
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      User Login Password
                    </p>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                      EYE VIEW
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-gold-300 tracking-wider select-all">
                        {drawerShowPassword ? (selectedUser.plainPassword || '••••••••') : '••••••••••••'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDrawerShowPassword(!drawerShowPassword)}
                          className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title={drawerShowPassword ? "Hide password" : "Show password"}
                        >
                          {drawerShowPassword ? <RiEyeOffLine size={14} /> : <RiEyeLine size={14} />}
                        </button>
                        {selectedUser.plainPassword && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(selectedUser.plainPassword);
                              toast.info('Copied user password', 'Copied');
                            }}
                            className="p-1 rounded text-slate-400 hover:text-gold-300 transition-colors cursor-pointer"
                            title="Copy password"
                          >
                            <RiFileCopyLine size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Hierarchy / Sponsor Position */}
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Downline Hierarchy
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-700">
                      <span className="text-slate-400 text-[11px]">Sponsor:</span>
                      <span className="font-semibold text-gold-400">{selectedUser.referredBy || 'Direct Platform'}</span>
                    </div>

                    <button
                      onClick={() => {
                        setShiftModalUser(selectedUser);
                        setTargetSponsorInput(selectedUser.referredBy || 'HORIZON-HQ');
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-[11px] transition-colors cursor-pointer"
                      title="Reassign sponsor / downline hierarchy internally"
                    >
                      <RiNodeTree size={13} />
                      <span>Shift Hierarchy Position</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ──────────────── INVESTMENT PORTFOLIO & WALLET BREAKDOWN ──────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 font-poppins">
                  <RiMoneyDollarCircleLine className="text-gold-600" size={16} />
                  Financial Portfolio & Earning Streams
                </h4>
                <button
                  type="button"
                  onClick={() => handleOpenAdjustModal(selectedUser)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-950 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <RiCoinsLine size={14} />
                  <span>Disburse / Adjust Wallet</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-poppins">
                {/* Total Invested */}
                <div className="p-3.5 bg-white rounded-xl border border-gold-200 shadow-2xs text-center">
                  <p className="text-[11px] text-slate-400 font-normal">Total Invested</p>
                  <p className="text-base font-semibold text-slate-800 font-poppins mt-0.5">
                    ${Number(selectedUser.totalInvested || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Total Profit Earned */}
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/70 shadow-2xs text-center">
                  <p className="text-[11px] text-emerald-700 font-normal">Total Profit Earned</p>
                  <p className="text-base font-semibold text-emerald-700 font-poppins mt-0.5">
                    +${Number(selectedUser.totalEarned || selectedUser.totalProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Total Earning Wallet */}
                <div className="p-3.5 bg-white rounded-xl border border-gold-300 shadow-2xs text-center">
                  <p className="text-[11px] text-slate-500 font-bold">Total Earning Wallet</p>
                  <p className="text-base font-bold text-emerald-700 font-poppins mt-0.5">
                    ${Number(selectedUser.earningWallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Deposit Wallet */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-center">
                  <p className="text-[11px] text-slate-400 font-normal">Deposit Wallet</p>
                  <p className="text-base font-semibold text-slate-800 font-poppins mt-0.5">
                    ${Number(selectedUser.depositWallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* 5 Earning Stream Sub-balances Box */}
              <div className="p-4 bg-gradient-to-br from-amber-50/50 via-white to-gold-50/30 rounded-2xl border border-gold-200 space-y-2.5 font-poppins">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Earning Wallet Sub-Balances Breakdown
                  </span>
                  <span className="text-[10px] text-slate-400">Available for User Withdrawal</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">PV ROI (Auto)</span>
                    <span className="font-extrabold text-slate-900 font-mono mt-0.5 block">
                      ${Number(selectedUser.pvRoiBalance || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Level Income (Auto)</span>
                    <span className="font-extrabold text-slate-900 font-mono mt-0.5 block">
                      ${Number(selectedUser.levelIncomeBalance || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-amber-200 bg-amber-50/30">
                    <span className="text-[10px] text-amber-800 font-bold block">Cash Reward</span>
                    <span className="font-extrabold text-slate-900 font-mono mt-0.5 block">
                      ${Number(selectedUser.rankRewardBalance || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-purple-200 bg-purple-50/30">
                    <span className="text-[10px] text-purple-800 font-bold block">Company Profit %</span>
                    <span className="font-extrabold text-slate-900 font-mono mt-0.5 block">
                      ${Number(selectedUser.companyProfitBalance || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-blue-200 bg-blue-50/30">
                    <span className="text-[10px] text-blue-800 font-bold block">Monthly Salary</span>
                    <span className="font-extrabold text-slate-900 font-mono mt-0.5 block">
                      ${Number(selectedUser.salaryBalance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ──────────────── ACTIVE INVESTMENT PLANS LIST ──────────────── */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center justify-between font-poppins">
                <span className="flex items-center gap-1.5">
                  <RiShieldFlashLine className="text-gold-600" size={16} />
                  Active Investment Plans ({selectedUser.activePlans?.length || 0})
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Real-time yields & lock-in terms</span>
              </h4>

              {loadingDetails ? (
                <div className="p-8 bg-slate-50/70 rounded-2xl border border-slate-200/70 text-center space-y-2.5">
                  <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-poppins">Fetching active investment holdings...</p>
                </div>
              ) : selectedUser.activePlans && selectedUser.activePlans.length > 0 ? (
                <div className="space-y-3 font-poppins">
                  {selectedUser.activePlans.map(plan => {
                    const isRenewable = plan.category === 'Renewable Energy';
                    return (
                      <div
                        key={plan.id}
                        className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-gold-300 transition-all space-y-3"
                      >
                        {/* Plan Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isRenewable ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {isRenewable ? <RiLeafLine size={18} /> : <RiCoinsLine size={18} />}
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-slate-800 font-poppins">{plan.name}</h5>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                isRenewable ? 'bg-emerald-100/70 text-emerald-800 border border-emerald-300/80' : 'bg-amber-100/70 text-amber-800 border border-amber-300/80'
                              }`}>
                                {plan.category}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-semibold text-emerald-600 font-poppins">
                              {plan.roi}
                            </span>
                            <p className="text-[10px] text-slate-400 font-normal">{plan.payoutMode}</p>
                          </div>
                        </div>

                        {/* Plan Specs Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs font-poppins">
                          <div>
                            <p className="text-[10px] text-slate-400 font-normal">Principal Invested</p>
                            <p className="font-semibold text-slate-700 font-poppins mt-0.5">{plan.invested}</p>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-400 font-normal">Stream Rate</p>
                            <p className="font-medium text-slate-600 font-poppins mt-0.5">{plan.streamRate}</p>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-400 font-normal">Duration</p>
                            <p className="font-medium text-slate-600 font-poppins mt-0.5">{plan.duration}</p>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-400 font-normal">Total Profit Earned</p>
                            <p className="font-semibold text-emerald-600 font-poppins mt-0.5">+{plan.earned}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center font-poppins">
                  <p className="text-xs text-slate-400 font-normal">No active investment plans found for this user.</p>
                </div>
              )}
            </div>

            {/* ──────────────── USER RECENT TRANSACTIONS TABLE (TOP 50 LATEST FIFO) ──────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3 font-poppins">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 font-poppins">
                    <RiExchangeDollarLine className="text-gold-600" size={16} />
                    User Transaction History
                  </h4>
                  <span className="text-[10px] font-medium text-gold-700 bg-gold-50 border border-gold-200/80 px-2 py-0.5 rounded-md shadow-2xs font-poppins">
                    Top 50 Latest (FIFO)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal">
                  Showing latest records • Auto-rolls oldest out
                </span>
              </div>

              {loadingDetails ? (
                <div className="p-8 bg-slate-50/70 rounded-2xl border border-slate-200/70 text-center space-y-2.5">
                  <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-poppins">Fetching user transaction history...</p>
                </div>
              ) : selectedUser.recentTransactions && selectedUser.recentTransactions.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs font-poppins">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-medium uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3 font-medium">Txn ID</th>
                        <th className="py-2.5 px-3 font-medium">Type</th>
                        <th className="py-2.5 px-3 font-medium">Amount</th>
                        <th className="py-2.5 px-3 font-medium">Date</th>
                        <th className="py-2.5 px-3 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedUser.recentTransactions.slice(0, 50).map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-600 font-poppins">{tx.id}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-700 font-poppins">
                            <span className="inline-flex items-center gap-1">
                              {tx.type === 'Deposit' && <RiArrowDownCircleLine className="text-emerald-500" size={14} />}
                              {tx.type === 'Withdrawal' && <RiArrowUpCircleLine className="text-amber-500" size={14} />}
                              {tx.type === 'ROI Return' && <RiFlashlightLine className="text-gold-500" size={14} />}
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 font-poppins">{tx.amount}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-normal font-poppins">{tx.date}</td>
                          <td className="py-2.5 px-3 text-right">
                            <Badge variant="success" size="sm">{tx.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center font-poppins">
                  <p className="text-xs text-slate-400 font-normal">No transaction records found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── Delete Confirmation Drawer / Modal ──────────────── */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Confirm User Deletion"
        subtitle="Permanent Action"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUserToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon={<RiDeleteBinLine />} onClick={handleDeleteUser}>
              Confirm Delete
            </Button>
          </>
        }
      >
        {userToDelete && (
          <div className="space-y-4 text-center py-2 font-poppins">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
              <RiAlertLine size={28} />
            </div>

            <div>
              <h4 className="text-base font-semibold text-slate-800 font-poppins">
                Are you sure you want to delete this user?
              </h4>
              <p className="text-sm text-slate-500 mt-1 font-normal font-poppins">
                User <strong className="text-slate-700 font-medium">{userToDelete.name}</strong> ({userToDelete.email}) with ID <strong className="text-gold-700 font-medium">{userToDelete.customId || `HORIZON-USR-0${userToDelete.id}`}</strong> will be permanently removed from the system.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── Shift Sponsor Hierarchy Modal (Silent Internal Move) ──────────────── */}
      <Modal
        isOpen={!!shiftModalUser}
        onClose={() => setShiftModalUser(null)}
        title="Shift Downline Sponsor Hierarchy"
        subtitle="Internal reassignment — Client is NOT notified"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShiftModalUser(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<RiNodeTree />}
              onClick={handleShiftSponsor}
              disabled={shifting || !targetSponsorInput.trim()}
              className="bg-gold-400 hover:bg-gold-500 text-slate-900 font-bold"
            >
              {shifting ? 'Shifting...' : 'Confirm Hierarchy Shift'}
            </Button>
          </>
        }
      >
        {shiftModalUser && (
          <div className="space-y-4 font-poppins text-xs">
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 flex items-start gap-2.5">
              <RiAlertLine className="text-amber-600 shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] leading-relaxed">
                <strong>Silent Internal Move:</strong> This shifts the investor under a new sponsor in the MLM / referral hierarchy tree.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Investor:</span>
                <span className="font-semibold text-slate-800">{shiftModalUser.name} ({shiftModalUser.customId || `HORIZON-USR-0${shiftModalUser.id}`})</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Current Sponsor:</span>
                <span className="font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
                  {shiftModalUser.referredBy || 'Direct Platform (HORIZON-HQ)'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Registered Email:</span>
                <span className="text-slate-700 font-medium">{shiftModalUser.email}</span>
              </div>
            </div>

            <form onSubmit={handleShiftSponsor} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                  New Target Sponsor ID *
                </label>
                <input
                  type="text"
                  value={targetSponsorInput}
                  onChange={(e) => setTargetSponsorInput(e.target.value)}
                  placeholder="Enter Sponsor Custom ID (e.g. HORIZON-HQ, HORIZON-USR-01)"
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none focus:border-gold-500 shadow-2xs"
                  required
                />
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">Quick suggestions:</span>
                <button
                  type="button"
                  onClick={() => setTargetSponsorInput('HORIZON-HQ')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-gold-50 text-slate-700 hover:text-gold-800 rounded-lg border border-slate-200 text-[11px] font-medium transition-colors"
                >
                  Direct Platform (HORIZON-HQ)
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ──────────────── View Client Credentials & Password Modal ──────────────── */}
      <Modal
        isOpen={!!passwordModalUser}
        onClose={() => setPasswordModalUser(null)}
        title="Client Account Credentials & Password"
        subtitle={passwordModalUser ? `${passwordModalUser.name} • ${passwordModalUser.customId || `HORIZON-USR-0${passwordModalUser.id}`}` : ''}
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setPasswordModalUser(null)}>
            Close
          </Button>
        }
      >
        {passwordModalUser && (
          <div className="space-y-4 font-poppins text-xs">
            <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-gold-400/30 text-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                  <RiKeyLine size={15} />
                  Investor Login Credentials
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 text-[10px] font-bold border border-gold-400/30">
                  Super Admin View
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                Super Admin can view registered client login credentials and user password below.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              {/* Name */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Investor Name:</span>
                <span className="font-bold text-slate-800 text-sm">{passwordModalUser.name}</span>
              </div>

              {/* User ID */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Client User ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gold-700 font-mono text-xs bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
                    {passwordModalUser.customId || `HORIZON-USR-0${passwordModalUser.id}`}
                  </span>
                  <button
                    onClick={() => {
                      const cid = passwordModalUser.customId || `HORIZON-USR-0${passwordModalUser.id}`;
                      navigator.clipboard?.writeText(cid);
                      toast.info(`Copied User ID: ${cid}`, 'Copied');
                    }}
                    className="p-1 text-slate-400 hover:text-gold-700 transition-colors cursor-pointer"
                    title="Copy User ID"
                  >
                    <RiFileCopyLine size={13} />
                  </button>
                </div>
              </div>

              {/* Email Address */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Registered Email:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-800 font-semibold">{passwordModalUser.email}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(passwordModalUser.email);
                      toast.info(`Copied Email: ${passwordModalUser.email}`, 'Copied');
                    }}
                    className="p-1 text-slate-400 hover:text-gold-700 transition-colors cursor-pointer"
                    title="Copy Email"
                  >
                    <RiFileCopyLine size={13} />
                  </button>
                </div>
              </div>

              {/* Contact Phone */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Contact Phone:</span>
                <span className="text-slate-700 font-medium">{passwordModalUser.phone || '—'}</span>
              </div>

              {/* Password Section with Eye Toggle */}
              <div className="pt-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  User Account Password (Eye View)
                </label>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gold-300 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                      {modalShowPassword ? (passwordModalUser.plainPassword || '••••••••') : '••••••••••••'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      modalShowPassword ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {modalShowPassword ? 'REVEALED' : 'HIDDEN'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setModalShowPassword(!modalShowPassword)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold-50 hover:bg-gold-100 text-gold-800 font-semibold text-xs border border-gold-200 transition-colors cursor-pointer"
                      title={modalShowPassword ? "Hide Password" : "Show Password"}
                    >
                      {modalShowPassword ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
                      <span>{modalShowPassword ? 'Hide' : 'Show Password'}</span>
                    </button>

                    {passwordModalUser.plainPassword && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(passwordModalUser.plainPassword);
                          toast.info('Copied password to clipboard', 'Password Copied');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                        title="Copy Password"
                      >
                        <RiFileCopyLine size={13} />
                        <span>Copy</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── Edit User Details & Contact Modal ──────────────── */}
      <Modal
        isOpen={!!editModalUser}
        onClose={() => setEditModalUser(null)}
        title="Edit User Contact & Credentials"
        subtitle={editModalUser ? `ID: ${editModalUser.customId || editModalUser.id} • Admin Control` : ''}
        size="md"
      >
        {editModalUser && (
          <form onSubmit={handleSaveUserEdit} className="space-y-4 font-poppins text-xs">
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <RiShieldCheckLine size={18} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-950">Super Admin Contact Governance</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Investors cannot alter their own email or phone number. Only administrators can update these credentials.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                placeholder="User Full Name"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Email Address *
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs font-mono"
                placeholder="investor@example.com"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">Must be unique across the platform.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Phone Number
              </label>
              <input
                type="text"
                value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs font-mono"
                placeholder="Phone Number (Optional)"
              />
              <p className="text-[10px] text-slate-400 mt-1">Include country dial code (e.g. +91, +1, +44). Leave blank if none.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={editForm.country}
                onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                placeholder="e.g. India, United States"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditModalUser(null)}
                disabled={savingUserEdit}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={savingUserEdit}
                className="bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold"
              >
                {savingUserEdit ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ──────────────── DISBURSE / ADJUST WALLET MODAL ──────────────── */}
      <Modal
        isOpen={!!adjustModalUser}
        onClose={() => {
          if (!adjustingWallet) setAdjustModalUser(null);
        }}
        title="Disburse Earnings / Adjust Wallet Balance"
        subtitle={adjustModalUser ? `${adjustModalUser.name} (${adjustModalUser.customId || adjustModalUser.email})` : ''}
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAdjustModalUser(null)}
              disabled={adjustingWallet}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={<RiCoinsLine />}
              onClick={handleSaveWalletAdjustment}
              loading={adjustingWallet}
            >
              Confirm Adjustment
            </Button>
          </>
        }
      >
        {adjustModalUser && (() => {
          const rankInfo = getUserRankConfig(adjustModalUser);
          return (
            <form onSubmit={handleSaveWalletAdjustment} className="space-y-4 font-poppins">
              {/* User Balances Strip */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-gold-50/50 rounded-2xl border border-gold-300 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Investor:</span>
                  <span className="font-bold text-slate-800">{adjustModalUser.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Current Rank:</span>
                  <span className="font-bold text-gold-900 bg-gold-200/80 px-2 py-0.5 rounded-md border border-gold-300 text-[11px]">
                    Tier {rankInfo.level}: {rankInfo.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Total Earning Wallet:</span>
                  <span className="font-extrabold text-emerald-700 font-mono">
                    ${Number(adjustModalUser.earningWallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Deposit Wallet:</span>
                  <span className="font-extrabold text-slate-800 font-mono">
                    ${Number(adjustModalUser.depositWallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Wallet / Income Stream Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Wallet / Income Stream *
                </label>
                <select
                  value={adjustForm.walletType}
                  onChange={(e) => handleWalletTypeChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-gold-400 shadow-2xs cursor-pointer"
                >
                  <optgroup label="Rank-Based Income Streams (Manual Admin Disbursal)">
                    <option value="rankReward">One Time Cash Reward ($)</option>
                    <option value="companyProfit">Company Profit %ge</option>
                    <option value="salary">Per Month Salary</option>
                  </optgroup>
                  <optgroup label="Capital Balance">
                    <option value="depositWallet">Deposit Wallet (Capital Balance)</option>
                  </optgroup>
                </select>
              </div>

              {/* 🎯 RANK-BASED AUTO-CALCULATION CARDS */}

              {/* 1. One Time Cash Reward Card */}
              {adjustForm.walletType === 'rankReward' && (() => {
                const eligibility = checkUserRankEligibility(adjustModalUser, rankInfo);
                return (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 font-poppins transition-all ${
                    eligibility.isEligible
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50/90 border-amber-300 text-amber-950'
                  }`}>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold flex items-center gap-1.5 text-xs">
                        <RiAwardLine className={eligibility.isEligible ? 'text-emerald-700' : 'text-amber-700'} size={17} />
                        <span>One Time Cash Reward Entitlement</span>
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white border border-slate-300 text-slate-800">
                          Tier {rankInfo.level}: {rankInfo.name}
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

                    {/* Standard Ladder Reward Line */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-xs">
                      <span className="text-slate-600 font-medium">Standard Ladder Reward:</span>
                      <span className="font-extrabold font-mono text-sm">
                        {eligibility.isEligible ? (
                          <span className="text-emerald-800 font-black">
                            ${rankInfo.reward.toLocaleString()} USD (Auto-filled)
                          </span>
                        ) : (
                          <span className="text-rose-700 font-black">
                            ${rankInfo.reward.toLocaleString()} USD (Not Auto-filled)
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Details / Checklist Box */}
                    {eligibility.isEligible ? (
                      <div className="p-2 rounded-lg bg-emerald-100/70 border border-emerald-300 text-[11px] text-emerald-900 space-y-0.5">
                        <p className="font-bold flex items-center gap-1">
                          <RiCheckLine className="text-emerald-700" size={14} />
                          Rank qualification confirmed! Criteria fulfilled:
                        </p>
                        <p className="text-[10.5px] text-emerald-800">
                          Own Deposit: ${eligibility.userOwnDeposit.toLocaleString()} / ${rankInfo.ownDeposit.toLocaleString()} • Turnover: ${eligibility.userTurnover.toLocaleString()} / ${rankInfo.totalClientDeposit.toLocaleString()} • Directs: {eligibility.userDirects} / {rankInfo.requiredDirects}
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
                              setAdjustForm(prev => ({
                                ...prev,
                                amount: String(rankInfo.reward || 100),
                                reason: `One Time Cash Reward ($${(rankInfo.reward || 100).toLocaleString()}) - ${rankInfo.name} Rank (Admin Override)`
                              }));
                            }}
                            className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded cursor-pointer transition-colors whitespace-nowrap"
                            title="Force fill ladder reward anyway"
                          >
                            ⚡ Force Fill ${rankInfo.reward.toLocaleString()}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 border-t border-amber-100 text-[10px] font-mono">
                          <div className={`px-2 py-1 rounded border ${eligibility.isOwnMet ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                            <div className="text-[9px] uppercase font-bold text-slate-500">Own Deposit</div>
                            <div className="font-bold">${eligibility.userOwnDeposit.toLocaleString()} / ${rankInfo.ownDeposit.toLocaleString()}</div>
                            <div>{eligibility.isOwnMet ? '✔ Met' : '❌ Pending'}</div>
                          </div>
                          <div className={`px-2 py-1 rounded border ${eligibility.isTurnoverMet ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                            <div className="text-[9px] uppercase font-bold text-slate-500">Client Turnover</div>
                            <div className="font-bold">${eligibility.userTurnover.toLocaleString()} / ${rankInfo.totalClientDeposit.toLocaleString()}</div>
                            <div>{eligibility.isTurnoverMet ? '✔ Met' : '❌ Pending'}</div>
                          </div>
                          <div className={`px-2 py-1 rounded border ${eligibility.isDirectsMet ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                            <div className="text-[9px] uppercase font-bold text-slate-500">Direct Clients</div>
                            <div className="font-bold">{eligibility.userDirects} / {rankInfo.requiredDirects} Directs</div>
                            <div>{eligibility.isDirectsMet ? '✔ Met' : '❌ Pending'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 2. Company Profit Share Card & Calculator */}
              {adjustForm.walletType === 'companyProfit' && (() => {
                const eligibility = checkUserRankEligibility(adjustModalUser, rankInfo);
                const isProfitRankEligible = rankInfo.profitPercent > 0;
                return (
                  <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-xs space-y-2.5 font-poppins">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-purple-950 flex items-center gap-1.5">
                        <RiPercentLine className="text-purple-700" size={16} />
                        <span>Company Profit Share Calculation</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-200 text-purple-900 border border-purple-300">
                          {rankInfo.name}: {rankInfo.profitPercent}%
                        </span>
                        {!isProfitRankEligible ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            Tier 6+ Required
                          </span>
                        ) : eligibility.isEligible ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✔ Eligible
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
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
                          onChange={(e) => handleCompanyProfitInputChange(e.target.value)}
                          placeholder="e.g. 100000"
                          className="w-full pl-7 pr-3 py-2 bg-white rounded-lg border border-purple-300 text-xs font-bold text-purple-950 font-mono outline-none focus:border-purple-500 shadow-2xs"
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
                            className="px-1.5 py-0.5 rounded bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-mono font-semibold cursor-pointer"
                          >
                            ${amt.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calculation formula display */}
                    {companyProfitInput && Number(companyProfitInput) > 0 && (
                      <div className="p-2 rounded-lg bg-white border border-purple-200 text-[11px] space-y-0.5">
                        <div className="flex justify-between text-slate-600">
                          <span>Calculation Formula:</span>
                          <span className="font-mono text-purple-900 font-bold">
                            ${Number(companyProfitInput).toLocaleString()} × {rankInfo.profitPercent}%
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-purple-100">
                          <span>Calculated Disbursal:</span>
                          <span className="font-mono text-emerald-700 text-xs font-black">
                            ${((Number(companyProfitInput) * rankInfo.profitPercent) / 100).toFixed(2)} USD {eligibility.isEligible ? '(Auto-filled below)' : '(Criteria pending - Not auto-filled)'}
                          </span>
                        </div>
                        {!eligibility.isEligible && isProfitRankEligible && (
                          <div className="pt-1.5 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const calculated = ((Number(companyProfitInput) * rankInfo.profitPercent) / 100).toFixed(2);
                                setAdjustForm(prev => ({
                                  ...prev,
                                  amount: String(Number(calculated)),
                                  reason: `Company Profit Share (${rankInfo.profitPercent}% of $${Number(companyProfitInput).toLocaleString()}) - ${rankInfo.name} Rank (Admin Override)`
                                }));
                              }}
                              className="text-[10px] font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              ⚡ Force Fill Calculated Amount (${((Number(companyProfitInput) * rankInfo.profitPercent) / 100).toFixed(2)})
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {!isProfitRankEligible && (
                      <p className="text-[10.5px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-relaxed">
                        ⚠️ Note: Rank "{rankInfo.name}" has <strong>0%</strong> profit share on the rank ladder (Profit sharing starts at Executive Director Tier 6 with 0.20%).
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* 3. Monthly Salary Card */}
              {adjustForm.walletType === 'salary' && (() => {
                const eligibility = checkUserRankEligibility(adjustModalUser, rankInfo);
                const isSalaryEligible = rankInfo.salary > 0;
                return (
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-1.5 font-poppins">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-semibold text-blue-950 flex items-center gap-1.5">
                        <RiBriefcaseLine className="text-blue-700" size={16} />
                        <span>Monthly Leadership Salary Entitlement</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-200 text-blue-900 border border-blue-300">
                          Tier {rankInfo.level}: {rankInfo.name}
                        </span>
                        {!isSalaryEligible ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            Tier 6+ Required
                          </span>
                        ) : eligibility.isEligible ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✔ Eligible
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
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
                            `$${rankInfo.salary.toLocaleString()} USD / Month (Auto-filled)`
                          ) : (
                            `$${rankInfo.salary.toLocaleString()} USD / Month (Not Auto-filled)`
                          )
                        ) : (
                          '$0 USD (Not eligible on rank ladder)'
                        )}
                      </span>
                    </div>
                    {!isSalaryEligible && (
                      <p className="text-[10.5px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-relaxed">
                        ⚠️ Note: Rank "{rankInfo.name}" has no fixed monthly salary on the ladder (Salary starts from Executive Director Tier 6 at $500/month).
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
                            setAdjustForm(prev => ({
                              ...prev,
                              amount: String(rankInfo.salary),
                              reason: `Per Month Salary ($${rankInfo.salary.toLocaleString()}) - ${rankInfo.name} Rank (Admin Override)`
                            }));
                          }}
                          className="text-[10px] font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 border border-blue-300 px-2 py-0.5 rounded cursor-pointer transition-colors whitespace-nowrap"
                        >
                          ⚡ Force Fill ${rankInfo.salary.toLocaleString()}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Action Type: Credit or Debit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Operation Action *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, action: 'credit' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      adjustForm.action === 'credit'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <RiArrowUpCircleLine size={16} className="text-emerald-600" />
                    <span>Credit (+) Add Funds</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, action: 'debit' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      adjustForm.action === 'debit'
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
                    Amount ($ USD) *
                  </label>
                  {(adjustForm.walletType === 'rankReward' || adjustForm.walletType === 'salary' || adjustForm.walletType === 'companyProfit') && (() => {
                    const elig = checkUserRankEligibility(adjustModalUser, rankInfo);
                    return elig.isEligible ? (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ⚡ Auto-filled (Rank Active)
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        ⚠️ Not Auto-filled (Rank In Progress)
                      </span>
                    );
                  })()}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="any"
                    value={adjustForm.amount}
                    onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                    placeholder="e.g. 500"
                    className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 font-mono outline-none focus:border-gold-400 shadow-2xs"
                    required
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Value is auto-filled based on rank rules, but you can manually edit or adjust as needed.
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason / Note (Visible to User)
                </label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. One Time Cash Reward - Team Leader Rank"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                />
              </div>
            </form>
          );
        })()}
      </Modal>
    </div>
  );
}
