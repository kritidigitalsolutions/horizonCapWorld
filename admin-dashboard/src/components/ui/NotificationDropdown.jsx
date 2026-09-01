import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RiNotification3Line, RiCheckDoubleLine, RiExternalLinkLine } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { getAdminNotifications, markAllAdminNotificationsRead } from '../../api/notificationApi';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await getAdminNotifications({ limit: 6 });
      if (res?.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // Ignore network errors on background poll
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllAdminNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gold-50 transition-colors text-gray-500 hover:text-gold-500 cursor-pointer"
        aria-label="Notifications"
      >
        <RiNotification3Line size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-slide-up overflow-hidden font-poppins">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-800 text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <span className="badge-gold badge text-[10px] px-2 py-0.5">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-gold-600 hover:text-gold-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RiCheckDoubleLine size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.map(n => (
              <Link
                key={n._id}
                to={n.actionUrl || '/admin/notifications'}
                onClick={() => setIsOpen(false)}
                className={`p-3.5 hover:bg-gold-50/50 transition-colors cursor-pointer block ${
                  !n.read ? 'bg-gold-50/30' : ''
                }`}
              >
                <div className="flex gap-3 items-start">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      !n.read ? 'bg-gold-500' : 'bg-transparent'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {notifications.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No notifications right now. All caught up!
              </div>
            )}
          </div>

          <div className="p-3 text-center border-t border-gray-100 bg-slate-50/60">
            <Link
              to="/admin/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-gold-700 hover:text-gold-900 inline-flex items-center gap-1.5 transition-colors"
            >
              View Full Notifications History <RiExternalLinkLine size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
