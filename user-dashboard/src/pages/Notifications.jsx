import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../api/notificationApi';
import {
  RiNotification3Line as RiBell,
  RiFundsLine as RiYield,
  RiExchangeDollarLine as RiTxn,
  RiGiftLine as RiRef,
  RiTrophyLine as RiRank,
  RiCustomerService2Line as RiHelp,
  RiShieldCheckLine as RiSecurity,
  RiBroadcastLine as RiMegaphone,
  RiNewspaperLine as RiNews,
  RiCheckDoubleLine as RiCheckAll,
  RiDeleteBinLine as RiTrash,
  RiExternalLinkLine as RiLink,
  RiRefreshLine as RiSync,
} from 'react-icons/ri';

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Notifications', icon: RiBell },
  { id: 'FINANCIAL', label: 'Vault & Investments', icon: RiTxn },
  { id: 'EARNINGS', label: 'Live ROI Yield', icon: RiYield },
  { id: 'REFERRAL', label: 'Network & Bonuses', icon: RiRef },
  { id: 'RANK', label: 'Rank Milestones', icon: RiRank },
  { id: 'SUPPORT', label: 'Support Inquiries', icon: RiHelp },
  { id: 'SECURITY', label: 'Security & Auth', icon: RiSecurity },
  { id: 'NEWS', label: 'News & Media', icon: RiNews },
  { id: 'BROADCAST', label: 'Platform Broadcasts', icon: RiMegaphone },
];

const categoryConfig = {
  FINANCIAL: { bg: 'bg-blue-50 text-blue-600 border-blue-200', icon: RiTxn },
  EARNINGS: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: RiYield },
  REFERRAL: { bg: 'bg-purple-50 text-purple-600 border-purple-200', icon: RiRef },
  RANK: { bg: 'bg-gold-50 text-gold-700 border-gold-300', icon: RiRank },
  SUPPORT: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: RiHelp },
  SECURITY: { bg: 'bg-red-50 text-red-600 border-red-200', icon: RiSecurity },
  NEWS: { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: RiNews },
  BROADCAST: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: RiMegaphone },
  SYSTEM: { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: RiBell },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [readFilter, setReadFilter] = useState('ALL'); // 'ALL' | 'false' | 'true'
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserNotifications({
        category: activeCategory !== 'ALL' ? activeCategory : undefined,
        isRead: readFilter !== 'ALL' ? readFilter : undefined,
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
      console.error('Failed to load user notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, readFilter, page]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setTotalCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications from your notification feed?')) return;
    try {
      await clearAllNotifications();
      setNotifications([]);
      setTotalCount(0);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-poppins pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gold-400 text-slate-950">
              Notification Feed
            </span>
            <span className="text-xs text-slate-400">• Real-Time Account & Market Alerts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Stay updated with your daily ROI streaming settlements, vault deposit approvals, network commission credits, rank advancements, and official company announcements.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={fetchAlerts}
            className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-colors cursor-pointer"
            title="Refresh Feed"
          >
            <RiSync size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="card p-6 border border-slate-100 shadow-card space-y-5">
        {/* Filter Navigation Bar */}
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
          <div className="flex items-center gap-2.5 self-end lg:self-center">
            {/* Status Filter */}
            <select
              value={readFilter}
              onChange={(e) => {
                setReadFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-gold-400"
            >
              <option value="ALL">All Alerts</option>
              <option value="false">Unread Only</option>
              <option value="true">Read Only</option>
            </select>

            {unreadCount > 0 && (
              <button
                onClick={handleReadAll}
                className="px-3 py-2 rounded-xl bg-gold-50 border border-gold-200 hover:bg-gold-100 text-gold-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RiCheckAll size={14} /> Mark All Read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RiTrash size={14} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Notifications Stream */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse font-medium">
            Fetching latest notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <RiBell size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No Notifications in Feed</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You're all caught up! New account transactions, commission alerts, and platform news will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const cfg = categoryConfig[n.category] || categoryConfig.SYSTEM;
              const Icon = cfg.icon;

              return (
                <div
                  key={n._id}
                  className={`py-4 px-3 sm:px-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    !n.read ? 'bg-gold-50/20 border-l-4 border-gold-400' : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Left Icon & Information */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-2xs ${cfg.bg}`}>
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
                        {n.priority === 'URGENT' && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-red-100 text-red-700 border border-red-200">
                            High Alert
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
                            View Details <RiLink size={12} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 self-end sm:self-center flex-shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => handleRead(n._id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Mark as read"
                      >
                        <RiCheckAll size={14} /> Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n._id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Dismiss alert"
                    >
                      <RiTrash size={15} />
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
    </div>
  );
}
