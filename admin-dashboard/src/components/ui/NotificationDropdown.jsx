import React, { useState, useRef, useEffect } from 'react';
import { RiNotification3Line } from 'react-icons/ri';
import { notifications } from '../../data/mockData';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
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
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-slide-up overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Notifications</h4>
            <span className="badge-gold badge text-xs">{unreadCount} new</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-4 border-b border-gray-50 hover:bg-gold-50/50 transition-colors cursor-pointer ${!n.read ? 'bg-gold-50/30' : ''}`}
              >
                <div className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read ? 'bg-gold-400' : 'bg-transparent'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 text-center border-t border-gray-100">
            <button className="text-sm font-medium text-gold-500 hover:text-gold-600 transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
