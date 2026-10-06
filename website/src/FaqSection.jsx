import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { RiAddLine, RiArrowRightLine } from 'react-icons/ri';

const faqItems = [
  {
    number: "01",
    question: "What investment opportunities does Horizon Cap Worlds present?",
    answer: "Horizon Cap Worlds presents opportunities across focused sectors, including renewable energy and precious metals. The relevant information and terms should be reviewed for each individual opportunity."
  },
  {
    number: "02",
    question: "Which sectors are currently covered?",
    answer: "The website currently highlights Renewable Energy and Precious Metals as focused investment sectors."
  },
  {
    number: "03",
    question: "How does the investment process work?",
    answer: "The process is designed to move from exploring an opportunity and understanding its terms to investing according to the applicable process and maintaining visibility afterward."
  },
  {
    number: "04",
    question: "What information is available before making an investment decision?",
    answer: "Relevant information about an opportunity, its structure and applicable terms should be reviewed before making any investment decision."
  },
  {
    number: "05",
    question: "How can I understand the terms associated with an opportunity?",
    answer: "Review the information provided for the specific opportunity and contact the Horizon Cap Worlds team if clarification is required."
  },
  {
    number: "06",
    question: "How can I contact Horizon Cap Worlds with an investment-related question?",
    answer: "Use the contact option provided on the website to reach the appropriate Horizon Cap Worlds team."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Motion variants
  const fadeUp = (delay = 0, y = 16) => ({
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : delay, ease: "easeOut" }
  });

  const listContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.06
      }
    }
  };

  const itemVariant = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }
    }
  };

  return (
    <section 
      id="faq" 
      className="bg-[#FAFAF7] py-14 sm:py-16 lg:py-20 xl:py-24 border-t border-[#EDEDEB] scroll-mt-24 overflow-hidden"
      aria-labelledby="faq-heading"
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-12 2xl:px-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-[0.38fr_0.62fr] gap-10 lg:gap-14 xl:gap-20 items-start">
          
          {/* ── LEFT SIDE: EDITORIAL INTRODUCTION (~38%) ── */}
          <motion.div {...fadeUp(0.05)} className="lg:sticky lg:top-28">
            {/* Small Gold Eyebrow */}
            <div className="flex items-center gap-2.5 mb-3.5">
              <div aria-hidden="true" className="w-5 h-[1.5px] bg-[#d8c788]" />
              <span className="uppercase text-xs font-semibold tracking-[0.18em] text-[#9A7B00]">
                FAQ
              </span>
            </div>

            {/* Large Dual-Color Heading */}
            <h2 
              id="faq-heading"
              tabIndex={-1}
              className="font-display font-[650] text-[42px] sm:text-[50px] lg:text-[58px] xl:text-[62px] leading-[0.98] tracking-tight text-[#171717] focus:outline-none mb-4"
            >
              Questions, <br />
              <span className="text-[#C8A200]">
                Made Clear.
              </span>
            </h2>

            {/* Supporting Description */}
            <p className="text-sm sm:text-base leading-relaxed text-[#667085] max-w-[340px] mb-8">
              Find clear answers to common questions about opportunities, process and ongoing visibility.
            </p>

            {/* Subtle Gold Line & Contact Link */}
            <div className="pt-6 border-t border-[#E8E8E3] flex items-start gap-3.5">
              <div aria-hidden="true" className="w-[2px] h-9 bg-[#C8A200] rounded-full shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs font-medium text-[#667085] mb-1">
                  Still have a question?
                </span>
                <a 
                  href="#contact" 
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('contact') || document.querySelector('.site-footer');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#171717] hover:text-[#C8A200] transition-colors group"
                >
                  <span>Speak with our team</span>
                  <RiArrowRightLine className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT SIDE: REFINED FAQ ACCORDION (~62%) ── */}
          <motion.div
            variants={listContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="w-full"
          >
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div 
                  key={item.number}
                  variants={itemVariant}
                  className="border-b border-[#E8E8E3] first:border-t lg:first:border-t-0"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.number}`}
                    id={`faq-question-${item.number}`}
                    className="w-full text-left py-4 sm:py-5 flex items-start justify-between gap-4 cursor-pointer focus:outline-none group relative transition-colors duration-200"
                  >
                    {/* Active Indicator & Content */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      
                      {/* Subtle Active Gold Line beside active question */}
                      <div 
                        aria-hidden="true" 
                        className={`w-[2px] h-5 rounded-full transition-all duration-300 mt-0.5 shrink-0 ${
                          isOpen ? 'bg-[#C8A200] opacity-100 scale-y-100' : 'bg-transparent opacity-0 scale-y-50'
                        }`} 
                      />

                      {/* Number in Muted Gold */}
                      <span className="font-display font-semibold text-xs sm:text-[13px] text-[#9A7B00] tabular-nums tracking-wider pt-0.5 shrink-0">
                        {item.number}
                      </span>

                      {/* Question Text */}
                      <span className={`font-display text-sm sm:text-base lg:text-[16.5px] leading-snug tracking-tight transition-colors duration-200 ${
                        isOpen 
                          ? 'text-[#171717] font-semibold' 
                          : 'text-[#2B2B2B] font-medium group-hover:text-[#171717]'
                      }`}>
                        {item.question}
                      </span>
                    </div>

                    {/* Plus / Rotate Icon */}
                    <div className="shrink-0 pt-0.5 pl-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isOpen ? 'bg-[#FFF9E6] text-[#9A7B00]' : 'text-[#8C8270] group-hover:text-[#171717]'
                      }`}>
                        <RiAddLine 
                          size={18} 
                          className={`transition-transform duration-300 ${
                            isOpen ? 'rotate-45 text-[#9A7B00]' : 'rotate-0'
                          }`}
                          aria-hidden="true" 
                        />
                      </div>
                    </div>
                  </button>

                  {/* Expandable Smooth Answer */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${item.number}`}
                        role="region"
                        aria-labelledby={`faq-question-${item.number}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-5 pl-[30px] sm:pl-[42px] pr-4 sm:pr-8 text-xs sm:text-[14px] leading-relaxed text-[#667085]">
                          <p>{item.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>

        </div>

      </div>
    </section>
  );
}
