import React, { useState, useEffect, useCallback } from 'react';
import {
  RiNotification3Line,
  RiSendPlaneFill,
  RiCheckDoubleLine,
  RiDeleteBinLine,
  RiSearchLine,
  RiMoneyDollarCircleLine,
  RiCustomerService2Line,
  RiShieldCheckLine,
  RiBroadcastLine,
  RiTrophyLine,
  RiNewspaperLine,
  RiAlarmWarningLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiRefreshLine,
  RiUser3Line,
  RiGroupLine,
  RiCheckLine,
} from 'react-icons/ri';
import { Link } from 'react-router-dom';
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  deleteAdminNotification,
  clearAllAdminNotifications,
  sendPushNotification,
} from '../api/notificationApi';
import { getAllUsers } from '../api/usersApi';

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Alerts', icon: RiNotification3Line },
  { id: 'FINANCIAL', label: 'Financial & Vault', icon: RiMoneyDollarCircleLine },
  { id: 'SUPPORT', label: 'Support Helpdesk', icon: RiCustomerService2Line },
  { id: 'SECURITY', label: 'Security & Auth', icon: RiShieldCheckLine },
  { id: 'BROADCAST', label: 'Custom Push', icon: RiBroadcastLine },
  { id: 'NEWS', label: 'Platform News', icon: RiNewspaperLine },
  { id: 'RANK', label: 'Rank Milestones', icon: RiTrophyLine },
];

