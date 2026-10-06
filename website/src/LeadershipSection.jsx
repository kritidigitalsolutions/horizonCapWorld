import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RiUser3Line } from 'react-icons/ri';

// Leadership Team Data
const ceoProfile = {
  number: "01",
  label: "01 / EXECUTIVE LEADERSHIP",
  name: "Daniel Wei",
  title: "Chief Executive Officer",
  statement: "Building a structured platform around long-term opportunity.",
  description: "Provides strategic leadership for the organization, guiding the platform's overall direction, investment focus and long-term business objectives.",
  tags: [
    "Strategic Direction",
    "Investment Vision",
    "Corporate Leadership"
  ],
  image: "/assets/leadership/ceo.png",
  fallbackInitials: "DW"
};

const executiveDirectory = [
  {
    number: "02",
    code: "CTO",
    name: "Ethan Chen",
    title: "Chief Technology Officer",
    description: "Leads technology strategy, platform architecture and digital systems supporting the Horizon Cap Worlds ecosystem.",
    responsibilities: [
      "Technology Strategy",
      "Platform Architecture"
    ],
    image: "/assets/leadership/cto.png",
    fallbackInitials: "EC"
  },
  {
    number: "03",
    code: "VP (Finance)",
    name: "Adrian Liu",
    title: "Vice President — Finance",
    description: "Oversees financial planning, investment-related processes and financial reporting across the organization.",
    responsibilities: [
      "Financial Planning",
      "Financial Operations"
    ],
    image: "/assets/leadership/vp-finance.png",
    fallbackInitials: "AL"
  },
  {
    number: "04",
    code: "VP (Operations)",
    name: "Kevin Tran",
    title: "Vice President — Operations",
    description: "Oversees operational processes and coordinates execution across teams to support efficient platform operations.",
    responsibilities: [
      "Process Management",
      "Operational Coordination"
    ],
    image: "/assets/leadership/vp-operations.png",
    fallbackInitials: "KT"
  },
  {
    number: "05",
    code: "VP (IT)",
    name: "Sophia Nguyen",
    title: "Vice President — Information Technology",
    description: "Supports IT infrastructure, information systems and technology operations across the organization.",
    responsibilities: [
      "IT Infrastructure",
      "Systems Management"
    ],
    image: "/assets/leadership/vp-it.png",
    fallbackInitials: "SN"
  },
  {
    number: "06",
    code: "VP (Network)",
    name: "Marcus Wang",
    title: "Vice President — Network",
    description: "Leads network development and relationship coordination across the organization's broader operating ecosystem.",
    responsibilities: [
      "Network Development",
      "Relationship Coordination"
    ],
    image: "/assets/leadership/vp-network.png",
    fallbackInitials: "MW"
  },
  {
    number: "07",
    code: "Nodal Officer",
    name: "Emily Zhang",
    title: "Nodal Officer — Customer Support",
    description: "Coordinates customer-support communication and helps ensure investor queries are routed and addressed efficiently.",
    responsibilities: [
      "Customer Support",
      "Investor Communication"
    ],
    image: "/assets/leadership/nodal-officer.png",
    fallbackInitials: "EZ"
  }
];

