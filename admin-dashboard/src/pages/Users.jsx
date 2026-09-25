import React, { useState, useEffect, useCallback } from 'react';
import {
  RiEyeLine, RiDeleteBinLine, RiMailLine, RiPhoneLine,
  RiGlobalLine, RiCalendarEventLine, RiUserLine, RiAlertLine,
  RiMoneyDollarCircleLine, RiFlashlightLine, RiShieldFlashLine,
  RiLeafLine, RiCoinsLine, RiWallet3Line, RiArrowUpCircleLine,
  RiArrowDownCircleLine, RiExchangeDollarLine, RiPercentLine, RiTimeLine,
  RiCalendarCheckLine, RiGroupLine, RiCheckLine, RiCloseLine,
  RiKeyLine, RiNodeTree, RiFileCopyLine, RiShieldCheckLine, RiShieldLine,
  RiExchangeLine, RiEyeOffLine, RiLockPasswordLine, RiSparklingLine
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
  updateUserStatus,
  adjustUserWallet,
  deleteUser,
  markUsersSeen,
  shiftUserSponsor
} from '../api/usersApi';

export default function Users() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userList, setUserList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Shift Sponsor Modal State
  const [shiftModalUser, setShiftModalUser] = useState(null);
  const [targetSponsorInput, setTargetSponsorInput] = useState('');
  const [shifting, setShifting] = useState(false);

  // View Password State
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [modalShowPassword, setModalShowPassword] = useState(false);
  const [drawerShowPassword, setDrawerShowPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getAllUsers({
        limit: 'all',
      });

      if (res?.success && Array.isArray(res.users)) {
        const formatted = res.users.map(u => ({
          _id: u._id,
          id: u.customId || u._id,
          customId: u.customId || '',
          name: u.name || 'Investor',
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

  // Comprehensive Search across Name, Email, Phone, Country, ID, Date of Join, and Payout Type
  const filtered = userList.filter(user => {
    const q = search.trim().toLowerCase();
    if (!q) {
      const matchStatus = statusFilter === 'all' || user.status.toLowerCase() === statusFilter.toLowerCase();
      return matchStatus;
    }

    const userIdStr = (user.customId || `HORIZON-USR-0${user.id}`).toLowerCase();
    const nameStr = user.name.toLowerCase();
    const emailStr = user.email.toLowerCase();
    const phoneStr = user.phone.toLowerCase().replace(/[^0-9]/g, '');
    const searchPhoneNum = q.replace(/[^0-9]/g, '');
    const countryStr = user.country.toLowerCase();
    const joinedStr = user.joined.toLowerCase();
    const payoutStr = (user.payoutType || '').toLowerCase();
    const referredStr = (user.referredBy || '').toLowerCase();

    const matchSearch =
      nameStr.includes(q) ||
      emailStr.includes(q) ||
      userIdStr.includes(q) ||
      countryStr.includes(q) ||
      joinedStr.includes(q) ||
      payoutStr.includes(q) ||
      (searchPhoneNum && phoneStr.includes(searchPhoneNum));

    const matchStatus = statusFilter === 'all' || user.status.toLowerCase() === statusFilter.toLowerCase();
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
            placeholder="Search by name, email, phone, country, ID (HORIZON-USR-01), or join date..."
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
                          {user.name.split(' ').map(n => n[0]).join('')}
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

                    {/* Actions: View, Shift, Password Reset & Delete */}
                    <td className="text-right pr-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 font-poppins">
                        {/* View Button */}
                        <button
                          onClick={() => handleViewUser(user)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-gold-50 text-slate-700 hover:text-gold-800 text-xs font-semibold transition-all border border-slate-200/80 hover:border-gold-300 active:scale-95 shadow-2xs"
                          title="View user details & investment portfolio"
                        >
                          <RiEyeLine size={14} />
                          <span>View</span>
                        </button>

                        {/* Shift Hierarchy Button */}
                        <button
                          onClick={() => {
                            setShiftModalUser(user);
                            setTargetSponsorInput(user.referredBy || 'HORIZON-HQ');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-all border border-amber-200 hover:border-amber-300 active:scale-95 shadow-2xs"
                          title="Shift user hierarchy position internally"
                        >
                          <RiNodeTree size={14} />
                          <span>Shift</span>
                        </button>

                        {/* View Password & Credentials Button */}
                        <button
                          onClick={() => {
                            setPasswordModalUser(user);
                            setModalShowPassword(false);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all border border-indigo-200 hover:border-indigo-300 active:scale-95 shadow-2xs cursor-pointer"
                          title="View user login password and account credentials"
                        >
                          <RiKeyLine size={14} />
                          <span>Password</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="inline-flex items-center p-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-semibold transition-all border border-red-200/70 hover:border-red-300 active:scale-95 shadow-2xs"
                          title="Delete user"
                        >
                          <RiDeleteBinLine size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

        {filtered.length === 0 && (
          <div className="p-12 text-center font-poppins">
            <p className="text-slate-400 font-normal">No users found matching your search criteria.</p>
          </div>
        )}
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
                  <p className="text-xs text-slate-500 font-poppins font-normal">{selectedUser.email}</p>
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
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Contact Phone</p>
                  <p className="text-sm font-medium text-slate-700 font-poppins mt-0.5">{selectedUser.phone}</p>
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

            {/* ──────────────── INVESTMENT PORTFOLIO METRICS ──────────────── */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-poppins">
                <RiMoneyDollarCircleLine className="text-gold-600" size={16} />
                Financial Portfolio Summary
              </h4>

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

                {/* Wallet Balance */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-center">
                  <p className="text-[11px] text-slate-400 font-normal">Wallet Balance</p>
                  <p className="text-base font-semibold text-gold-600 font-poppins mt-0.5">
                    ${Number((selectedUser.depositWallet || 0) + (selectedUser.earningWallet || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Active Plans Count */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-center">
                  <p className="text-[11px] text-slate-400 font-normal">Active Plans</p>
                  <p className="text-base font-semibold text-slate-700 font-poppins mt-0.5">
                    {selectedUser.activePlans?.length || selectedUser.activeContracts || 0} Holdings
                  </p>
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
    </div>
  );
}
