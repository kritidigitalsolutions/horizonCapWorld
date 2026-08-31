import React, { useState, useRef, useEffect } from 'react';
import { RiNotification3Line, RiCheckDoubleLine } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { getRecentActivities } from '../../api/dashboardApi';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await getRecentActivities();
        if (res?.success) {
          const items = [];
          if (Array.isArray(res.recentTransactions)) {
            res.recentTransactions.forEach(t => {
              if (t.status === 'Pending') {
                items.push({
                  id: `txn-${t._id || t.customId}`,
                  title: `Pending Deposit Request`,
                  message: `${t.userName || 'Investor'} submitted $${Number(t.amount || 0).toLocaleString()} via ${t.gateway || 'Vault'}`,
                  time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
                  link: '/transactions',
                  read: false,
                });
              }
            });
          }
          if (res.openTicketsCount > 0) {
            items.push({
              id: 'tickets-open',
              title: `${res.openTicketsCount} Open Support Ticket(s)`,
              message: 'Client inquiries awaiting assistance in Helpdesk',
              time: 'Live',
              link: '/support-tickets',
              read: false,
            });
          }
          setNotifications(items);
        }
      } catch (err) {
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gold-50 transition-colors text-gray-500 hover:text-gold-500"
      >
        <RiNotification3Line size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-slide-up overflow-hidden font-poppins">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Notifications</h4>
            <span className="badge-gold badge text-xs">{unreadCount} new</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.map(n => (
              <Link
                key={n.id}
                to={n.link || '/'}
                onClick={() => setIsOpen(false)}
                className={`p-4 border-b border-gray-50 hover:bg-gold-50/50 transition-colors cursor-pointer block ${!n.read ? 'bg-gold-50/30' : ''}`}
              >
                <div className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read ? 'bg-gold-400' : 'bg-transparent'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                  </div>
                </div>
              </Link>
            ))}
            {notifications.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No new notifications. Everything is up to date.
              </div>
            )}
          </div>
          <div className="p-3 text-center border-t border-gray-100">
            <Link
              to="/transactions"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-gold-600 hover:text-gold-700 transition-colors"
            >
              View all transactions & activities
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