// Elegant Executive Portrait Frame with Graceful Fallback
function ExecutivePortrait({ src, alt, initials, isFeatured = false }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div 
      className={`relative overflow-hidden bg-[#F6F6F2] border border-[#E8E8E0] transition-transform duration-300 ${
        isFeatured 
          ? 'w-full sm:w-[250px] lg:w-[270px] xl:w-[280px] h-[280px] sm:h-[300px] lg:h-[320px] rounded-[20px] lg:rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] shrink-0' 
          : 'w-[96px] h-[116px] sm:w-[110px] sm:h-[132px] rounded-[16px] shadow-2xs shrink-0 group-hover:scale-[1.02]'
      }`}
    >
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover object-[center_15%]"
        />
      ) : null}

      {/* Elegant Architectural Placeholder if image is not yet placed in directory */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#FAF8F2] to-[#F1EDE2] text-[#8A6D00] p-3 text-center">
          <div className={`${isFeatured ? 'w-11 h-11' : 'w-9 h-9 sm:w-10 sm:h-10'} rounded-full bg-[#FFF9E6] border border-[#c8a200]/25 flex items-center justify-center mb-1.5 shadow-2xs`}>
            <RiUser3Line className={`text-[#9A7B00] ${isFeatured ? 'text-xl' : 'text-base sm:text-lg'}`} aria-hidden="true" />
          </div>
          <span className="font-display font-semibold text-xs tracking-wider text-[#9A7B00] uppercase">
            {initials}
          </span>
          {isFeatured && (
            <span className="text-[11px] text-[#8C8270] mt-1 tracking-tight">
              Executive Portrait
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function LeadershipSection() {
  const reduceMotion = useReducedMotion();

  // Animation variants
  const headerAnim = {
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }
  };

  const ceoAnim = {
    initial: { opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : -20 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: reduceMotion ? 0 : 0.65, ease: "easeOut" }
  };

  const directoryContainerAnim = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.06
      }
    }
  };

  const profileAnim = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }
    }
  };

  return (
    <section 
      id="leadership" 
      className="bg-white py-14 sm:py-16 lg:py-20 xl:py-24 border-t border-[#ededeb] scroll-mt-24 overflow-hidden"
      aria-labelledby="leadership-title"
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-12 2xl:px-16">
        
        {/* ── ASYMMETRIC EDITORIAL HEADER ── */}
        <motion.header {...headerAnim} className="mb-8 lg:mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-12 items-end justify-between">
            {/* Left Header */}
            <div>
              <span className="block uppercase text-xs font-semibold tracking-[0.18em] text-[#9A7B00] mb-3">
                OUR LEADERSHIP
              </span>
              <h2 
                id="leadership-title"
                tabIndex={-1}
                className="font-display font-semibold text-3xl sm:text-4xl lg:text-[48px] xl:text-[52px] text-[#1F1F1F] leading-[1.08] tracking-tight focus:outline-none"
              >
                People Behind <br />
                <span className="bg-gradient-to-r from-[#9a7b00] via-[#c8a200] to-[#9a7b00] bg-clip-text text-transparent">
                  the Platform
                </span>
              </h2>
            </div>

            {/* Right Header Description */}
            <div className="lg:max-w-[450px] lg:pb-1">
              <p className="text-[15px] sm:text-base leading-[1.68] text-[#64748B]">
                Meet the leadership team responsible for guiding Horizon Cap Worlds across investment strategy, technology, operations, finance, network development and investor support.
              </p>
            </div>
          </div>

          {/* Thin subtle gold line below header */}
          <div className="mt-8 pt-4 border-t border-[#c8a200]/20 flex items-center justify-between">
            <p className="text-xs sm:text-sm text-[#64748B]">
              Leadership across strategy, finance, technology and operations.
            </p>
            <div aria-hidden="true" className="w-12 h-[1px] bg-[#d8c788]/60 hidden sm:block" />
          </div>
        </motion.header>

        {/* ── FEATURED CEO PROFILE (Balanced Editorial Profile) ── */}
        <motion.article 
          {...ceoAnim}
          className="mb-10 lg:mb-14 rounded-[22px] lg:rounded-[26px] bg-[#FAFAF7] border border-[#c8a200]/22 p-6 sm:p-8 lg:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
        >
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-7 lg:gap-9 xl:gap-10 items-center sm:items-stretch">
            
            {/* CEO Portrait */}
            <ExecutivePortrait
              src={ceoProfile.image}
              alt="Portrait of Chief Executive Officer, Horizon Cap Worlds"
              initials={ceoProfile.fallbackInitials}
              isFeatured={true}
            />

            {/* Subtle Vertical Gold Divider (Desktop) */}
            <div 
              aria-hidden="true" 
              className="hidden sm:block w-[1px] bg-gradient-to-b from-transparent via-[#d8c788]/40 to-transparent self-stretch my-1 shrink-0" 
            />

            {/* CEO Information - Clean Natural Spacing without dead whitespace */}
            <div className="flex flex-col justify-center w-full min-w-0 py-0.5">
              <span className="block text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-[#9A7B00] mb-1.5">
                {ceoProfile.label}
              </span>

              <h3 className="font-display font-semibold text-2xl sm:text-[28px] lg:text-[32px] text-[#1F1F1F] leading-snug tracking-tight">
                {ceoProfile.name}
              </h3>

              <span className="block font-medium text-sm sm:text-[15px] text-[#1F1F1F] mt-0.5 mb-3">
                {ceoProfile.title}
              </span>

              {/* Subtle Brand Statement */}
              <div className="flex items-center gap-3 py-2 px-3.5 rounded-lg bg-[#FFF9E6]/70 border border-[#E6C84A]/30 mb-3 max-w-xl">
                <div aria-hidden="true" className="w-1 h-5 bg-[#9A7B00] rounded-full shrink-0" />
                <p className="text-xs sm:text-[13px] font-medium text-[#7A6100] italic">
                  {ceoProfile.statement}
                </p>
              </div>

              <p className="text-xs sm:text-[14px] leading-relaxed text-[#64748B] max-w-2xl mb-4">
                {ceoProfile.description}
              </p>

              {/* Responsibility Tags (Max 3, Pill-Style) */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#EAEAE5]">
                {ceoProfile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-medium bg-[#FFFBE8] border border-[rgba(200,162,0,0.22)] text-[#8A6D00] shadow-2xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </motion.article>

        {/* ── OTHER LEADERSHIP DIRECTORY (2-Column Editorial List) ── */}
        <motion.div
          variants={directoryContainerAnim}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 xl:gap-x-14"
        >
          {executiveDirectory.map((member) => (
            <motion.article
              key={member.number}
              variants={profileAnim}
              className="group py-5 px-3 sm:px-4 -mx-3 sm:-mx-4 border-b border-[#EAEAEA] transition-all duration-300 hover:bg-[#FFFEF5] rounded-xl flex items-start gap-4 sm:gap-5 cursor-default"
            >
              {/* Larger, Prominent Directory Portrait */}
              <ExecutivePortrait
                src={member.image}
                alt={`Portrait of ${member.title}, Horizon Cap Worlds`}
                initials={member.fallbackInitials}
                isFeatured={false}
              />

              {/* Profile Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display font-semibold text-xs sm:text-[13px] text-[#9A7B00] tabular-nums">
                    {member.number}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9A7B00]">
                    {member.code}
                  </span>
                </div>

                <h4 className="font-display font-semibold text-base sm:text-[17px] text-[#1F1F1F] group-hover:text-[#9A7B00] transition-colors leading-snug">
                  {member.name}
                </h4>
                <p className="text-xs sm:text-[13px] font-medium text-[#8A6D00] mt-0.5 mb-1.5">
                  {member.title}
                </p>

                <p className="text-xs sm:text-[13px] text-[#64748B] leading-relaxed mb-3">
                  {member.description}
                </p>

                {/* 2 Responsibility Tags */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {member.responsibilities.map((resp) => (
                    <span
                      key={resp}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FFFBE8] border border-[rgba(200,162,0,0.18)] text-[#8A6D00]"
                    >
                      {resp}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* ── SECTION BOTTOM CLOSING STATEMENT ── */}
        <div className="mt-12 sm:mt-14 lg:mt-16 text-center">
          <div aria-hidden="true" className="w-10 h-[1.5px] bg-[#d8c788] mx-auto mb-3.5 rounded-full" />
          <p className="text-xs sm:text-sm font-medium text-[#64748B] max-w-lg mx-auto">
            Leadership built around accountability, specialization and coordinated execution.
          </p>
        </div>

      </div>
    </section>
  );
}
