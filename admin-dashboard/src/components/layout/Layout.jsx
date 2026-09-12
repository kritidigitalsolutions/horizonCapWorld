import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumb from './Breadcrumb';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (window.innerWidth < 1024) return false;
    const saved = localStorage.getItem('horizon_admin_sidebar_open');
    if (saved !== null) return saved === 'true';
    // On small laptops (< 1366px), default to compact icon mode so screen isn't crowded
    return window.innerWidth >= 1366;
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      if (!isMobile) {
        try {
          localStorage.setItem('horizon_admin_sidebar_open', String(next));
        } catch {}
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} />

      <div
        className="transition-all duration-300 ease-in-out min-h-screen flex flex-col"
        style={{
          marginLeft: isMobile ? 0 : sidebarOpen ? '268px' : '74px',
        }}
      >
        <Header onMenuToggle={toggleSidebar} isSidebarOpen={sidebarOpen} />

        <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 transition-all">
          <Breadcrumb />
          <div className="page-enter">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