const categoryStyles = {
  FINANCIAL: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: RiMoneyDollarCircleLine },
  EARNINGS: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: RiMoneyDollarCircleLine },
  SUPPORT: { bg: 'bg-blue-50 text-blue-600 border-blue-200', icon: RiCustomerService2Line },
  SECURITY: { bg: 'bg-red-50 text-red-600 border-red-200', icon: RiShieldCheckLine },
  BROADCAST: { bg: 'bg-purple-50 text-purple-600 border-purple-200', icon: RiBroadcastLine },
  NEWS: { bg: 'bg-amber-50 text-amber-600 border-amber-200', icon: RiNewspaperLine },
  RANK: { bg: 'bg-gold-50 text-gold-700 border-gold-300', icon: RiTrophyLine },
  REFERRAL: { bg: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: RiGroupLine },
  SYSTEM: { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: RiNotification3Line },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [readFilter, setReadFilter] = useState('ALL'); // 'ALL' | 'false' | 'true'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Push Notification Modal State
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [pushSubmitting, setPushSubmitting] = useState(false);
  const [pushSuccess, setPushSuccess] = useState('');
  const [pushError, setPushError] = useState('');
  const [pushForm, setPushForm] = useState({
    targetType: 'ALL', // 'ALL' | 'USER' | 'RANK'
    targetValue: '',
    title: '',
    message: '',
    category: 'BROADCAST',
    priority: 'NORMAL',
    actionUrl: '',
  });

  // User Selection State for Specific Investor
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserObj, setSelectedUserObj] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminNotifications({
        category: activeCategory !== 'ALL' ? activeCategory : undefined,
        isRead: readFilter !== 'ALL' ? readFilter : undefined,
        search: searchQuery.trim() || undefined,
        page,
        limit: 15,
      });

      if (res?.success) {
        setNotifications(res.notifications || []);
        setTotalCount(res.total || 0);
        setUnreadCount(res.unreadCount || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load admin notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, readFilter, searchQuery, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Load Users List for Specific Investor selection
  const fetchAllInvestors = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await getAllUsers({ limit: 500 });
      if (res?.success && Array.isArray(res.users)) {
        setUsersList(res.users);
      }
    } catch (err) {
      console.error('Failed to load investors for notification targeting:', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPushModalOpen && usersList.length === 0) {
      fetchAllInvestors();
    }
  }, [isPushModalOpen, usersList.length, fetchAllInvestors]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAdminNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAdminNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAdminNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setTotalCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications from platform history?')) return;
    try {
      await clearAllAdminNotifications();
      setNotifications([]);
      setTotalCount(0);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const handleSelectInvestor = (user) => {
    setSelectedUserObj(user);
    setPushForm(prev => ({ ...prev, targetValue: user.email || user.customId || user._id }));
    setUserSearchTerm('');
  };

  const handleRemoveSelectedInvestor = () => {
    setSelectedUserObj(null);
    setPushForm(prev => ({ ...prev, targetValue: '' }));
  };

  const handleSendPush = async (e) => {
    e.preventDefault();
    setPushError('');
    setPushSuccess('');

    if (!pushForm.title.trim() || !pushForm.message.trim()) {
      setPushError('Please provide both notification title and message.');
      return;
    }
    if (pushForm.targetType === 'USER' && !pushForm.targetValue.trim()) {
      setPushError('Please select a target investor from the list.');
      return;
    }

    setPushSubmitting(true);
    try {
      const res = await sendPushNotification(pushForm);
      if (res?.success) {
        setPushSuccess(res.message || 'Push notification dispatched successfully!');
        setTimeout(() => {
          setIsPushModalOpen(false);
          setPushSuccess('');
          setSelectedUserObj(null);
          setPushForm({
            targetType: 'ALL',
            targetValue: '',
            title: '',
            message: '',
            category: 'BROADCAST',
            priority: 'NORMAL',
            actionUrl: '',
          });
          fetchNotifications();
        }, 1200);
      } else {
        setPushError(res?.message || 'Failed to dispatch push notification.');
      }
    } catch (err) {
      setPushError(err.response?.data?.message || err.message || 'Error sending push notification.');
    } finally {
      setPushSubmitting(false);
    }
  };

  const filteredInvestors = usersList.filter(u => {
    if (!userSearchTerm.trim()) return true;
    const term = userSearchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.customId && u.customId.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in font-poppins pb-12">
      {/* Top Banner & Push Notification CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gold-400 text-slate-950">
              Activity Hub
            </span>
            <span className="text-xs text-slate-400">• Real-Time Automated & Custom Alerts</span>
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-white">
            Platform Notifications & Alerts
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Monitor automated system activity, pending transaction events, investor support requests, and broadcast custom push announcements to all or targeted investors.
          </p>
        </div>

        {/* Action Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setIsPushModalOpen(true);
              setPushError('');
              setPushSuccess('');
            }}
            className="btn btn-primary px-5 py-3 rounded-2xl font-bold text-xs shadow-gold flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <RiSendPlaneFill size={16} /> Broadcast Push Notification
          </button>
          <button
            onClick={fetchNotifications}
            className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RiRefreshLine size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 border border-slate-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gold-50 text-gold-700 border border-gold-200 flex items-center justify-center flex-shrink-0">
            <RiNotification3Line size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Alerts</p>
            <p className="text-xl font-extrabold text-slate-800 font-display">{totalCount}</p>
          </div>
        </div>

        <div className="card p-4 border border-slate-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center flex-shrink-0">
            <RiAlarmWarningLine size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unread Alerts</p>
            <p className="text-xl font-extrabold text-amber-600 font-display">{unreadCount}</p>
          </div>
        </div>

        <div className="card p-4 border border-slate-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0">
            <RiMoneyDollarCircleLine size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Financial Alerts</p>
            <p className="text-xl font-extrabold text-emerald-600 font-display">Active</p>
          </div>
        </div>

        <div className="card p-4 border border-slate-100 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center flex-shrink-0">
            <RiBroadcastLine size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Broadcasts</p>
            <p className="text-xl font-extrabold text-purple-600 font-display">Ready</p>
          </div>
        </div>
      </div>

      {/* Main Notification Card Container */}
      <div className="card p-6 border border-slate-200/80 space-y-5">
        {/* Controls Bar: Category Tabs, Search, Filter & Bulk Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCategory(tab.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search alerts..."
                className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-200 w-44"
              />
            </div>

            {/* Read Filter */}
            <select
              value={readFilter}
              onChange={(e) => {
                setReadFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-gold-400"
            >
              <option value="ALL">All Status</option>
              <option value="false">Unread Only</option>
              <option value="true">Read Only</option>
            </select>

            {/* Bulk Buttons */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-2 rounded-xl bg-gold-50 border border-gold-200 hover:bg-gold-100 text-gold-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RiCheckDoubleLine size={14} /> Mark All Read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RiDeleteBinLine size={14} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse font-medium">
            Loading activity notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <RiNotification3Line size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No Notifications Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no activity records matching your current filter criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const catConfig = categoryStyles[n.category] || categoryStyles.SYSTEM;
              const Icon = catConfig.icon;

              return (
                <div
                  key={n._id}
                  className={`py-4 px-3 sm:px-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    !n.read ? 'bg-gold-50/20 border-l-4 border-gold-400' : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Left: Icon & Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-2xs ${catConfig.bg}`}>
                      <Icon size={18} />
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-poppins">{n.title}</span>
                        {!n.read && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800 tracking-wider">
                            New
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                          {n.category}
                        </span>
                        {n.recipientType && n.recipientType !== 'ADMIN' && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                            {n.recipientType === 'ALL_USERS' ? 'Broadcast' : n.recipientType}
                          </span>
                        )}
                        {n.priority === 'URGENT' && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-red-100 text-red-700 border border-red-200">
                            Urgent
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed break-words">{n.message}</p>

                      <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-slate-400">
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                        {n.actionUrl && (
                          <Link
                            to={n.actionUrl}
                            className="text-gold-700 hover:text-gold-900 font-semibold inline-flex items-center gap-1 hover:underline"
                          >
                            Open Link <RiExternalLinkLine size={12} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 self-end sm:self-center flex-shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n._id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Mark as read"
                      >
                        <RiCheckDoubleLine size={14} /> Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n._id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete alert"
                    >
                      <RiDeleteBinLine size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total alerts)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────── BROADCAST PUSH NOTIFICATION MODAL ──────────────── */}
      {isPushModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-poppins">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gold-400 text-slate-950 flex items-center justify-center font-bold">
                  <RiSendPlaneFill size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Broadcast Push Notification</h3>
                  <p className="text-[11px] text-slate-300">Deliver custom alerts directly to investors' dashboards</p>
                </div>
              </div>
              <button
                onClick={() => setIsPushModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSendPush} className="p-6 space-y-4 overflow-y-auto text-xs">
              {pushError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold animate-slide-up">
                  {pushError}
                </div>
              )}
              {pushSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold animate-slide-up">
                  {pushSuccess}
                </div>
              )}

              {/* Target Audience Selector */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Audience *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ALL', label: 'All Investors', icon: RiGroupLine },
                    { id: 'RANK', label: 'Specific Rank', icon: RiTrophyLine },
                    { id: 'USER', label: 'Specific Investor', icon: RiUser3Line },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = pushForm.targetType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setPushForm({ ...pushForm, targetType: t.id, targetValue: '' });
                          setSelectedUserObj(null);
                        }}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-gold-50 border-gold-400 text-gold-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-[11px]">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Rank Target Input */}
              {pushForm.targetType === 'RANK' && (
                <div className="animate-slide-up">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Target Rank Milestone *
                  </label>
                  <select
                    required
                    value={pushForm.targetValue}
                    onChange={(e) => setPushForm({ ...pushForm, targetValue: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-gold-400"
                  >
                    <option value="">-- Choose Rank --</option>
                    <option value="Starter">Starter (Level 1)</option>
                    <option value="Bronze">Bronze (Level 2)</option>
                    <option value="Silver">Silver (Level 3)</option>
                    <option value="Gold">Gold (Level 4)</option>
                    <option value="Platinum">Platinum (Level 5)</option>
                    <option value="Diamond">Diamond (Level 6)</option>
                    <option value="Crown Diamond">Crown Diamond (Level 7)</option>
                    <option value="Director">Director (Level 8)</option>
                    <option value="Executive Director">Executive Director (Level 9)</option>
                    <option value="President">President (Level 10)</option>
                  </select>
                </div>
              )}

              {/* Specific User Target Selector (Showing Name and Email) */}
              {pushForm.targetType === 'USER' && (
                <div className="animate-slide-up space-y-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Select Specific Investor *
                  </label>

                  {/* If user is already selected, display card */}
                  {selectedUserObj ? (
                    <div className="p-3 bg-gold-50 border border-gold-300 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold-400 text-slate-950 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                          {selectedUserObj.name ? selectedUserObj.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{selectedUserObj.name}</p>
                          <p className="text-[11px] text-slate-600">{selectedUserObj.email}</p>
                          <span className="text-[10px] font-mono text-gold-800">{selectedUserObj.customId || selectedUserObj._id}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveSelectedInvestor}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    /* Searchable User Dropdown List */
                    <div className="space-y-2">
                      <div className="relative">
                        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          placeholder="Search investor by full name, email or custom ID..."
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-gold-400 text-xs"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white shadow-2xs">
                        {usersLoading ? (
                          <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
                            Loading investor directory...
                          </div>
                        ) : filteredInvestors.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No investors found matching "{userSearchTerm}".
                          </div>
                        ) : (
                          filteredInvestors.slice(0, 30).map((u) => (
                            <div
                              key={u._id}
                              onClick={() => handleSelectInvestor(u)}
                              className="p-2.5 flex items-center justify-between hover:bg-gold-50/60 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 text-xs truncate">{u.name}</p>
                                  <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded-md border border-gold-200 flex-shrink-0 ml-2">
                                {u.customId || 'User'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  value={pushForm.title}
                  onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })}
                  placeholder="e.g. Special Yield Bonus Announcement"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-gold-400"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={pushForm.category}
                    onChange={(e) => setPushForm({ ...pushForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-gold-400"
                  >
                    <option value="BROADCAST">Broadcast</option>
                    <option value="FINANCIAL">Financial & Vault</option>
                    <option value="NEWS">Platform News</option>
                    <option value="SECURITY">Security Alert</option>
                    <option value="RANK">Rank & Rewards</option>
                    <option value="SUPPORT">Support</option>
                    <option value="SYSTEM">System Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={pushForm.priority}
                    onChange={(e) => setPushForm({ ...pushForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-gold-400"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent Alert</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              {/* Action URL */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Action Link URL (Optional)
                </label>
                <input
                  type="text"
                  value={pushForm.actionUrl}
                  onChange={(e) => setPushForm({ ...pushForm, actionUrl: e.target.value })}
                  placeholder="e.g. /plans or /transactions or https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-gold-400"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notification Message Body *
                </label>
                <textarea
                  required
                  rows={4}
                  value={pushForm.message}
                  onChange={(e) => setPushForm({ ...pushForm, message: e.target.value })}
                  placeholder="Write clear, informative message text for the recipients..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-gold-400 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPushModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pushSubmitting}
                  className="btn btn-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-gold"
                >
                  {pushSubmitting ? (
                    'Broadcasting...'
                  ) : (
                    <>
                      <RiSendPlaneFill size={15} /> Send Broadcast Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
