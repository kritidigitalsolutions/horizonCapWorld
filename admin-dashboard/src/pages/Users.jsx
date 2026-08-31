import React, { useState, useEffect, useCallback } from 'react';
import {
  RiEyeLine, RiDeleteBinLine, RiMailLine, RiPhoneLine,
  RiGlobalLine, RiCalendarEventLine, RiUserLine, RiAlertLine,
  RiMoneyDollarCircleLine, RiFlashlightLine, RiShieldFlashLine,
  RiLeafLine, RiCoinsLine, RiWallet3Line, RiArrowUpCircleLine,
  RiArrowDownCircleLine, RiExchangeDollarLine, RiPercentLine, RiTimeLine,
  RiCalendarCheckLine, RiGroupLine, RiCheckLine, RiCloseLine
} from 'react-icons/ri';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import PageHeader from '../components/ui/PageHeader';
import {
  getAllUsers,
  updateUserStatus,
  adjustUserWallet,
  deleteUser
} from '../api/usersApi';

export default function Users() {
  const [loading, setLoading] = useState(true);
  const [userList, setUserList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getAllUsers({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
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
          recentTransactions: [],
        }));
        setUserList(formatted);
      } else {
        setUserList([]);
      }
    } catch (err) {
      console.warn('Error fetching users:', err.message);
      setUserList([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page to 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const statusVariant = (status) => status === 'Active' ? 'success' : 'danger';

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
    if (selectedUser?.id === user.id) {
      setSelectedUser(prev => ({ ...prev, status: nextStatus }));
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
            <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-xl font-medium text-xs shadow-2xs">
              {userList.filter(u => u.status === 'Active').length} Active Investors
            </span>
            <span className="px-3.5 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-medium text-xs shadow-2xs">
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
          <div className="flex gap-2 overflow-x-auto font-poppins">
            {['all', 'Active', 'Inactive'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-gold-400 text-slate-900 shadow-gold font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? 'All Users' : `${st} Users`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table font-poppins">
            <thead>
              <tr className="text-slate-400 font-medium text-xs tracking-wider">
                <th className="font-medium text-slate-500">User Details</th>
                <th className="font-medium text-slate-500">Email</th>
                <th className="font-medium text-slate-500">Mobile Number</th>
                <th className="font-medium text-slate-500">Referred By (Sponsor)</th>
                <th className="font-medium text-slate-500">Date of Join</th>
                <th className="font-medium text-slate-500">Country</th>
                <th className="font-medium text-slate-500">Payout Mode</th>
                <th className="font-medium text-slate-500">Status</th>
                <th className="text-right pr-6 font-medium text-slate-500">Action</th>
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
                          <p className="text-sm font-medium text-slate-700 truncate leading-tight font-poppins">
                            {user.name}
                          </p>
                          <p className="text-[11px] font-medium text-gold-600 font-poppins tracking-tight mt-0.5">
                            {userCustomId}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="text-xs font-normal text-slate-500 font-poppins">
                      {user.email}
                    </td>

                    {/* Mobile Number */}
                    <td className="text-xs font-medium text-slate-600 font-poppins whitespace-nowrap">
                      {user.phone}
                    </td>

                    {/* Referred By / Sponsor */}
                    <td>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-50/80 text-slate-700 text-xs font-medium border border-gold-200/80 whitespace-nowrap font-poppins">
                        <RiGroupLine size={13} className="text-gold-600" />
                        {user.referredBy || 'Direct Platform'}
                      </span>
                    </td>

                    {/* Date of Join */}
                    <td className="text-xs text-slate-500 font-normal font-poppins whitespace-nowrap">
                      {user.joined}
                    </td>

                    {/* Country */}
                    <td className="text-xs font-medium text-slate-600 font-poppins whitespace-nowrap">
                      {user.country}
                    </td>

                    {/* Active Payout Mode */}
                    <td>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-medium border border-slate-200/80 whitespace-nowrap font-poppins">
                        {user.payoutType || 'None'}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <Badge variant={statusVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </td>

                    {/* Actions: View & Delete */}
                    <td className="text-right pr-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 font-poppins">
                        {/* View Button */}
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-gold-50 text-slate-600 hover:text-gold-800 text-xs font-medium transition-all border border-slate-200/80 hover:border-gold-300 active:scale-95 shadow-2xs"
                          title="View user details & investment portfolio"
                        >
                          <RiEyeLine size={14} />
                          <span>View</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-medium transition-all border border-red-200/70 hover:border-red-300 active:scale-95 shadow-2xs"
                          title="Delete user"
                        >
                          <RiDeleteBinLine size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
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
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
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
                  <div className="flex items-center gap-2 mt-2 font-poppins">
                    <Badge variant={statusVariant(selectedUser.status)}>{selectedUser.status}</Badge>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-white text-slate-600 border border-slate-200 shadow-2xs">
                      <RiGlobalLine size={13} className="text-gold-600" /> {selectedUser.country}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-normal bg-white text-slate-500 border border-slate-200 shadow-2xs">
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
                    {selectedUser.totalInvested || '$0'}
                  </p>
                </div>

                {/* Total Profit Earned */}
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/70 shadow-2xs text-center">
                  <p className="text-[11px] text-emerald-700 font-normal">Total Profit Earned</p>
                  <p className="text-base font-semibold text-emerald-700 font-poppins mt-0.5">
                    {selectedUser.totalProfit || '$0'}
                  </p>
                </div>

                {/* Wallet Balance */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-center">
                  <p className="text-[11px] text-slate-400 font-normal">Wallet Balance</p>
                  <p className="text-base font-semibold text-gold-600 font-poppins mt-0.5">
                    {selectedUser.walletBalance || '$0'}
                  </p>
                </div>

                {/* Active Plans Count */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-center">
                  <p className="text-[11px] text-slate-400 font-normal">Active Plans</p>
                  <p className="text-base font-semibold text-slate-700 font-poppins mt-0.5">
                    {selectedUser.activePlans?.length || 0} Holdings
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

              {selectedUser.activePlans && selectedUser.activePlans.length > 0 ? (
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
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                isRenewable ? 'bg-emerald-100/70 text-emerald-800' : 'bg-amber-100/70 text-amber-800'
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

              {selectedUser.recentTransactions && selectedUser.recentTransactions.length > 0 ? (
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
    </div>
  );
}
