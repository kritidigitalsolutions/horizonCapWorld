import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  RiArrowRightUpLine, 
  RiCheckLine, 
  RiSendPlaneLine, 
  RiShieldCheckLine, 
  RiTimeLine,
  RiBuilding4Line,
  RiAlertLine
} from 'react-icons/ri';
import { submitContactInquiry } from './api/contactApi';

export default function FinalCtaSection({ onExplore }) {
  const reduceMotion = useReducedMotion();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    sector: 'Renewable Energy',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Animation variants
  const fadeUp = (delay = 0, y = 16) => ({
    initial: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { 
      duration: reduceMotion ? 0 : 0.6, 
      delay: reduceMotion ? 0 : delay, 
      ease: [0.22, 1, 0.36, 1] 
    }
  });

  const handleCtaClick = () => {
    if (onExplore) {
      onExplore('investments');
    } else {
      const el = document.getElementById('investments');
      el?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await submitContactInquiry({
        name: formData.name,
        email: formData.email,
        sector: formData.sector,
        message: formData.message,
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Contact inquiry error:', err);
      setErrorMsg(err.message || 'Unable to submit inquiry. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      sector: 'Renewable Energy',
      message: ''
    });
    setErrorMsg('');
    setIsSubmitted(false);
  };

  return (
    <section 
      id="contact"
      className="bg-[#FAF9F5] text-[#171717] relative overflow-hidden border-t border-[#EAE6DB] py-16 sm:py-20 lg:py-24 scroll-mt-24"
      style={{ fontFamily: "'Inter', sans-serif" }}
      aria-labelledby="cta-heading"
    >
      <div id="cta" className="absolute top-0 pointer-events-none" />
      {/* ── BACKGROUND: SUBTLE WARM ACCENTS & ARCHITECTURAL GRID ── */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Soft Warm Radial Glow */}
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-[#FFF5D0]/35 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[#FFF8DB]/40 rounded-full blur-3xl" />

        {/* Faint Architectural Grid Lines */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #171717 1px, transparent 1px),
              linear-gradient(to bottom, #171717 1px, transparent 1px)
            `,
            backgroundSize: '72px 72px'
          }}
        />

        {/* Subtle geometric gold diagonal linework */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <line 
            x1="30%" 
            y1="110%" 
            x2="95%" 
            y2="-10%" 
            stroke="#C8A200" 
            strokeOpacity="0.12" 
            strokeWidth="1" 
          />
          <line 
            x1="50%" 
            y1="115%" 
            x2="110%" 
            y2="-5%" 
            stroke="#C8A200" 
            strokeOpacity="0.07" 
            strokeWidth="1" 
          />
        </svg>
      </div>

      {/* ── MAIN CONTAINER ── */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-12 2xl:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ── LEFT COLUMN: EDITORIAL STATEMENT (7 Cols on desktop) ── */}
          <div className="lg:col-span-7 max-w-2xl">
            {/* Eyebrow */}
            <motion.div {...fadeUp(0.04, 10)} className="flex items-center gap-2.5 mb-4">
              <div aria-hidden="true" className="w-5 h-[1.5px] bg-[#C8A200]" />
              <span 
                className="uppercase text-xs font-semibold text-[#9A7B00]"
                style={{ letterSpacing: '0.18em' }}
              >
                TAKE THE NEXT STEP
              </span>
            </motion.div>

            {/* Large Two-Line Heading (Clean line breaks, no awkward wrapping) */}
            <h2 
              id="cta-heading"
              tabIndex={-1}
              className="font-display font-[650] text-[40px] sm:text-[54px] lg:text-[62px] xl:text-[70px] leading-[1.0] tracking-tight focus:outline-none mb-6 text-[#171717]"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <motion.span 
                {...fadeUp(0.1, 16)}
                className="block text-[#171717]"
              >
                Explore What Comes
              </motion.span>
              <motion.span 
                {...fadeUp(0.2, 16)}
                className="block text-[#C8A200]"
              >
                Next.
              </motion.span>
            </h2>

            {/* Supporting Text */}
            <motion.p 
              {...fadeUp(0.28, 12)}
              className="text-[16px] sm:text-[17.5px] leading-relaxed text-[#5A5D64] max-w-[580px] mb-8 font-normal"
            >
              Explore focused opportunities, understand the structure and find the information you need to take the next step with clarity. Connect directly with our team for institutional collaboration.
            </motion.p>

            {/* Action & Direct Navigation */}
            <motion.div {...fadeUp(0.36, 12)} className="flex flex-wrap items-center gap-4 mb-10">
              <button
                type="button"
                onClick={handleCtaClick}
                className="inline-flex items-center justify-center gap-2.5 h-[50px] px-7 rounded-[10px] bg-[#171717] hover:bg-[#2c2c2c] text-white font-medium text-sm tracking-tight shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
              >
                <span>Explore Investment Sectors</span>
                <RiArrowRightUpLine size={18} className="text-[#C8A200]" aria-hidden="true" />
              </button>
            </motion.div>

            {/* Institutional Pillars / Reassurance Grid */}
            <motion.div 
              {...fadeUp(0.42, 10)} 
              className="pt-6 border-t border-[#E5E0D2] grid grid-cols-1 sm:grid-cols-3 gap-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFF7D6] text-[#9A7B00] flex items-center justify-center shrink-0 mt-0.5 border border-[#EEDB97]/50">
                  <RiShieldCheckLine size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#171717] mb-0.5">Strict Confidentiality</h4>
                  <p className="text-[11.5px] leading-relaxed text-[#6E727A]">Private institutional communication.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFF7D6] text-[#9A7B00] flex items-center justify-center shrink-0 mt-0.5 border border-[#EEDB97]/50">
                  <RiTimeLine size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#171717] mb-0.5">Prompt Response</h4>
                  <p className="text-[11.5px] leading-relaxed text-[#6E727A]">Dedicated partner correspondence.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFF7D6] text-[#9A7B00] flex items-center justify-center shrink-0 mt-0.5 border border-[#EEDB97]/50">
                  <RiBuilding4Line size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#171717] mb-0.5">Structured Information</h4>
                  <p className="text-[11.5px] leading-relaxed text-[#6E727A]">Clear opportunity parameters.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: LIGHT LUXURY INQUIRY FORM (5 Cols on desktop) ── */}
          <motion.div 
            {...fadeUp(0.18, 16)}
            className="lg:col-span-5 relative"
          >
            <div className="bg-white border border-[#E5E0D3] rounded-2xl p-6 sm:p-8 shadow-[0_16px_45px_rgba(200,162,0,0.06),0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden">
              
              {/* Gold Top Accent Line */}
              <div 
                aria-hidden="true" 
                className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FFD700] via-[#C8A200] to-[#E4BD15]" 
              />

              {isSubmitted ? (
                /* Success View */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-full bg-[#FFF8DB] border border-[#E3CD78] text-[#9A7B00] flex items-center justify-center mb-5 text-2xl shadow-sm">
                    <RiCheckLine />
                  </div>
                  <h3 
                    className="text-2xl font-semibold text-[#171717] mb-2"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Inquiry Received
                  </h3>
                  <p className="text-sm text-[#5A5D64] max-w-xs mb-6 leading-relaxed">
                    Thank you, <strong className="text-[#171717] font-semibold">{formData.name}</strong>. Your inquiry regarding <span className="text-[#9A7B00] font-medium">{formData.sector}</span> has been received. Our team will review your message and reply promptly.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs uppercase tracking-wider font-semibold text-[#9A7B00] hover:text-[#171717] underline underline-offset-4 cursor-pointer transition-colors"
                  >
                    Submit another inquiry
                  </button>
                </motion.div>
              ) : (
                /* Light Institutional Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="mb-2">
                    <span 
                      className="block text-[11px] font-semibold text-[#9A7B00] uppercase tracking-[0.16em] mb-1"
                    >
                      DIRECT CONTACT
                    </span>
                    <h3 
                      className="text-xl sm:text-2xl font-semibold text-[#171717] tracking-tight"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Connect with Horizon
                    </h3>
                  </div>

                  {/* Name field */}
                  <div>
                    <label 
                      htmlFor="inquiry-name" 
                      className="block text-[11px] uppercase tracking-wider font-semibold text-[#5A5D64] mb-1.5"
                    >
                      Full Name *
                    </label>
                    <input
                      id="inquiry-name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Daniel Wei"
                      className="w-full h-11 px-3.5 rounded-lg bg-[#FAF9F6] border border-[#DCD6C7] text-sm text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#C8A200] focus:ring-2 focus:ring-[#C8A200]/15 transition-all"
                    />
                  </div>

                  {/* Email field */}
                  <div>
                    <label 
                      htmlFor="inquiry-email" 
                      className="block text-[11px] uppercase tracking-wider font-semibold text-[#5A5D64] mb-1.5"
                    >
                      Institutional / Work Email *
                    </label>
                    <input
                      id="inquiry-email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@organization.com"
                      className="w-full h-11 px-3.5 rounded-lg bg-[#FAF9F6] border border-[#DCD6C7] text-sm text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#C8A200] focus:ring-2 focus:ring-[#C8A200]/15 transition-all"
                    />
                  </div>

                  {/* Sector of interest */}
                  <div>
                    <label 
                      htmlFor="inquiry-sector" 
                      className="block text-[11px] uppercase tracking-wider font-semibold text-[#5A5D64] mb-1.5"
                    >
                      Sector of Interest
                    </label>
                    <div className="relative">
                      <select
                        id="inquiry-sector"
                        name="sector"
                        value={formData.sector}
                        onChange={handleChange}
                        className="w-full h-11 px-3.5 rounded-lg bg-[#FAF9F6] border border-[#DCD6C7] text-sm text-[#171717] focus:outline-none focus:bg-white focus:border-[#C8A200] focus:ring-2 focus:ring-[#C8A200]/15 transition-all cursor-pointer appearance-none"
                      >
                        <option value="Renewable Energy">Renewable Energy</option>
                        <option value="Precious Metals">Precious Metals</option>
                        <option value="Both Sectors (Renewable Energy & Precious Metals)">Both Sectors (Renewable Energy & Precious Metals)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-[#6E727A]">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Message field */}
                  <div>
                    <label 
                      htmlFor="inquiry-message" 
                      className="block text-[11px] uppercase tracking-wider font-semibold text-[#5A5D64] mb-1.5"
                    >
                      Inquiry Note (Optional)
                    </label>
                    <textarea
                      id="inquiry-message"
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Specify your investment focus, inquiries or allocation preferences..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF9F6] border border-[#DCD6C7] text-sm text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#C8A200] focus:ring-2 focus:ring-[#C8A200]/15 transition-all resize-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                      <RiAlertLine size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit CTA Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group w-full h-[50px] rounded-[10px] text-[#27240D] font-semibold text-sm tracking-tight cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(200,162,0,0.18)] hover:shadow-[0_8px_24px_rgba(200,162,0,0.28)] hover:-translate-y-0.5 active:translate-y-0"
                      style={{
                        background: 'linear-gradient(115deg, #FFDF49, #FFD700 55%, #E4BD15)'
                      }}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-[#27240D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Sending Inquiry via Email...</span>
                        </div>
                      ) : (
                        <>
                          <span>Submit Inquiry</span>
                          <RiSendPlaneLine 
                            size={17} 
                            className="transition-transform duration-200 group-hover:translate-x-1" 
                            aria-hidden="true" 
                          />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Disclaimer notice */}
                  <p className="text-[11px] text-[#8C8F96] text-center pt-1 leading-normal">
                    Strict confidentiality maintained. No guaranteed returns or investment offers are made through this inquiry.
                  </p>
                </form>
              )}

            </div>
          </motion.div>

        </div>
      </div>

      {/* ── BOTTOM EDITORIAL DIVIDER & STATEMENT ── */}
      <div className="w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 relative z-10 pt-12 sm:pt-16">
        <div className="pt-6 border-t border-[#E5E0D3]">
          <p 
            className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3.5 uppercase text-[11px] sm:text-xs font-medium tracking-[0.2em] text-[#7E828A]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <span>FOCUSED SECTORS</span>
            <span className="text-[#C8A200] font-bold text-xs" aria-hidden="true">•</span>
            <span>STRUCTURED APPROACH</span>
            <span className="text-[#C8A200] font-bold text-xs" aria-hidden="true">•</span>
            <span>ONGOING VISIBILITY</span>
          </p>
        </div>
      </div>
    </section>
  );
}
