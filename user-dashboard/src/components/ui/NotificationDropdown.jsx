import React, { useState, useRef, useEffect } from 'react';
import { RiNotification3Line, RiCheckDoubleLine, RiFundsLine, RiExchangeDollarLine, RiTrophyLine, RiGiftLine } from 'react-icons/ri';
import { UilAngleRight } from '@iconscout/react-unicons';

const initialNotifications = [
  { id: 1, type: 'earning', title: 'Daily ROI Credited', desc: '+$16.20 added to your Earning Wallet from Solar Starter', time: '10 min ago', read: false },
  { id: 2, type: 'referral', title: 'New Direct Referral', desc: 'Priya Singh registered using your affiliate link', time: '1 hour ago', read: false },
  { id: 3, type: 'rank', title: 'Rank Milestone Progress', desc: 'You are $3,250 turnover away from Platinum Rank', time: '3 hours ago', read: false },
  { id: 4, type: 'withdrawal', title: 'Withdrawal Clearance', desc: 'Withdrawal TXN-78425 of $300 has cleared on USDT TRC20', time: '1 day ago', read: true },
];

const iconMap = {
  earning: { icon: RiFundsLine, bg: 'bg-emerald-50 text-emerald-600' },
  referral: { icon: RiGiftLine, bg: 'bg-purple-50 text-purple-600' },
  rank: { icon: RiTrophyLine, bg: 'bg-gold-50 text-gold-600' },
  withdrawal: { icon: RiExchangeDollarLine, bg: 'bg-blue-50 text-blue-600' },
};

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const ref = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gold-50 transition-colors text-gray-500 hover:text-gold-600 relative border border-gray-100"
        aria-label="Notifications"
      >
        <RiNotification3Line size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-slide-up">
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
                onClick={markAllAsRead}
                className="text-xs text-gold-600 hover:text-gold-700 font-semibold flex items-center gap-1"
              >
                <RiCheckDoubleLine size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.map((n) => {
              const IconData = iconMap[n.type] || iconMap.earning;
              const Icon = IconData.icon;
              return (
                <div
                  key={n.id}
                  className={`p-3.5 flex items-start gap-3 hover:bg-gold-50/40 transition-colors cursor-pointer ${
                    !n.read ? 'bg-gold-50/20' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${IconData.bg}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 font-poppins">{n.title}</p>
                    <p className="text-xs text-gray-500 font-poppins mt-0.5 leading-snug">{n.desc}</p>
                    <span className="text-[10px] text-gray-400 font-poppins mt-1 block">{n.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
