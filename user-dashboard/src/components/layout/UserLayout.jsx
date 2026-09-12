import React, { useState, useEffect } from 'react';
import UserSidebar from './UserSidebar';
import Header from './Header';
import Breadcrumb from './Breadcrumb';
import ProfitCalculatorDrawer from '../calculator/ProfitCalculatorDrawer';

export default function UserLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (window.innerWidth < 1024) return false;
    const saved = localStorage.getItem('horizon_user_sidebar_open');
    if (saved !== null) return saved === 'true';
    // On small laptops (< 1366px), default to compact icon mode for spacious workspace
    return window.innerWidth >= 1366;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Listen for custom event to open calculator from anywhere in the app
  useEffect(() => {
    const handleOpenCalc = () => setCalculatorOpen(true);
    window.addEventListener('open-profit-calculator', handleOpenCalc);
    return () => window.removeEventListener('open-profit-calculator', handleOpenCalc);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      if (!isMobile) {
        try {
          localStorage.setItem('horizon_user_sidebar_open', String(next));
        } catch {}
      }
      return next;
    });
  };

  const sidebarWidth = isMobile ? 0 : (sidebarOpen ? 272 : 80);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <UserSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} />

      {/* Main content */}
      <div
        className="transition-all duration-300 min-h-screen flex flex-col"
        style={{ marginLeft: sidebarWidth }}
      >
        <Header
          onMenuToggle={toggleSidebar}
          isSidebarOpen={sidebarOpen}
          onOpenCalculator={() => setCalculatorOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 transition-all">
          <Breadcrumb />
          {children}
        </main>
      </div>

      {/* Global Profit Calculator Slide-Over Drawer */}
      <ProfitCalculatorDrawer
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
      />
    </div>
  );
}
