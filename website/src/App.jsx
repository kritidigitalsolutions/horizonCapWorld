import { useEffect, useRef, useState } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { RiArrowRightLine, RiArrowRightUpLine, RiArrowDownLine, RiMenu3Line, RiCloseLine, RiSunLine, RiCopperDiamondLine, RiFundsBoxLine, RiShieldCheckLine, RiLeafLine, RiGlobalLine } from 'react-icons/ri';
import AboutSection from './components/about/AboutSection.jsx';
import InvestmentSection from './InvestmentSection.jsx';
import ProcessSection from './ProcessSection.jsx';
import LeadershipSection from './LeadershipSection.jsx';
import WhyHorizonSection from './WhyHorizonSection.jsx';
import FaqSection from './FaqSection.jsx';
import FinalCtaSection from './FinalCtaSection.jsx';
import Footer from './Footer.jsx';
import Navbar from './Navbar.jsx';

const navigation = [['Home', null], ['About', 'about'], ['Investments', 'investments'], ['How It Works', 'process'], ['Leadership', 'leadership']];
const brandLogo = '/assets/Horizon%20Cap%20Worlds%20Gold%20Logo.png';
const sectors = [
  { name: 'Renewable Energy', caption: 'Powering what comes next', icon: RiSunLine, className: 'energy-label' },
  { name: 'Precious Metals', caption: 'Real assets. Lasting relevance.', icon: RiCopperDiamondLine, className: 'metals-label' }
];

