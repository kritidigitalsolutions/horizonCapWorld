import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { RiMenuLine, RiMenuFoldLine, RiMenuUnfoldLine, RiSearchLine, RiUser3Line, RiLogoutBoxRLine, RiSettings3Line, RiCalculatorLine } from 'react-icons/ri';
import { UilAngleDown } from '@iconscout/react-unicons';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../ui/NotificationDropdown';

const pageTitles = {
  '/': 'Dashboard',
  '/plans': 'Investment Plans',
  '/investments': 'My Investments',
  '/ranks': 'Rank Progression Ladder',
  '/referrals': 'Referral Network',
  '/referral-plans': 'Referral Plans & Tiers',
  '/deposit': 'Deposit Capital',
  '/withdraw': 'Withdraw Funds',
  '/transactions': 'Transaction History',
  '/notifications': 'Notifications',
  '/support': 'Support & Helpdesk',
  '/news': 'News & Insights',
  '/profile': 'My Profile',
};

export default function Header({ onMenuToggle, onOpenCalculator, isSidebarOpen = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('horizon_user_avatar') || user?.avatar || '');
  const profileRef = useRef(null);

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

  // Sync avatar changes live across components
  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      const newAvatar = e.detail !== undefined ? e.detail : (localStorage.getItem('horizon_user_avatar') || user?.avatar || '');
      setUserAvatar(newAvatar || '');
    };
    window.addEventListener('user-avatar-change', handleAvatarUpdate);
    window.addEventListener('storage', handleAvatarUpdate);
    return () => {
      window.removeEventListener('user-avatar-change', handleAvatarUpdate);
      window.removeEventListener('storage', handleAvatarUpdate);
    };
  }, [user?.avatar]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onMenuToggle}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-gold-50 transition-all text-gray-600 hover:text-gold-600 border border-gray-200/80 shadow-2xs cursor-pointer active:scale-95"
          title={isSidebarOpen ? "Collapse Sidebar (More Workspace)" : "Expand Sidebar"}
        >
          {isSidebarOpen ? <RiMenuFoldLine size={20} /> : <RiMenuUnfoldLine size={20} />}
        </button>
        <div>
          <h2 className="text-base sm:text-xl font-bold text-gray-800 font-display leading-tight">{pageTitle}</h2>
          <p className="text-[11px] sm:text-xs text-gray-400 hidden sm:block">Welcome back, {user?.fullName || 'Investor'}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Profit Calculator Quick Button */}
        {onOpenCalculator && (
          <button
            onClick={onOpenCalculator}
            className="btn btn-outline-gold text-xs px-3 py-2 rounded-xl hidden md:inline-flex items-center gap-1.5 font-bold shadow-xs"
            title="Open Profit Calculator"
          >
            <RiCalculatorLine size={16} /> Calculator
          </button>
        )}

        {/* Search Bar (Desktop) */}
        <div className="relative hidden sm:flex items-center">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <input
            type="text"
            placeholder="Search portal..."
            className="!pl-9 pr-4 py-2 w-40 lg:w-56 bg-slate-50 border border-gray-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-100 font-poppins transition-all"
          />
        </div>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gold-50 transition-colors"
          >
            {/* Light Gold Round Circle Avatar (Matching Super Admin) */}
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-gold-200 shadow-gold flex-shrink-0 bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-950 font-bold text-xs font-poppins">
              {userAvatar ? (
                <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.fullName?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-gray-800 leading-tight font-poppins">{user?.fullName || 'Investor'}</p>
              <p className="text-[10px] text-gold-600 font-semibold font-poppins">{user?.rank?.name || 'Gold'} Rank</p>
            </div>
            <UilAngleDown size={16} className="text-gray-400 hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-slide-up font-poppins">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-800">{user?.fullName || 'Investor'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || 'user@email.com'}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="badge badge-gold text-[10px] font-bold">{user?.rank?.name || 'Gold'}</span>
                  <span className="text-[10px] text-slate-500 font-mono font-semibold">{user?.id}</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-600 hover:bg-gold-50 hover:text-gold-700 transition-colors"
                >
                  <RiUser3Line size={16} />
                  <span>My Profile</span>
                </Link>
                {onOpenCalculator && (
                  <button
                    onClick={() => { setProfileOpen(false); onOpenCalculator(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-600 hover:bg-gold-50 hover:text-gold-700 transition-colors text-left"
                  >
                    <RiCalculatorLine size={16} />
                    <span>Profit Calculator</span>
                  </button>
                )}
                <Link
                  to="/support"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-600 hover:bg-gold-50 hover:text-gold-700 transition-colors"
                >
                  <RiSettings3Line size={16} />
                  <span>Support Desk</span>
                </Link>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors text-left font-semibold"
                >
                  <RiLogoutBoxRLine size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
