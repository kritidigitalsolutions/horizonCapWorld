import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  RiDashboardLine, RiDashboardFill,
  RiFundsLine, RiFundsFill,
  RiGroupLine, RiGroupFill,
  RiExchangeDollarLine, RiExchangeDollarFill,
  RiNewspaperLine, RiNewspaperFill,
  RiSettings3Line, RiSettings3Fill,
  RiBankCardLine, RiBankCardFill,
  RiTrophyLine, RiTrophyFill,
  RiNodeTree,
  RiMenuFoldLine, RiMenuUnfoldLine,
  RiCloseLine,
  RiTicketLine, RiTicketFill,
  RiCustomerService2Line, RiCustomerService2Fill,
  RiNotification3Line, RiNotification3Fill,
} from 'react-icons/ri';
import { UilAngleRight } from '@iconscout/react-unicons';
import { getSidebarCounters } from '../../api/dashboardApi';

const navSections = [
  {
    title: 'Core Platform',
    items: [
      { path: '/admin', label: 'Dashboard', icon: RiDashboardLine, activeIcon: RiDashboardFill },
      { path: '/admin/investment-plans', label: 'Investment Plans', icon: RiFundsLine, activeIcon: RiFundsFill },
      { path: '/admin/users', label: 'Users Management', icon: RiGroupLine, activeIcon: RiGroupFill },
    ]
  },
  {
    title: 'Financial & Growth',
    items: [
      { path: '/admin/ranks', label: 'Rank Ladder', icon: RiTrophyLine, activeIcon: RiTrophyFill },
      { path: '/admin/referrals', label: 'Referral Plans', icon: RiNodeTree, activeIcon: RiNodeTree },
      { path: '/admin/transactions', label: 'Transactions', icon: RiExchangeDollarLine, activeIcon: RiExchangeDollarFill },
      { path: '/admin/payment-settings', label: 'Payment Settings', icon: RiBankCardLine, activeIcon: RiBankCardFill },
    ]
  },
  {
    title: 'Desk & System',
    items: [
      { path: '/admin/notifications', label: 'Notifications', icon: RiNotification3Line, activeIcon: RiNotification3Fill },
      { path: '/admin/support-tickets', label: 'Support Tickets', icon: RiTicketLine, activeIcon: RiTicketFill },
      { path: '/admin/support-channels', label: 'Support Channels', icon: RiCustomerService2Line, activeIcon: RiCustomerService2Fill },
      { path: '/admin/news-media', label: 'News & Media', icon: RiNewspaperLine, activeIcon: RiNewspaperFill },
      { path: '/admin/settings', label: 'Settings', icon: RiSettings3Line, activeIcon: RiSettings3Fill },
    ]
  }
];

