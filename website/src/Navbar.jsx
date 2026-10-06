import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { RiArrowRightUpLine, RiMenu3Line, RiCloseLine, RiMailLine } from 'react-icons/ri';

const officialLogo = '/assets/horizon-cap-worlds-logo.png';

const navItems = [
  { label: 'Home', target: null },
  { label: 'About', target: 'about' },
  { label: 'Investments', target: 'investments' },
  { label: 'How It Works', target: 'process' },
  { label: 'Leadership', target: 'leadership' },
  { label: 'Why Choose Us', target: 'why-horizon' },
  { label: 'FAQ', target: 'faq' }
];

export default function Navbar({ 
  activeSection, 
  onNavigate,
  loginHref = "https://investor.horizoncapworld.com/login",
  registerHref = "https://investor.horizoncapworld.com/register"
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (target) => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(target);
    } else {
      if (!target) {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' });
      } else {
        const el = document.getElementById(target);
        el?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
      }
    }
  };

  return (
    <>
      <header 
        className={`sticky top-0 z-50 w-full transition-all duration-200 border-b border-[#141414]/[0.07] ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-[0_2px_15px_rgba(0,0,0,0.04)] h-[62px] sm:h-[70px] lg:h-[84px]' 
            : 'bg-white h-[66px] sm:h-[76px] lg:h-[88px]'
        }`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* ── FULL WIDTH CONTAINER (Fluid edge padding adapted for all laptop and display widths) ── */}
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-12 2xl:px-16 h-full flex items-center justify-between">
          
          {/* ── LOGO (Fluid scaling for mobile, small laptops, standard laptops & large monitors) ── */}
          <div className="flex items-center shrink-0">
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); handleNavClick(null); }}
              className="inline-flex items-center cursor-pointer select-none py-1 group shrink-0"
              aria-label="Horizon Cap Worlds Home"
            >
              <img 
                src={officialLogo} 
                alt="Horizon Cap Worlds" 
                className="h-[36px] sm:h-[40px] lg:h-[44px] xl:h-[48px] 2xl:h-[50px] w-auto max-w-[210px] sm:max-w-none object-contain transition-transform duration-200 group-hover:scale-[1.02]" 
              />
            </a>
          </div>

          {/* ── DESKTOP NAVIGATION (Fluid spacing preventing collisions on 13" and 14" laptops) ── */}
          <nav 
            className="hidden lg:flex items-center lg:gap-2.5 xl:gap-4.5 2xl:gap-6" 
            aria-label="Main navigation"
          >
            {navItems.map(({ label, target }) => {
              const isActive = target === activeSection || (!target && !activeSection);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleNavClick(target)}
                  className={`relative lg:text-[12.5px] xl:text-[13.5px] 2xl:text-[14.5px] py-1.5 px-0.5 xl:px-1 transition-colors duration-150 cursor-pointer ${
                    isActive 
                      ? 'text-[#171717] font-semibold' 
                      : 'text-[#4B5563] font-medium hover:text-[#171717]'
                  }`}
                >
                  <span>{label}</span>
                  
                  {/* Active Indicator: Centered 20px wide gold line underneath */}
                  {isActive && (
                    <motion.div
                      layoutId="activeHeaderNav"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-[#C8A200] rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── DESKTOP AUTH BUTTONS: LOGIN & REGISTER LINKS (Optimized height & padding) ── */}
          <div className="hidden lg:flex items-center lg:gap-2 xl:gap-3 shrink-0">
            {/* Login link: direct URL */}
            <a
              href={loginHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-[36px] xl:h-[40px] 2xl:h-[42px] px-3.5 xl:px-4 2xl:px-5 rounded-[10px] border border-[#E2DDD3] hover:border-[#171717] bg-white hover:bg-[#FAF9F5] text-[12.5px] xl:text-[13.5px] 2xl:text-[14px] font-semibold text-[#171717] transition-all duration-150 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            >
              Login
            </a>

            {/* Register link: direct URL */}
            <a
              href={registerHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-1.5 h-[36px] xl:h-[40px] 2xl:h-[42px] px-3.5 lg:px-4 xl:px-5 2xl:px-6 rounded-[10px] bg-[#FFD700] hover:bg-[#F5CF00] text-[#171717] text-[12.5px] xl:text-[13.5px] 2xl:text-[14px] font-semibold tracking-tight transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(255,215,0,0.22)] hover:shadow-[0_4px_16px_rgba(200,162,0,0.3)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Register</span>
              <RiArrowRightUpLine 
                size={15} 
                className="text-[#171717] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" 
                aria-hidden="true" 
              />
            </a>
          </div>

          {/* ── MOBILE HAMBURGER BUTTON ── */}
          <div className="flex lg:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#171717] hover:bg-[#FAF9F5] active:bg-[#F5F2E8] transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <RiCloseLine size={24} /> : <RiMenu3Line size={24} />}
            </button>
          </div>

        </div>

        {/* ── MOBILE NAVIGATION PANEL ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="lg:hidden absolute top-full left-0 right-0 z-50 bg-white border-b border-[#EAE6DF] shadow-[0_20px_40px_rgba(0,0,0,0.12)] px-4 sm:px-6 py-5 space-y-4 max-h-[calc(100dvh-74px)] overflow-y-auto"
            >
              <nav className="flex flex-col space-y-1">
                {navItems.map(({ label, target }) => {
                  const isActive = target === activeSection || (!target && !activeSection);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleNavClick(target)}
                      className={`flex items-center justify-between py-3 px-3.5 rounded-xl text-left text-[15px] font-medium transition-all cursor-pointer active:scale-[0.99] ${
                        isActive 
                          ? 'bg-[#FAF7EB] text-[#171717] font-semibold border-l-4 border-[#C8A200]' 
                          : 'text-[#374151] hover:bg-[#FAF9F5] hover:text-[#171717]'
                      }`}
                    >
                      <span>{label}</span>
                      {isActive && <div className="w-2 h-2 rounded-full bg-[#C8A200]" />}
                    </button>
                  );
                })}
              </nav>

              {/* Mobile Auth Links: Login & Register */}
              <div className="pt-3.5 grid grid-cols-2 gap-3 border-t border-[#EAE6DF]">
                <a
                  href={loginHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-11 rounded-[10px] border border-[#E2DDD3] bg-white text-[#171717] font-semibold text-[13.5px] hover:border-[#171717] active:bg-[#FAF9F5] transition-colors"
                >
                  Login
                </a>
                <a
                  href={registerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 h-11 rounded-[10px] bg-[#FFD700] hover:bg-[#F5CF00] text-[#171717] font-semibold text-[13.5px] shadow-sm active:translate-y-0.5 transition-all"
                >
                  <span>Register</span>
                  <RiArrowRightUpLine size={15} />
                </a>
              </div>

              {/* Quick Support Info in Mobile Menu */}
              <div className="pt-2 text-center">
                <a 
                  href="mailto:support@horizoncapworld.com" 
                  className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#9A7B00] transition-colors"
                >
                  <RiMailLine size={14} className="text-[#9A7B00]" />
                  <span>support@horizoncapworld.com</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Dim backdrop overlay for mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 top-[66px] sm:top-[76px] bg-black/45 backdrop-blur-[2px] z-40"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}
