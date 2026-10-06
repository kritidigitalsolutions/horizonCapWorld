import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  RiLeafLine, 
  RiCoinsLine, 
  RiArrowRightUpLine,
  RiFlowChart,
  RiEyeLine,
  RiCompass3Line
} from 'react-icons/ri';

const approachPrinciples = [
  {
    number: "01",
    icon: RiFlowChart,
    title: "Structured Opportunities",
    description: "We focus on presenting opportunities through clearly defined investment structures, applicable terms and relevant sector information."
  },
  {
    number: "02",
    icon: RiEyeLine,
    title: "Clarity in Information",
    description: "Investors should be able to understand the opportunity, its associated conditions and the information available through the platform."
  },
  {
    number: "03",
    icon: RiCompass3Line,
    title: "Sector-Focused Perspective",
    description: "Our focus remains on Renewable Energy and Precious Metals, two distinct areas represented through dedicated investment opportunities."
  }
];

export default function AboutSection() {
  const reduceMotion = useReducedMotion();

  // Part 1: Existing Approved Animations
  const imageAnim = {
    initial: { opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.98 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }
  };

  const contentAnim = {
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 15 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }
  };

  const focusAnim = {
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.15, ease: "easeOut" }
  };

  // Part 2: "Our Approach" Animations
  const panelAnim = {
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }
  };

  const leftContentAnim = {
    initial: { opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : -15 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }
  };

  const listContainerAnim = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08
      }
    }
  };

  const rowAnim = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }
    }
  };

  return (
    <section 
      id="about" 
      className="bg-white py-12 md:py-16 lg:py-20 overflow-hidden scroll-mt-24 border-t border-[#ededeb]"
      aria-labelledby="about-title"
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-12 2xl:px-16">
        
        {/* ── PART 1: EXISTING APPROVED SPLIT LAYOUT ── */}

        {/* Mobile-only Header & Intro (Appears BEFORE image on mobile) */}
        <div className="block lg:hidden mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div aria-hidden="true" className="w-5 h-[1px] bg-[#d8c788]" />
            <span className="uppercase text-[11px] font-semibold tracking-[0.18em] text-[#9a7b00]">
              ABOUT HORIZON CAP WORLDS
            </span>
            <div aria-hidden="true" className="w-5 h-[1px] bg-[#d8c788]" />
          </div>

          <h2 className="font-display font-semibold text-3xl sm:text-[36px] text-[#1f1f1f] leading-[1.12] tracking-tight mb-4">
            Capital With a{" "}
            <span className="bg-gradient-to-r from-[#9a7b00] via-[#c8a200] to-[#9a7b00] bg-clip-text text-transparent">
              Vision for Tomorrow
            </span>
          </h2>

          <div className="text-[15px] sm:text-base leading-[1.68] text-[#6b7280] space-y-3 mb-6">
            <p>
              <strong className="font-medium text-[#1f1f1f]">Horizon Cap Worlds</strong> is an investment platform focused on opportunities across Renewable Energy and Precious Metals.
            </p>
            <p>
              We bring together structured opportunities across two sectors connected to the evolving global economy, with a clear and modern environment for investors to understand available opportunities and applicable terms.
            </p>
          </div>
        </div>

        {/* Desktop Split Layout (Left ~48% / Right ~52%) */}
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] items-center gap-8 sm:gap-10 lg:gap-12 xl:gap-14">
          
          {/* LEFT: Single Premium Editorial Image */}
          <motion.div {...imageAnim} className="w-full">
            <div className="w-full h-[280px] sm:h-[360px] lg:h-[430px] xl:h-[450px] rounded-[22px] lg:rounded-[24px] overflow-hidden relative shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-[#ededed] bg-[#f5f5f5]">
              <img 
                src="/assets/solar-renewable-investment.jpg" 
                alt="Large-scale renewable energy infrastructure representing Horizon Cap Worlds investment focus"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </motion.div>

          {/* RIGHT: Short Company Introduction + Compact Investment Focus */}
          <div className="w-full flex flex-col justify-center">
            
            {/* Desktop-only Header & Intro */}
            <motion.div {...contentAnim} className="hidden lg:block">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div aria-hidden="true" className="w-5 h-[1px] bg-[#d8c788]" />
                <span className="uppercase text-xs font-semibold tracking-[0.18em] text-[#9a7b00]">
                  ABOUT HORIZON CAP WORLDS
                </span>
                <div aria-hidden="true" className="w-5 h-[1px] bg-[#d8c788]" />
              </div>

              <h2 
                id="about-title"
                tabIndex={-1}
                className="font-display font-semibold text-[40px] xl:text-[46px] text-[#1f1f1f] leading-[1.1] tracking-tight mb-5 focus:outline-none"
              >
                Capital With a{" "}
                <span className="bg-gradient-to-r from-[#9a7b00] via-[#c8a200] to-[#9a7b00] bg-clip-text text-transparent">
                  Vision for Tomorrow
                </span>
              </h2>

              <div className="max-w-[560px] text-[15px] xl:text-base leading-[1.68] text-[#6b7280] space-y-3.5 mb-6">
                <p>
                  <strong className="font-medium text-[#1f1f1f]">Horizon Cap Worlds</strong> is an investment platform focused on opportunities across Renewable Energy and Precious Metals.
                </p>
                <p>
                  We bring together structured opportunities across two sectors connected to the evolving global economy, with a clear and modern environment for investors to understand available opportunities and applicable terms.
                </p>
              </div>
            </motion.div>

            {/* Compact Investment Focus */}
            <motion.div {...focusAnim} className="pt-5 lg:pt-6 border-t border-[#ededeb]">
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#9a7b00] mb-3">
                Investment Focus
              </span>
              
              <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                <div className="flex items-center gap-2.5 group cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-[#fff9e6] border border-[#c8a200]/25 flex items-center justify-center text-[#9a7b00] shrink-0 group-hover:scale-105 transition-transform">
                    <RiLeafLine size={14} aria-hidden="true" />
                  </div>
                  <span className="font-display font-semibold text-sm sm:text-base text-[#1f1f1f] group-hover:text-[#9a7b00] transition-colors">
                    Renewable Energy
                  </span>
                  <RiArrowRightUpLine 
                    className="text-[#9a7b00] text-sm transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" 
                    aria-hidden="true" 
                  />
                </div>

                <div className="flex items-center gap-2.5 group cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-[#fff9e6] border border-[#c8a200]/25 flex items-center justify-center text-[#9a7b00] shrink-0 group-hover:scale-105 transition-transform">
                    <RiCoinsLine size={14} aria-hidden="true" />
                  </div>
                  <span className="font-display font-semibold text-sm sm:text-base text-[#1f1f1f] group-hover:text-[#9a7b00] transition-colors">
                    Precious Metals
                  </span>
                  <RiArrowRightUpLine 
                    className="text-[#9a7b00] text-sm transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" 
                    aria-hidden="true" 
                  />
                </div>
              </div>
            </motion.div>

          </div>

        </div>

        {/* ── PART 2: NEW SECONDARY COMPONENT "OUR APPROACH" ── */}
        <motion.div 
          className="mt-12 sm:mt-14 lg:mt-16 xl:mt-[70px] w-full rounded-[20px] lg:rounded-[24px] bg-[#FAFAF7] border border-[#c8a200]/20 p-6 sm:p-9 lg:p-12 xl:p-14 relative overflow-hidden shadow-2xs"
          {...panelAnim}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-start">
            
            {/* Left Side: Large Editorial Statement (~42%) */}
            <motion.div {...leftContentAnim} className="flex flex-col justify-start">
              {/* Eyebrow */}
              <div className="mb-3.5">
                <span className="uppercase text-[11px] sm:text-xs font-semibold tracking-[0.18em] text-[#9a7b00]">
                  OUR APPROACH
                </span>
              </div>

              {/* Heading with Solid Brand Gold */}
              <h3 className="font-display font-semibold text-[30px] sm:text-[34px] lg:text-[40px] xl:text-[44px] text-[#1f1f1f] leading-[1.08] tracking-tight mb-4">
                Investing With <br className="hidden sm:inline" />
                <span className="text-[#c8a200]">Clarity &amp; Purpose</span>
              </h3>

              {/* Left Description */}
              <p className="max-w-[440px] text-sm sm:text-base leading-[1.7] text-[#64748B]">
                Horizon Cap Worlds focuses on presenting investment opportunities through a structured and accessible experience, helping investors understand the sectors, terms and information associated with each opportunity.
              </p>
            </motion.div>

            {/* Right Side: Three Compact Principles in Single Unified Content Area (~58%) */}
            <motion.div 
              className="flex flex-col w-full"
              variants={listContainerAnim}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {approachPrinciples.map((item, index) => {
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.number}>
                    {/* Thin Divider Between Rows */}
                    {index > 0 && (
                      <div aria-hidden="true" className="w-full h-[1px] bg-[#E8E8E3]" />
                    )}

                    {/* Single Editorial Principle Row */}
                    <motion.div 
                      variants={rowAnim}
                      className="grid grid-cols-[36px_1fr_24px] sm:grid-cols-[48px_1fr_32px] items-start gap-3 sm:gap-4 py-4 sm:py-5 group transition-colors duration-250 hover:bg-[#FFFDF2]/70 rounded-xl px-2.5 -mx-2.5 cursor-default"
                    >
                      {/* Number Column */}
                      <span className="font-display font-semibold text-xs sm:text-sm text-[#9A7B00] pt-1 sm:pt-1.5 tabular-nums">
                        {item.number}
                      </span>

                      {/* Content Column: Icon + Title + Description */}
                      <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FFF9D6] border border-[#E6C84A]/30 flex items-center justify-center text-[#9A7B00] group-hover:bg-[#FFF0B3] transition-colors shrink-0 mt-0.5 shadow-2xs">
                          <Icon size={16} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-semibold text-base sm:text-[17px] text-[#1F1F1F] group-hover:text-[#9A7B00] transition-colors leading-snug mb-1">
                            {item.title}
                          </h4>
                          <p className="text-xs sm:text-[13px] sm:text-sm text-[#64748B] leading-relaxed max-w-xl">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Arrow Column */}
                      <div className="flex justify-end pt-1">
                        <RiArrowRightUpLine 
                          className="text-[#9A7B00] text-base sm:text-lg transition-transform duration-250 group-hover:translate-x-1 group-hover:-translate-y-0.5" 
                          aria-hidden="true" 
                        />
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </motion.div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