function InformationDialog({ section, onClose }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(document.activeElement);
  const [sector, setSector] = useState('energy');
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = oldOverflow;
      dialog.close();
      if (triggerRef.current?.isConnected) triggerRef.current.focus();
      else document.querySelector('.menu-toggle')?.focus();
    };
  }, []);
  const titles = { 
    investments: 'Explore our investment focus.', 
    process: 'Clarity at every step.', 
    leadership: 'Leadership & governance.'
  };
  function onSectorKeyDown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'energy' : event.key === 'End' ? 'metals' : sector === 'energy' ? 'metals' : 'energy';
    setSector(next);
    document.getElementById(`${next}-tab`)?.focus();
  }
  return (
    <dialog ref={dialogRef} className="information-dialog" aria-labelledby="dialog-title" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="dialog-content">
        <div className="flex items-center justify-between gap-4"><span className="eyebrow">HORIZON CAP WORLDS</span><button className="icon-button" onClick={onClose} aria-label="Close information"><RiCloseLine /></button></div>
        <h2 id="dialog-title">{titles[section] || 'Horizon Cap Worlds'}</h2>
        {section === 'investments' && <><div className="sector-tabs" role="tablist" aria-label="Investment sectors" onKeyDown={onSectorKeyDown}><button id="energy-tab" role="tab" tabIndex={sector === 'energy' ? 0 : -1} aria-selected={sector === 'energy'} aria-controls="sector-panel" onClick={() => setSector('energy')}><RiSunLine />Renewable Energy</button><button id="metals-tab" role="tab" tabIndex={sector === 'metals' ? 0 : -1} aria-selected={sector === 'metals'} aria-controls="sector-panel" onClick={() => setSector('metals')}><RiCopperDiamondLine />Precious Metals</button></div><div id="sector-panel" role="tabpanel" tabIndex={0} aria-labelledby={`${sector}-tab`}><h3>{sector === 'energy' ? 'Capital for a changing energy landscape.' : 'A focus on tangible value.'}</h3><p>{sector === 'energy' ? 'Explore a sector centered on renewable energy infrastructure, including solar power and clean energy. Individual opportunities depend on the scope and terms of each investment plan.' : 'Explore a sector centered on precious metals and the role of real assets in a considered investment approach. The exposure, structure and duration depend on each investment plan.'}</p><div className="plan-note"><RiShieldCheckLine aria-hidden="true" /><p>Plan availability, investment amounts, duration and ROI are subject to the applicable plan terms. No specific investment plan is offered on this page.</p></div></div></>}
        {section === 'process' && <ol className="process-list">{[['Explore the sectors', 'Understand our focus on renewable energy and precious metals.'], ['Review the opportunity', 'Read the applicable plan terms, duration, risks and ROI structure before making a decision.'], ['Choose with clarity', 'Participate only after reviewing the full terms and confirming that the opportunity fits your objectives.']].map(([title, description], i) => <li key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol>}
        {section === 'leadership' && <><p>Leadership profiles and governance disclosures are not currently published on this page.</p><p>Company-specific credentials and management information should be reviewed alongside the applicable investment documents.</p></>}
        <button className="button button-secondary dialog-done" onClick={onClose}>Back to Horizon <RiArrowRightLine /></button>
      </div>
    </dialog>
  );
}

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [section, setSection] = useState(null);
  const reduceMotion = useReducedMotion();
  const menuButtonRef = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 18);
      const isVisible = (id) => {
        const bounds = document.getElementById(id)?.getBoundingClientRect();
        return bounds && bounds.top <= window.innerHeight * 0.4 && bounds.bottom > 110;
      };
      if (isVisible('faq')) setActiveSection('faq');
      else if (isVisible('why-horizon')) setActiveSection('why-horizon');
      else if (isVisible('leadership')) setActiveSection('leadership');
      else if (isVisible('process')) setActiveSection('process');
      else if (isVisible('investments')) setActiveSection('investments');
      else if (isVisible('about')) setActiveSection('about');
      else setActiveSection(null);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButtonRef.current?.focus(); } };
    const onResize = () => { if (window.innerWidth >= 1100) setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, [menuOpen]);
  function navigate(destination) {
    setMenuOpen(false);
    if (destination === 'about' || destination === 'investments' || destination === 'process' || destination === 'leadership' || destination === 'why-horizon' || destination === 'faq' || destination === 'cta' || destination === 'contact') {
      const el = document.getElementById(destination);
      if (el) {
        el.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
        return;
      }
    }
    if (destination) setSection(destination);
    else window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' });
  }
  const reveal = (delay = 0) => ({ initial: { opacity: 0, y: reduceMotion ? 0 : 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: reduceMotion ? 0 : 0.85, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] } });
  return (
    <MotionConfig reducedMotion="user">
      {/* Header: full width navbar with direct links to investor portal */}
      <Navbar 
        activeSection={activeSection} 
        onNavigate={navigate} 
        loginHref="https://investor.horizoncapworld.com/login" 
        registerHref="https://investor.horizoncapworld.com/register" 
      />
      <main id="main">
        <section id="home" className="hero" aria-labelledby="hero-title">
          <div className="hero-inner">
            <div className="hero-copy">
              <motion.div {...reveal(0.05)} className="eyebrow hero-eyebrow"><span className="eyebrow-line" />BUILDING VALUE. POWERING TOMORROW.</motion.div>
              <motion.h1 id="hero-title" {...reveal(0.15)}>Invest in the Future of <span className="gold-text">Energy</span> &amp; <span className="gold-text">Precious Metals</span></motion.h1>
              <motion.p {...reveal(0.25)} className="hero-description">Explore structured investment opportunities across renewable energy and precious metals through a platform designed around transparency, disciplined capital deployment and long-term value creation.</motion.p>
              <motion.div {...reveal(0.35)} className="hero-assurance"><RiShieldCheckLine aria-hidden="true" /><span>Rooted in real assets. Focused on tomorrow.</span></motion.div>
            </div>
            <div className="hero-visual">
              <motion.div className="hero-photo" initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.035 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 1.6 }}><img src="/assets/energy-metals-hero.webp" alt="Solar panels and wind turbines across a green landscape, with gold bullion in the foreground" fetchPriority="high" /><div className="photo-wash" /></motion.div>
              {sectors.map(({ name, caption, icon: Icon, className }, index) => <motion.div key={name} {...reveal(0.55 + index * 0.17)} className={`floating-label ${className}`}><span className="label-icon"><Icon aria-hidden="true" /></span><div><h2>{name}</h2><p>{caption}</p></div></motion.div>)}
              <div className="visual-caption"><span />A VISION GROUNDED IN REAL ASSETS</div>
            </div>
          </div>
          <div className="hero-bottom"><span>ENERGY. ASSETS. OPPORTUNITY.</span><a href="#our-focus" className="scroll-link">A broader perspective<RiArrowDownLine aria-hidden="true" /></a><span className="hero-index">01 <span>/</span> OUR HORIZON</span></div>
        </section>
        <section id="our-focus" className="focus-strip" aria-label="Our investment principles">
          <div className="focus-inner"><div className="focus-intro"><span className="eyebrow">OUR INVESTMENT PHILOSOPHY</span><h2>Real assets.<br />{' '}Purposeful capital.</h2></div><div className="focus-item"><RiLeafLine aria-hidden="true" /><div><h3>Investing in tomorrow</h3><p>Renewable energy with a long-term perspective.</p></div></div><div className="focus-item"><RiCopperDiamondLine aria-hidden="true" /><div><h3>Grounded in substance</h3><p>Precious metals. Tangible, enduring relevance.</p></div></div><div className="focus-item"><RiGlobalLine aria-hidden="true" /><div><h3>A considered approach</h3><p>Transparency at the heart of every opportunity.</p></div></div></div>
        </section>
        <AboutSection />
        <InvestmentSection />
        <ProcessSection />
        <LeadershipSection />
        <WhyHorizonSection />
        <FaqSection />
        <FinalCtaSection onExplore={navigate} />
        <Footer onNavigate={navigate} />
      </main>
      {section && <InformationDialog key={section} section={section} onClose={() => setSection(null)} />}
    </MotionConfig>
  );
}
