import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  RiSunLine, 
  RiLeafLine, 
  RiCoinsLine, 
  RiShieldCheckLine, 
  RiArrowRightUpLine, 
  RiInformationLine, 
  RiArrowRightLine 
} from 'react-icons/ri';
import { Card } from './components/ui/card.jsx';

export default function InvestmentSection() {
  const reduceMotion = useReducedMotion();

  const headerVariants = {
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }
  };

  const cardVariants = (delay = 0) => ({
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 25 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : delay, ease: "easeOut" }
  });

  const stripVariants = {
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.2, ease: "easeOut" }
  };

  return (
    <section 
      id="investments" 
      className="bg-white py-20 lg:py-24 overflow-hidden scroll-mt-24 border-t border-[#ededeb]"
      aria-labelledby="investment-heading"
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-12 2xl:px-16">
        
        {/* ── SECTION HEADER (Centered Editorial) ── */}
        <motion.div 
          className="text-center max-w-[680px] mx-auto mb-12 lg:mb-14"
          {...headerVariants}
        >
          {/* Eyebrow with Delicate Flanking Gold Lines */}
          <div className="flex items-center justify-center gap-3.5 mb-3.5">
            <div aria-hidden="true" className="w-8 h-[1px] bg-[#d8c788]" />
            <span className="uppercase text-xs font-semibold tracking-[0.18em] text-[#9a7b00]">
              SECTION 3: INVESTMENT FOCUS
            </span>
            <div aria-hidden="true" className="w-8 h-[1px] bg-[#d8c788]" />
          </div>

          {/* Main Heading (Max 2 Lines) */}
          <h2 
            id="investment-heading"
            className="font-display font-semibold text-3xl sm:text-4xl lg:text-5xl text-[#1f1f1f] leading-tight tracking-tight mb-4"
          >
            Investment Opportunities <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#9a7b00] via-[#c8a200] to-[#9a7b00] bg-clip-text text-transparent">
              Built Around Tomorrow
            </span>
          </h2>

          {/* Supporting Text */}
          <p className="text-[#6b7280] text-sm sm:text-base leading-[1.7]">
            Explore opportunities across sectors positioned at the intersection of real-world assets, energy transition and global commodity value.
          </p>
        </motion.div>

        {/* ── THE TWO INVESTMENT CARDS (2 Columns Desktop, 1 Column Mobile) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          
          {/* CARD 1: Renewable Energy */}
          <motion.div {...cardVariants(0.05)} className="h-full">
            <Card className="rounded-[20px] overflow-hidden border border-[#ededed] bg-white shadow-xs hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full">
              {/* Image Region (~52-55% with 16:9 crop) */}
              <div className="w-full aspect-[16/9] overflow-hidden relative bg-[#f5f5f5]">
                <img 
                  src="/assets/renewable-energy-editorial-16x9.jpg" 
                  alt="Large-scale utility solar photovoltaic facility across green hills at golden hour with distant wind turbines" 
                  className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Floating Image Badge */}
                <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md rounded-full px-3 py-1 border border-[#ededed] shadow-xs flex items-center gap-1.5">
                  <RiSunLine className="text-[#c8a200] text-xs shrink-0" aria-hidden="true" />
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[#1f1f1f]">
                    RENEWABLE ENERGY
                  </span>
                </div>
              </div>

              {/* Content Region (~45-48%) */}
              <div className="p-5 lg:p-6 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="font-display font-semibold text-xl lg:text-2xl text-[#1f1f1f] mb-2 leading-snug group-hover:text-[#9a7b00] transition-colors">
                    Renewable Energy
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed mb-4">
                    Explore investment opportunities connected to renewable energy and clean-energy infrastructure.
                  </p>

                  {/* Compact Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fafafa] border border-[#f0f0f0] text-xs font-medium text-[#4b5563]">
                      <RiSunLine className="text-[#c8a200] text-sm shrink-0" aria-hidden="true" />
                      Clean Energy
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fafafa] border border-[#f0f0f0] text-xs font-medium text-[#4b5563]">
                      <RiLeafLine className="text-[#c8a200] text-sm shrink-0" aria-hidden="true" />
                      Infrastructure
                    </span>
                  </div>
                </div>

                {/* Text Action Link */}
                <div className="pt-3 border-t border-[#f5f5f5]">
                  <span className="inline-flex items-center justify-between w-full text-xs sm:text-sm font-semibold text-[#1f1f1f] group-hover:text-[#9a7b00] transition-colors cursor-pointer">
                    <span>Explore Energy Opportunities</span>
                    <RiArrowRightUpLine className="text-base text-[#c8a200] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* CARD 2: Precious Metals */}
          <motion.div {...cardVariants(0.15)} className="h-full">
            <Card className="rounded-[20px] overflow-hidden border border-[#ededed] bg-white shadow-xs hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full">
              {/* Image Region (~52-55% with 16:9 crop) */}
              <div className="w-full aspect-[16/9] overflow-hidden relative bg-[#f5f5f5]">
                <img 
                  src="/assets/precious-metals-editorial-16x9.jpg" 
                  alt="Sophisticated arrangement of refined gold bullion bars inside secure institutional storage environment" 
                  className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Floating Image Badge */}
                <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md rounded-full px-3 py-1 border border-[#ededed] shadow-xs flex items-center gap-1.5">
                  <RiCoinsLine className="text-[#c8a200] text-xs shrink-0" aria-hidden="true" />
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[#1f1f1f]">
                    PRECIOUS METALS
                  </span>
                </div>
              </div>

              {/* Content Region (~45-48%) */}
              <div className="p-5 lg:p-6 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="font-display font-semibold text-xl lg:text-2xl text-[#1f1f1f] mb-2 leading-snug group-hover:text-[#9a7b00] transition-colors">
                    Precious Metals
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed mb-4">
                    Explore opportunities connected to precious metals and physical asset markets.
                  </p>

                  {/* Compact Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fafafa] border border-[#f0f0f0] text-xs font-medium text-[#4b5563]">
                      <RiCoinsLine className="text-[#c8a200] text-sm shrink-0" aria-hidden="true" />
                      Physical Assets
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fafafa] border border-[#f0f0f0] text-xs font-medium text-[#4b5563]">
                      <RiShieldCheckLine className="text-[#c8a200] text-sm shrink-0" aria-hidden="true" />
                      Institutional Focus
                    </span>
                  </div>
                </div>

                {/* Text Action Link */}
                <div className="pt-3 border-t border-[#f5f5f5]">
                  <span className="inline-flex items-center justify-between w-full text-xs sm:text-sm font-semibold text-[#1f1f1f] group-hover:text-[#9a7b00] transition-colors cursor-pointer">
                    <span>Explore Metal Opportunities</span>
                    <RiArrowRightUpLine className="text-base text-[#c8a200] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

        </div>

        {/* ── BOTTOM INFORMATION STRIP (Single Full-width Strip ~90-110px) ── */}
        <motion.div 
          className="mt-8 rounded-2xl bg-[#fafafa] border border-[#eeeeee] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
          {...stripVariants}
        >
          {/* Left Section (~75%) */}
          <div className="flex items-start gap-3.5 sm:max-w-[75%]">
            <div className="w-8 h-8 rounded-full bg-[#fff9e6] text-[#9a7b00] border border-[#c8a200]/25 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <RiInformationLine size={18} aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm sm:text-base text-[#1f1f1f] mb-0.5 leading-snug">
                Understanding Investment Opportunities
              </h4>
              <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
                Investment performance, applicable ROI and associated terms depend on the specific investment plan and its conditions.
              </p>
            </div>
          </div>

          {/* Right Section (~25%) */}
          <div className="shrink-0 pl-11 sm:pl-0">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#9a7b00] hover:text-[#c8a200] transition-colors cursor-pointer group">
              <span>Learn More</span>
              <RiArrowRightLine className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
