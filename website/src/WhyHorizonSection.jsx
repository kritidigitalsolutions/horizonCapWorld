import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  RiLeafLine, 
  RiShieldCheckLine, 
  RiSafe2Line, 
  RiCustomerService2Line, 
  RiArrowRightUpLine,
  RiCheckLine
} from 'react-icons/ri';

const valuePillars = [
  {
    number: "01",
    tag: "SECTOR FOCUS",
    icon: RiLeafLine,
    title: "Targeted Macro Sectors",
    description: "We deliberately focus on Renewable Energy and Precious Metals—two fundamental pillars of the evolving global economy offering clean energy infrastructure growth and resilient store-of-value characteristics.",
    highlights: ["Clean energy infrastructure", "Physical bullion exposure", "Macroeconomic relevance"]
  },
  {
    number: "02",
    tag: "TRANSPARENCY",
    icon: RiShieldCheckLine,
    title: "Structured Plan Architecture",
    description: "Every investment opportunity is presented with predefined durations, explicit return frameworks, and unambiguous terms—empowering investors to participate with complete clarity and confidence.",
    highlights: ["Defined investment cycles", "Transparent terms & timelines", "Zero speculative ambiguity"]
  },
  {
    number: "03",
    tag: "TANGIBLE VALUE",
    icon: RiSafe2Line,
    title: "Real-Asset Grounding",
    description: "Our opportunities are directly connected to physical infrastructure, commercial-grade solar installations, and verified bullion vaults—anchoring capital in enduring tangible substance.",
    highlights: ["Allocated asset backing", "Capital preservation focus", "Auditable physical custody"]
  },
  {
    number: "04",
    tag: "GOVERNANCE",
    icon: RiCustomerService2Line,
    title: "Executive Accountability",
    description: "Led by specialized sector executives and supported by a dedicated Nodal Officer team, we ensure structured governance, rigorous execution, and seamless investor communication at every step.",
    highlights: ["Dedicated Nodal Support", "Executive leadership oversight", "Streamlined investor access"]
  }
];

const commitmentPoints = [
  {
    title: "Disciplined Allocation",
    caption: "Capital deployed strictly within high-conviction real-asset sectors."
  },
  {
    title: "Full Visibility",
    caption: "Clear documentation, transparent criteria, and structured milestones."
  },
  {
    title: "Institutional Standards",
    caption: "Built around governance, accountability, and coordinated execution."
  }
];

export default function WhyHorizonSection() {
  const reduceMotion = useReducedMotion();

  // Animation variants
  const fadeUp = (delay = 0, y = 16) => ({
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : delay, ease: "easeOut" }
  });

  const containerAnim = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08
      }
    }
  };

  const cardAnim = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }
    }
  };

  return (
    <section 
      id="why-horizon" 
      className="bg-[#FCFCFA] py-16 sm:py-20 lg:py-24 border-t border-[#EDEDEB] scroll-mt-24 relative overflow-hidden"
      aria-labelledby="why-horizon-heading"
    >
      {/* Subtle Background Accent Texture */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
      >
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FFF8DB]/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#FFF5D0]/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-12 2xl:px-16 relative z-10">
        
        {/* ── HEADER ── */}
        <div className="max-w-3xl mb-12 sm:mb-14 lg:mb-16">
          <motion.div {...fadeUp(0.04, 10)} className="flex items-center gap-2.5 mb-3.5">
            <div aria-hidden="true" className="w-5 h-[1.5px] bg-[#d8c788]" />
            <span className="uppercase text-xs font-semibold tracking-[0.18em] text-[#9A7B00]">
              WHY CHOOSE HORIZON
            </span>
          </motion.div>

          <motion.h2 
            id="why-horizon-heading"
            tabIndex={-1}
            {...fadeUp(0.1, 18)}
            className="font-display font-semibold text-3xl sm:text-4xl lg:text-[46px] text-[#1F1F1F] leading-[1.08] tracking-tight focus:outline-none mb-4"
          >
            A Disciplined Foundation for{" "}
            <span className="text-[#C8A200]">
              Real-Asset Investment
            </span>
          </motion.h2>

          <motion.p 
            {...fadeUp(0.18, 14)}
            className="text-base sm:text-[17px] leading-[1.7] text-[#64748B]"
          >
            Investors choose Horizon Cap Worlds for our focused approach: combining tangible, future-ready sectors with institutional-grade structuring, transparent terms, and dedicated operational oversight.
          </motion.p>
        </div>

        {/* ── 4 CORE VALUE PILLARS (2x2 Grid) ── */}
        <motion.div
          variants={containerAnim}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12 lg:mb-16"
        >
          {valuePillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <motion.article
                key={pillar.number}
                variants={cardAnim}
                className="group relative bg-white rounded-[22px] border border-[#EAE8E0] p-7 sm:p-8 lg:p-9 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-[#C8A200]/40 hover:shadow-[0_12px_32px_rgba(200,162,0,0.06)] hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Number + Tag + Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-display font-semibold text-xs text-[#9A7B00] tabular-nums tracking-wider">
                        {pillar.number}
                      </span>
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9A7B00] px-2 py-0.5 rounded-full bg-[#FFFBE8] border border-[#c8a200]/20">
                        {pillar.tag}
                      </span>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-[#FFF9E6] border border-[#E6C84A]/30 flex items-center justify-center text-[#9A7B00] group-hover:scale-105 transition-transform duration-300 shadow-2xs">
                      <Icon size={19} aria-hidden="true" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-semibold text-xl sm:text-[22px] text-[#1F1F1F] group-hover:text-[#9A7B00] transition-colors leading-snug mb-3">
                    {pillar.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm sm:text-[14.5px] leading-relaxed text-[#64748B] mb-6">
                    {pillar.description}
                  </p>
                </div>

                {/* Highlights List */}
                <div className="pt-4 border-t border-[#F0EFE9] space-y-2">
                  {pillar.highlights.map((point) => (
                    <div key={point} className="flex items-center gap-2.5 text-xs sm:text-[13px] text-[#475467]">
                      <div className="w-4 h-4 rounded-full bg-[#FFF9E6] flex items-center justify-center text-[#9A7B00] shrink-0">
                        <RiCheckLine size={12} aria-hidden="true" />
                      </div>
                      <span className="font-medium">{point}</span>
                    </div>
                  ))}
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {/* ── BOTTOM INSTITUTIONAL COMMITMENT PANEL ── */}
        <motion.div 
          {...fadeUp(0.2, 16)}
          className="rounded-[22px] bg-white border border-[#EAE8E0] p-6 sm:p-8 lg:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#EAE8E0] gap-6 md:gap-0">
            {commitmentPoints.map((point, index) => (
              <div 
                key={point.title}
                className={`${
                  index === 0 
                    ? 'md:pr-8' 
                    : index === 1 
                    ? 'md:px-8 pt-6 md:pt-0' 
                    : 'md:pl-8 pt-6 md:pt-0'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C8A200]" />
                  <h4 className="font-display font-semibold text-base sm:text-[17px] text-[#1F1F1F]">
                    {point.title}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[#64748B]">
                  {point.caption}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
