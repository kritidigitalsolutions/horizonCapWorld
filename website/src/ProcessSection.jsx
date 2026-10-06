import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  RiCompassDiscoverLine, 
  RiFileList3Line, 
  RiFundsLine, 
  RiLineChartLine,
  RiShieldCheckLine
} from 'react-icons/ri';

const steps = [
  {
    number: "01",
    icon: RiCompassDiscoverLine,
    title: "Explore Opportunities",
    description: "Review available opportunities across Renewable Energy and Precious Metals."
  },
  {
    number: "02",
    icon: RiFileList3Line,
    title: "Review the Terms",
    description: "Understand the applicable investment plan, duration and associated terms."
  },
  {
    number: "03",
    icon: RiFundsLine,
    title: "Invest According to Plan",
    description: "Select an applicable opportunity and invest according to its defined conditions."
  },
  {
    number: "04",
    icon: RiLineChartLine,
    title: "Track Your Investment",
    description: "Monitor your investment information and applicable ROI through the platform."
  }
];

export default function ProcessSection() {
  const reduceMotion = useReducedMotion();

  const headerVariants = {
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 15 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }
  };

  const lineVariants = {
    initial: { scaleX: reduceMotion ? 1 : 0 },
    whileInView: { scaleX: 1 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.8, delay: 0.2, ease: "easeOut" }
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }
    }
  };

  const panelVariants = {
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 15 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.6, delay: 0.3, ease: "easeOut" }
  };

  return (
    <section 
      id="process" 
      className="bg-[#fafafa] py-14 sm:py-16 md:py-20 lg:py-24 overflow-hidden scroll-mt-24 border-t border-[#ededeb]"
      aria-labelledby="process-heading"
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-12 2xl:px-16">
        
        {/* ── SECTION HEADER (Centered Editorial) ── */}
        <motion.div 
          className="text-center max-w-[680px] mx-auto mb-10 sm:mb-12 lg:mb-16"
          {...headerVariants}
        >
          {/* Eyebrow with Delicate Flanking Gold Lines */}
          <div className="flex items-center justify-center gap-3.5 mb-3.5">
            <div aria-hidden="true" className="w-8 h-[1px] bg-[#d8c788]" />
            <span className="uppercase text-xs font-semibold tracking-[0.18em] text-[#9a7b00]">
              HOW IT WORKS
            </span>
            <div aria-hidden="true" className="w-8 h-[1px] bg-[#d8c788]" />
          </div>

          {/* Main Heading */}
          <h2 
            id="process-heading"
            className="font-display font-semibold text-3xl sm:text-4xl lg:text-5xl text-[#1f1f1f] leading-tight tracking-tight mb-3 sm:mb-4"
          >
            From Opportunity{" "}
            <span className="bg-gradient-to-r from-[#9a7b00] via-[#c8a200] to-[#9a7b00] bg-clip-text text-transparent">
              to Investment
            </span>
          </h2>

          {/* Supporting Text */}
          <p className="text-[#6b7280] text-sm sm:text-base leading-relaxed">
            A simple journey designed to help investors explore opportunities, understand applicable terms and track their investment experience.
          </p>
        </motion.div>

        {/* ── DESKTOP & LAPTOP PROCESS (Single Horizontal Row) ── */}
        <div className="hidden lg:block relative">
          
          {/* Subtle Horizontal Connecting Gold Line */}
          <div 
            aria-hidden="true" 
            className="absolute top-5 left-[8%] right-[8%] h-[1px] bg-[#E6C84A]/30 z-0"
          >
            <motion.div 
              className="h-full w-full bg-[#E6C84A] origin-left"
              {...lineVariants}
            />
          </div>

          <motion.div 
            className="grid grid-cols-4 gap-6 lg:gap-8 relative z-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={step.number} 
                  variants={stepVariants}
                  className="flex flex-col items-start group"
                >
                  {/* Top: 36px Gold Numbered Circle */}
                  <div className="w-10 h-10 rounded-full bg-[#FFF9D6] border border-[#E6C84A] text-[#9A7B00] font-display font-bold text-sm flex items-center justify-center shadow-xs mb-4 group-hover:border-[#c8a200] group-hover:scale-105 transition-all tabular-nums">
                    {step.number}
                  </div>

                  {/* Icon & Title Row */}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="text-[#9A7B00] text-lg shrink-0" aria-hidden="true" />
                    <h3 className="font-display font-semibold text-base lg:text-lg text-[#1F1F1F] leading-snug group-hover:text-[#9A7B00] transition-colors">
                      {step.title}
                    </h3>
                  </div>

                  {/* Description (~2 lines) */}
                  <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed max-w-[260px]">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

        </div>

        {/* ── MOBILE & TABLET PROCESS (Compact Vertical Flow with Thin Left Line) ── */}
        <div className="block lg:hidden relative pl-9 sm:pl-10 max-w-2xl mx-auto">
          
          {/* Vertical Connecting Line */}
          <div 
            aria-hidden="true" 
            className="absolute left-[17px] sm:left-[19px] top-4 bottom-4 w-[1px] bg-[#E6C84A]" 
          />

          <motion.div 
            className="space-y-6 sm:space-y-7"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={step.number}
                  variants={stepVariants}
                  className="relative group"
                >
                  {/* Absolute Number Circle on Left */}
                  <div className="absolute -left-[35px] sm:-left-[39px] top-0 w-8 h-8 rounded-full bg-[#FFF9D6] border border-[#E6C84A] text-[#9A7B00] font-display font-bold text-xs flex items-center justify-center shadow-xs tabular-nums">
                    {step.number}
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="text-[#9A7B00] text-base shrink-0" aria-hidden="true" />
                    <h3 className="font-display font-semibold text-sm sm:text-base text-[#1F1F1F] leading-snug">
                      {step.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#6B7280] leading-relaxed max-w-[280px]">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

        </div>

        {/* ── COMPACT INFORMATION PANEL (Understanding ROI) ── */}
        <motion.div 
          className="mt-10 sm:mt-12 rounded-2xl bg-white border border-[#EEEEEE] p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-2xs"
          {...panelVariants}
        >
          {/* Left Section (~75%) */}
          <div className="flex items-start gap-3.5 md:max-w-[72%]">
            <div className="w-8 h-8 rounded-full bg-[#FFF9D6] text-[#9A7B00] border border-[#E6C84A]/40 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <RiShieldCheckLine size={18} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="uppercase text-[10px] font-bold tracking-[0.16em] text-[#9A7B00]">
                  UNDERSTANDING ROI
                </span>
              </div>
              <h4 className="font-display font-semibold text-sm sm:text-base text-[#1F1F1F] mb-1 leading-snug">
                Clear Terms. Informed Decisions.
              </h4>
              <p className="text-xs sm:text-[13px] text-[#6B7280] leading-relaxed">
                ROI represents the return associated with an investment according to the applicable investment plan, duration and terms. Actual performance and returns may vary depending on the specific opportunity.
              </p>
            </div>
          </div>

          {/* Right Section (~25%) */}
          <div className="md:border-l md:border-[#E5E7EB] md:pl-6 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#f0f0f0]">
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 max-w-[270px]">
              <p className="text-xs text-[#1F1F1F] font-medium leading-snug">
                ROI depends on the applicable investment plan and its terms.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
