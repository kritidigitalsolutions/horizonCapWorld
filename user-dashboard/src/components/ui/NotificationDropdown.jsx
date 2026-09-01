import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RiNotification3Line,
  RiCheckDoubleLine,
  RiFundsLine,
  RiExchangeDollarLine,
  RiTrophyLine,
  RiGiftLine,
  RiCustomerService2Line,
  RiShieldCheckLine,
  RiExternalLinkLine,
  RiBroadcastLine,
} from 'react-icons/ri';
import { useNavigate, Link } from 'react-router-dom';
import { getUserNotifications, markAllAsRead, markAsRead } from '../../api/notificationApi';

const iconMap = {
  EARNINGS: { icon: RiFundsLine, bg: 'bg-emerald-50 text-emerald-600' },
  REFERRAL: { icon: RiGiftLine, bg: 'bg-purple-50 text-purple-600' },
  RANK: { icon: RiTrophyLine, bg: 'bg-gold-50 text-gold-700' },
  FINANCIAL: { icon: RiExchangeDollarLine, bg: 'bg-blue-50 text-blue-600' },
  SUPPORT: { icon: RiCustomerService2Line, bg: 'bg-amber-50 text-amber-700' },
  SECURITY: { icon: RiShieldCheckLine, bg: 'bg-red-50 text-red-600' },
  BROADCAST: { icon: RiBroadcastLine, bg: 'bg-indigo-50 text-indigo-700' },
};

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await getUserNotifications({ limit: 6 });
      if (res?.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // Ignore background errors
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleItemClick = async (n) => {
    setOpen(false);
    try {
      if (!n.read) {
        await markAsRead(n._id);
        setNotifications(prev =>
          prev.map(item => (item._id === n._id ? { ...item, read: true } : item))
        );
        setUnreadCount(c => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Error marking read on click:', err);
    }

    if (n.actionUrl) {
      if (n.actionUrl.startsWith('http://') || n.actionUrl.startsWith('https://')) {
        window.open(n.actionUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(n.actionUrl);
      }
    } else {
      navigate('/notifications');
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gold-50 transition-colors text-gray-500 hover:text-gold-600 relative border border-gray-100 cursor-pointer"
        aria-label="Notifications"
      >
        <RiNotification3Line size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-slide-up font-poppins">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-gray-800 font-display">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-gold-600 hover:text-gold-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RiCheckDoubleLine size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.map((n) => {
              const IconData = iconMap[n.category] || iconMap.EARNINGS;
              const Icon = IconData.icon;
              return (
                <div
                  key={n._id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-gold-50/40 transition-colors cursor-pointer ${
                    !n.read ? 'bg-gold-50/20' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${IconData.bg}`}>
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No notifications in your feed. All caught up!
              </div>
            )}
          </div>

          <div className="p-2.5 text-center border-t border-gray-100 bg-slate-50/60 mt-1">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-gold-700 hover:text-gold-900 inline-flex items-center gap-1 transition-colors"
            >
              View All Notifications <RiExternalLinkLine size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
