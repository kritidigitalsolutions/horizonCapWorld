import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumb from './Breadcrumb';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} />

      <div
        className="transition-all duration-300 ease-in-out min-h-screen flex flex-col"
        style={{
          marginLeft: isMobile ? 0 : sidebarOpen ? '268px' : '72px',
        }}
      >
        <Header onMenuToggle={toggleSidebar} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Breadcrumb />
          <div className="page-enter">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
