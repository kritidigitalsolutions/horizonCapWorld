import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { RiMenuLine, RiSearchLine, RiUser3Line, RiLogoutBoxRLine, RiSettings3Line } from 'react-icons/ri';
import { UilAngleDown } from '@iconscout/react-unicons';
import NotificationDropdown from '../ui/NotificationDropdown';

const pageTitles = {
  '/': 'Dashboard',
  '/admin': 'Dashboard',
  '/admin/': 'Dashboard',
  '/admin/investment-plans': 'Investment Plans',
  '/admin/users': 'Users Management',
  '/admin/ranks': 'Rank Progression Ladder',
  '/admin/referrals': 'Referral Plans & Commissions',
  '/admin/transactions': 'Transactions',
  '/admin/support-tickets': 'Support Tickets & Helpdesk',
  '/admin/support-channels': 'Official Support Channels',
  '/admin/news-media': 'News & Media',
  '/admin/payment-settings': 'Payment Settings',
  '/admin/settings': 'Settings',
};

export default function Header({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [adminAvatar, setAdminAvatar] = useState(() => localStorage.getItem('horizon_admin_avatar') || '');
  const profileRef = useRef(null);

  // Get Admin Name & Email from localStorage
  const adminUser = (() => {
    try {
      const saved = localStorage.getItem('admin') || localStorage.getItem('adminUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const adminName = adminUser?.name || 'Super Admin';
  const adminEmail = adminUser?.email || 'admin@horizoncap.com';
  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for Avatar changes from Settings page
  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      const newAvatar = e.detail !== undefined ? e.detail : localStorage.getItem('horizon_admin_avatar');
      setAdminAvatar(newAvatar || '');
    };
    window.addEventListener('admin-avatar-change', handleAvatarUpdate);
    window.addEventListener('storage', handleAvatarUpdate);
    return () => {
      window.removeEventListener('admin-avatar-change', handleAvatarUpdate);
      window.removeEventListener('storage', handleAvatarUpdate);
    };
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    localStorage.removeItem('adminUser');
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gold-50 transition-colors text-gray-500 hover:text-gold-500 lg:hidden"
        >
          <RiMenuLine size={22} />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 font-display">{pageTitle}</h2>
          <p className="text-xs text-gray-400 hidden sm:block">Welcome back, {adminName}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Toggle (Mobile) */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gold-50 transition-colors text-gray-500 hover:text-gold-500 sm:hidden"
        >
          <RiSearchLine size={20} />
        </button>

        {/* Search Bar (Desktop) */}
        <div className="relative hidden sm:flex items-center">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <input
            type="text"
            placeholder="Search dashboard..."
            className="!pl-9 pr-4 py-2 w-48 lg:w-64 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-100 font-poppins transition-all"
          />
        </div>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gold-50 transition-colors cursor-pointer"
          >
            {/* Matching Round Circle Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-gold-200 shadow-gold flex-shrink-0 bg-slate-900">
              {adminAvatar ? (
                <img src={adminAvatar} alt={adminName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-900 font-bold flex items-center justify-center text-xs">
                  {adminName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{adminName}</p>
              <p className="text-[11px] text-gray-400">{adminEmail}</p>
            </div>
            <UilAngleDown size={18} className="text-gray-400 hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-slide-up overflow-hidden">
              <div className="p-3">
                <Link
                  to="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gold-50 hover:text-gold-600 transition-colors"
                >
                  <RiUser3Line size={18} />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gold-50 hover:text-gold-600 transition-colors"
                >
                  <RiSettings3Line size={18} />
                  <span>Settings</span>
                </Link>
              </div>
              <div className="border-t border-gray-100 p-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <RiLogoutBoxRLine size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-4 sm:hidden animate-slide-up">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search users, transactions..."
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gold-300 focus:ring-2 focus:ring-gold-100"
              onBlur={() => setSearchOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
}
