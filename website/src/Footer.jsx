import React from 'react';
import { RiArrowUpLine, RiMailLine } from 'react-icons/ri';

const officialLogo = '/assets/horizon-cap-worlds-logo.png';

export default function Footer({ onNavigate }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLinkClick = (e, targetId) => {
    e.preventDefault();
    if (onNavigate && targetId) {
      onNavigate(targetId);
    } else if (targetId) {
      const el = document.getElementById(targetId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer 
      className="bg-[#FFFFFF] text-[#4A4D54] relative block border-t-2 border-[#D4AF37]"
      style={{ fontFamily: "'Inter', sans-serif" }}
      aria-label="Site Footer"
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-12 2xl:px-16 pt-14 sm:pt-16 pb-10">
        
        {/* ── MAIN DIRECTORY GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 pb-12 border-b border-[#EAE6DC]">
          
          {/* Brand Info (5 columns) */}
          <div className="md:col-span-5 space-y-5">
            <a 
              href="#home" 
              onClick={scrollToTop}
              className="inline-flex items-center cursor-pointer select-none group shrink-0" 
              aria-label="Horizon Cap Worlds Home"
            >
              <img 
                src={officialLogo} 
                alt="Horizon Cap Worlds" 
                className="h-12 sm:h-14 lg:h-[58px] xl:h-[62px] w-auto max-w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]" 
              />
            </a>

            <p className="text-xs sm:text-[13.5px] leading-relaxed text-[#555960] max-w-sm font-normal pt-1">
              Disciplined institutional capital deployment across renewable energy infrastructure and physical precious metals.
            </p>

            <div className="pt-1">
              <a 
                href="mailto:support@horizoncapworld.com" 
                className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-medium text-[#171717] hover:text-[#9A7B00] transition-colors"
              >
                <RiMailLine className="text-[#9A7B00] text-sm shrink-0" />
                <span>support@horizoncapworld.com</span>
              </a>
            </div>
          </div>

          {/* Clean 3 Navigation Columns (7 columns) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 pt-2 sm:pt-3">
            
            {/* Column 1: Sectors */}
            <div>
              <span 
                className="block text-xs font-semibold uppercase tracking-wider text-[#9A7B00] mb-3.5"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Sectors
              </span>
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-[#555960]">
                <li>
                  <a 
                    href="#investments" 
                    onClick={(e) => handleLinkClick(e, 'investments')}
                    className="hover:text-[#171717] hover:underline underline-offset-4 transition-colors"
                  >
                    Renewable Energy
                  </a>
                </li>
                <li>
                  <a 
                    href="#investments" 
                    onClick={(e) => handleLinkClick(e, 'investments')}
                    className="hover:text-[#171717] hover:underline underline-offset-4 transition-colors"
                  >
                    Precious Metals
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Company */}
            <div>
              <span 
                className="block text-xs font-semibold uppercase tracking-wider text-[#9A7B00] mb-3.5"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Company
              </span>
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-[#555960]">
                <li>
                  <a 
                    href="#about" 
                    onClick={(e) => handleLinkClick(e, 'about')}
                    className="hover:text-[#171717] hover:underline underline-offset-4 transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a 
                    href="#process" 
                    onClick={(e) => handleLinkClick(e, 'process')}
                    className="hover:text-[#171717] hover:underline underline-offset-4 transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a 
                    href="#leadership" 
                    onClick={(e) => handleLinkClick(e, 'leadership')}
                    className="hover:text-[#171717] hover:underline underline-offset-4 transition-colors"
                  >
                    Leadership
                  </a>
                </li>
                <li>
                  <a 
                    href="#why-horizon" 
                    onClick={(e) => handleLinkClick(e, 'why-horizon')}
                    className="hover:text-[#171717] hover:underline underline-offset-4 transition-colors"
                  >
                    Why Horizon
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Investor Portal */}
            <div className="col-span-2 sm:col-span-1">
              <span 
                className="block text-xs font-semibold uppercase tracking-wider text-[#9A7B00] mb-3.5"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Investor Portal
              </span>
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-[#555960]">
                <li>
                  <a 
                    href="https://investor.horizoncapworld.com/login" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#171717] hover:underline underline-offset-4 transition-colors"
                  >
                    Login
                  </a>
                </li>
                <li>
                  <a 
                    href="https://investor.horizoncapworld.com/register" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#171717] hover:underline underline-offset-4 transition-colors"
                  >
                    Register
                  </a>
                </li>
                <li>
                  <a 
                    href="#faq" 
                    onClick={(e) => handleLinkClick(e, 'faq')}
                    className="hover:text-[#171717] hover:underline underline-offset-4 transition-colors"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* ── BOTTOM BAR: COPYRIGHT, LEGAL & BACK TO TOP ── */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#70747E]">
          
          <div>
            <span>&copy; {new Date().getFullYear()} Horizon Cap Worlds. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#555960]">
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-[#171717] transition-colors">
              Privacy Policy
            </a>
            <span className="text-[#D0CBC0]">•</span>
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-[#171717] transition-colors">
              Terms of Service
            </a>
            <span className="text-[#D0CBC0]">•</span>
            <a href="#disclosures" onClick={(e) => e.preventDefault()} className="hover:text-[#171717] transition-colors">
              Disclosures
            </a>
          </div>

          <div>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#171717] hover:text-[#9A7B00] transition-colors cursor-pointer group py-1"
              aria-label="Scroll back to top"
            >
              <span>Back to Top</span>
              <RiArrowUpLine className="transition-transform group-hover:-translate-y-0.5 text-[#9A7B00]" size={14} />
            </button>
          </div>

        </div>

      </div>
    </footer>
  );
}
