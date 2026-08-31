import React, { useState, useEffect } from 'react';
import UserSidebar from './UserSidebar';
import Header from './Header';
import Breadcrumb from './Breadcrumb';
import ProfitCalculatorDrawer from '../calculator/ProfitCalculatorDrawer';

export default function UserLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
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

  const toggleSidebar = () => setSidebarOpen(p => !p);

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
          onOpenCalculator={() => setCalculatorOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
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