export default function Sidebar({ isOpen, onToggle, isMobile }) {
  const location = useLocation();
  const [adminAvatar, setAdminAvatar] = useState(() => localStorage.getItem('horizon_admin_avatar') || '');
  const [counters, setCounters] = useState({
    users: 0,
    transactions: 0,
    notifications: 0,
    tickets: 0,
  });

  const fetchCounters = useCallback(async () => {
    try {
      const res = await getSidebarCounters();
      if (res?.success && res.counters) {
        setCounters(res.counters);
      }
    } catch {
      // Ignore background network errors
    }
  }, []);

  useEffect(() => {
    fetchCounters();
    const interval = setInterval(fetchCounters, 15000); // 15s live poll

    const handleCountersSync = () => fetchCounters();
    const handleUsersSeen = () => setCounters(prev => ({ ...prev, users: 0 }));
    const handleTxnsSeen = () => setCounters(prev => ({ ...prev, transactions: 0 }));

    window.addEventListener('admin-counters-update', handleCountersSync);
    window.addEventListener('admin-users-seen', handleUsersSeen);
    window.addEventListener('admin-transactions-seen', handleTxnsSeen);

    return () => {
      clearInterval(interval);
      window.removeEventListener('admin-counters-update', handleCountersSync);
      window.removeEventListener('admin-users-seen', handleUsersSeen);
      window.removeEventListener('admin-transactions-seen', handleTxnsSeen);
    };
  }, [fetchCounters]);

  useEffect(() => {
    const handleAvatarSync = (e) => {
      setAdminAvatar(e.detail !== undefined ? e.detail : (localStorage.getItem('horizon_admin_avatar') || ''));
    };
    window.addEventListener('admin-avatar-change', handleAvatarSync);
    window.addEventListener('storage', handleAvatarSync);
    return () => {
      window.removeEventListener('admin-avatar-change', handleAvatarSync);
      window.removeEventListener('storage', handleAvatarSync);
    };
  }, []);

  const getItemCount = (itemPath) => {
    if (itemPath === '/admin/users') return counters.users || 0;
    if (itemPath === '/admin/transactions') return counters.transactions || 0;
    if (itemPath === '/admin/notifications') return counters.notifications || 0;
    if (itemPath === '/admin/support-tickets') return counters.tickets || 0;
    return 0;
  };

  return (
    <>
      {/* Clean Dim Mobile Overlay (NO BLUR) */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden transition-opacity duration-200"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen max-h-screen bg-white z-50 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-sidebar border-r border-slate-100 select-none
          ${isMobile
            ? `${isOpen ? 'translate-x-0' : '-translate-x-full'} w-[268px] overflow-y-auto`
            : `${isOpen ? 'w-[268px] overflow-y-auto' : 'w-[74px] overflow-visible'}`
          }
        `}
      >
        {/* ──────────────── TOP BRANDING HEADER ──────────────── */}
        <div className={`flex items-center border-b border-slate-100 flex-shrink-0 ${
          (isOpen || isMobile) ? 'h-[76px] px-3.5 justify-between' : 'h-[68px] px-2 justify-center'
        }`}>
          {(isOpen || isMobile) ? (
            <div className="flex items-center gap-2.5 font-poppins flex-1 min-w-0">
              {/* Large Luxury Round Circle with Official Logo Image */}
              <div className="w-[48px] h-[48px] rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-gold ring-2 ring-[#ffd70d] bg-black select-none">
                <img
                  src="/admin/icon.png"
                  alt="Horizon Cap Worlds"
                  className="w-full h-full object-cover rounded-full scale-105"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-[15px] font-black uppercase font-poppins tracking-tight whitespace-nowrap bg-gradient-to-r from-[#B8860B] via-[#D49800] to-[#8C6200] bg-clip-text text-transparent leading-tight">
                  HORIZON CAP WORLDS
                </h1>
                <p className="text-[9px] font-bold uppercase font-poppins tracking-[0.18em] text-slate-400 mt-0.5 truncate">
                  Super Admin
                </p>
              </div>
            </div>
          ) : (
            /* Large Collapsed Luxury Gold Emblem with Official Logo Image */
            <div
              className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-gold ring-2 ring-[#ffd70d] bg-black mx-auto cursor-pointer hover:scale-105 transition-transform select-none"
              title="Expand Sidebar (Horizon Cap Worlds)"
              onClick={onToggle}
            >
              <img
                src="/admin/icon.png"
                alt="Horizon Cap Worlds"
                className="w-full h-full object-cover rounded-full scale-105"
              />
            </div>
          )}

          {isMobile ? (
            <button onClick={onToggle} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
              <RiCloseLine size={20} />
            </button>
          ) : isOpen ? (
            <button
              onClick={onToggle}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold-50 text-slate-400 hover:text-gold-600 transition-colors cursor-pointer"
              title="Collapse to icons"
            >
              <RiMenuFoldLine size={18} />
            </button>
          ) : null}
        </div>

        {/* ──────────────── CATEGORIZED NAVIGATION LIST (EVEN DISTRIBUTION) ──────────────── */}
        <nav
          className={`flex-1 flex flex-col justify-evenly ${
            (isOpen || isMobile)
              ? 'py-3 px-3.5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
              : 'py-3 px-2 overflow-visible'
          }`}
        >
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className={(isOpen || isMobile) ? 'space-y-1 my-1' : 'space-y-1.5 my-1'}>
              {/* Section Header / Divider */}
              {(isOpen || isMobile) ? (
                <div className="px-3 py-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-poppins block">
                    {sec.title}
                  </span>
                </div>
              ) : (
                <div className="flex justify-center py-1">
                  <div className="w-4 h-[1.5px] bg-slate-200 rounded-full" />
                </div>
              )}

              {/* Section Links */}
              <ul className={(isOpen || isMobile) ? 'space-y-1 font-poppins' : 'space-y-1.5 font-poppins'}>
                {sec.items.map(item => {
                  const isActive = location.pathname === item.path;
                  const Icon = isActive ? item.activeIcon : item.icon;
                  const count = getItemCount(item.path);

                  return (
                    <li key={item.path} className="relative group">
                      <NavLink
                        to={item.path}
                        onClick={() => isMobile && onToggle()}
                        className={`flex items-center rounded-xl transition-all duration-150 relative
                          ${(isOpen || isMobile)
                            ? `gap-3 px-3.5 py-2.5 ${isActive
                                ? 'bg-gold-50/90 text-gold-950 font-bold border border-gold-300/80 shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                              }`
                            : `w-10 h-10 justify-center mx-auto ${isActive
                                ? 'bg-gold-400 text-slate-950 shadow-gold ring-2 ring-gold-200 font-bold'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                              }`
                          }
                        `}
                      >
                        {/* Icon */}
                        <Icon
                          size={20}
                          className={
                            isActive
                              ? (isOpen || isMobile ? 'text-gold-700 flex-shrink-0' : 'text-slate-950 flex-shrink-0')
                              : 'text-slate-400 group-hover:text-slate-700 flex-shrink-0'
                          }
                        />

                        {/* Collapsed Mode Floating Notification Dot / Badge */}
                        {!isOpen && !isMobile && count > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-gold-400 text-slate-950 text-[11px] font-black flex items-center justify-center shadow-xs ring-2 ring-white tabular-nums">
                            {count > 9 ? '9+' : count}
                          </span>
                        )}

                        {/* Label & Expanded Badge (Expanded Mode Only) */}
                        {(isOpen || isMobile) && (
                          <>
                            <span className="text-xs flex-1 truncate">{item.label}</span>

                            {/* Minimal Luxury Counter Badge (DESIGN.md Gold Pill) */}
                            {count > 0 && (
                              <span
                                className={`min-w-[24px] h-[22px] px-2 rounded-full text-xs font-bold tabular-nums flex items-center justify-center flex-shrink-0 transition-all shadow-2xs ${
                                  isActive
                                    ? 'bg-gold-400 text-slate-950 font-black shadow-xs'
                                    : 'bg-gold-100 text-gold-900 border border-gold-300/90 group-hover:bg-gold-200/80 group-hover:border-gold-400'
                                }`}
                              >
                                {count > 99 ? '99+' : count}
                              </span>
                            )}

                            {isActive && count === 0 && (
                              <UilAngleRight size={16} className="text-gold-700 flex-shrink-0" />
                            )}
                          </>
                        )}
                      </NavLink>

                      {/* ──────────────── FLOATING HOVER TOOLTIP (COLLAPSED MODE) ──────────────── */}
                      {!isOpen && !isMobile && (
                        <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[99999] shadow-2xl pointer-events-none border border-slate-700 flex items-center gap-2">
                          <span>{item.label}</span>
                          {count > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-gold-400 text-slate-950 text-[10px] font-bold tabular-nums">
                              {count > 99 ? '99+' : count} new
                            </span>
                          )}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-slate-900" />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ──────────────── BOTTOM FOOTER CARD ──────────────── */}
        <div className={`border-t border-slate-100 flex-shrink-0 font-poppins bg-white ${
          (isOpen || isMobile) ? 'p-3' : 'p-2'
        }`}>
          {(isOpen || isMobile) ? (
            <div className="p-2.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Admin Avatar Circle */}
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ring-2 ring-gold-200 bg-slate-900 shadow-2xs">
                  {adminAvatar ? (
                    <img src={adminAvatar} alt="Super Admin" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-950 font-bold flex items-center justify-center text-[11px]">
                      SA
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">Super Admin</p>
                  <span className="text-[10px] text-slate-400 font-normal block truncate">admin@horizoncap.com</span>
                </div>
              </div>

              {/* Collapse Button */}
              {!isMobile && (
                <button
                  onClick={onToggle}
                  title="Collapse Sidebar"
                  className="w-8 h-8 rounded-xl bg-white hover:bg-gold-50 hover:text-gold-900 text-slate-400 flex items-center justify-center border border-slate-200 transition-colors shadow-2xs cursor-pointer flex-shrink-0"
                >
                  <RiMenuFoldLine size={16} />
                </button>
              )}
            </div>
          ) : (
            /* Collapsed Toggle Button */
            <button
              onClick={onToggle}
              title="Expand Sidebar"
              className="w-10 h-10 mx-auto rounded-xl bg-slate-50 hover:bg-gold-50 text-slate-500 hover:text-gold-900 flex items-center justify-center border border-slate-200 transition-colors shadow-2xs cursor-pointer hover:scale-105"
            >
              <RiMenuUnfoldLine size={18} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
