import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, getReferralLink } from '../context/AuthContext';
import { updateProfile as apiUpdateProfile } from '../api/authApi';
import { uploadFileToCloudinary } from '../api/uploadApi';
import { quickLinks } from '../data/userMockData';
import {
  RiFundsLine, RiLineChartLine, RiArrowDownLine, RiArrowUpLine,
  RiGroupLine, RiNodeTree, RiTrophyLine, RiExchangeDollarLine,
  RiUser3Line, RiCustomerService2Line,
  RiFileCopyLine, RiShareLine, RiArrowRightLine,
  RiWallet3Line, RiSafeLine, RiCheckLine, RiSparklingLine,
  RiAwardLine, RiShieldCheckLine, RiTimeLine, RiCalendarLine,
  RiCoinsLine, RiGlobalLine, RiCameraLine, RiEditLine
} from 'react-icons/ri';
import { UilBolt } from '@iconscout/react-unicons';

const quickLinkIcons = {
  'Plans': RiFundsLine,
  'Investments': RiLineChartLine,
  'Deposit': RiArrowDownLine,
  'Withdraw': RiArrowUpLine,
  'Referrals': RiGroupLine,
  'Ranks': RiTrophyLine,
  'History': RiExchangeDollarLine,
  'Referral Plans': RiNodeTree,
  'Profile': RiUser3Line,
  'Support': RiCustomerService2Line,
};

export default function UserDashboard() {
  const { user } = useAuth();
  const [streamingValue, setStreamingValue] = useState(0);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState(() => localStorage.getItem('horizon_user_avatar') || '');
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const referralLink = user?.referralLink || getReferralLink(user?.id || 'HORIZON-USR-07');
  const userId = user?.id || 'HORIZON-USR-07';
  const userName = user?.fullName || user?.name || 'William Max';
  const userSponsor = user?.sponsorId || 'HORIZON-USR-01';

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Sync Avatar across header & profile
  useEffect(() => {
    const handleAvatarSync = (e) => {
      setAvatar(e.detail !== undefined ? e.detail : (localStorage.getItem('horizon_user_avatar') || ''));
    };
    window.addEventListener('user-avatar-change', handleAvatarSync);
    window.addEventListener('storage', handleAvatarSync);
    return () => {
      window.removeEventListener('user-avatar-change', handleAvatarSync);
      window.removeEventListener('storage', handleAvatarSync);
    };
  }, []);

  // Avatar Upload directly from Dashboard (Cloudinary upload with auto-cleanup)
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target.result;
        setAvatar(dataUrl);
      };
      reader.readAsDataURL(file);

      try {
        const previousAvatar = avatar;
        const uploadRes = await uploadFileToCloudinary(file, {
          folder: 'horizoncap/avatars/users',
          oldUrl: previousAvatar,
        });

        if (uploadRes?.secure_url) {
          const finalUrl = uploadRes.secure_url;
          setAvatar(finalUrl);
          localStorage.setItem('horizon_user_avatar', finalUrl);
          window.dispatchEvent(new CustomEvent('user-avatar-change', { detail: finalUrl }));
          await apiUpdateProfile({ avatar: finalUrl });
          updateUser({ avatar: finalUrl });
        }
      } catch (err) {
        console.warn('Avatar direct upload fallback:', err.message);
      }
    }
  };

  // Simulate loading
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // Live per-second streaming ROI
  useEffect(() => {
    if (!user || user.perSecondRate <= 0) return;
    streamRef.current = setInterval(() => {
      setStreamingValue(prev => prev + (user.perSecondRate || 0.0007951));
    }, 1000);
    return () => clearInterval(streamRef.current);
  }, [user]);

  // Countdown to next daily payout (midnight)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow - now;
      setCountdown({
        hours: String(Math.floor(diff / 3600000)).padStart(2, '0'),
        minutes: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        seconds: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const copyUserId = () => {
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <div className="page-enter space-y-6 font-poppins">
        <div className="skeleton h-56 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="page-enter space-y-6 pb-12 font-poppins">
      {/* ──────────────── LUXURY GOLD & WHITE DECORATED HERO WELCOME CARD ──────────────── */}
      <div className="card p-6 sm:p-8 md:p-9 bg-gradient-to-r from-gold-50/95 via-white to-amber-50/80 border-2 border-gold-300/90 shadow-gold rounded-3xl relative overflow-hidden">
        {/* Subtle ambient light glows */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-gold-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 w-72 h-72 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Status & Date Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold-200/80 pb-4 text-xs font-poppins">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-xs font-extrabold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Multi-Asset Yield Streaming Active
              </span>
              <span className="text-slate-400 font-medium hidden sm:inline">•</span>
              <span className="text-slate-600 font-semibold hidden sm:flex items-center gap-1">
                <RiCalendarLine size={14} className="text-gold-600" /> {currentDateFormatted}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium text-xs">Next Daily Settlement:</span>
              <span className="px-3 py-1 rounded-xl bg-gold-100 text-gold-900 border border-gold-300 font-mono font-bold text-xs shadow-2xs">
                {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
              </span>
            </div>
          </div>

          {/* Main Hero Row: Avatar + Dynamic Name + Badges + CTAs */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5 sm:gap-7 min-w-0">
              {/* 👑 PROMINENT LUXURY GOLD LAYERED AVATAR 👑 */}
              <div className="relative flex-shrink-0 group">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Triple-Layer Gold Ring Frame */}
                <div className="p-1 rounded-full bg-gradient-to-tr from-amber-500 via-gold-300 to-amber-600 shadow-gold ring-4 ring-gold-200/90">
                  <div className="p-0.5 rounded-full bg-white">
                    <div className="w-22 h-22 sm:w-26 sm:h-26 md:w-28 md:h-28 rounded-full overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner relative">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={userName}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-4xl sm:text-5xl font-black text-gold-400 font-poppins">
                          {(userName || 'User').charAt(0)}
                        </span>
                      )}

                      {/* Hover Camera Icon for Quick Change */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-gold-300 text-[11px] font-bold cursor-pointer gap-1"
                        title="Change Profile Photo"
                      >
                        <RiCameraLine size={22} />
                        <span>Update</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Greeting & Dynamic User Name */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs sm:text-sm font-bold text-gold-700 uppercase tracking-widest flex items-center gap-1.5 font-poppins">
                    <RiSparklingLine size={16} className="text-gold-500" />
                    {getGreeting()}, Welcome back
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-poppins tracking-tight text-slate-950">
                  {userName}
                </h1>

                {/* User Badges & ID Row */}
                <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs">
                  <button
                    type="button"
                    onClick={copyUserId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-gold-50 border border-slate-200 text-slate-800 font-mono font-bold transition-colors cursor-pointer shadow-2xs"
                    title="Click to copy User ID"
                  >
                    <span>ID: {userId}</span>
                    <RiFileCopyLine size={13} className="text-gold-600" />
                    {copiedId && <span className="text-[10px] text-emerald-600 font-sans font-bold">Copied!</span>}
                  </button>

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-gold-400 to-amber-400 text-slate-950 font-extrabold shadow-gold text-xs font-poppins">
                    <RiAwardLine size={14} /> Level {user?.rank?.level || 1} {user?.rank?.name || user?.currentRank || 'Bronze Explorer'}
                  </span>

                  <span className="text-slate-500 text-xs hidden sm:inline font-mono">
                    Sponsor: <strong className="text-slate-800 font-bold">{userSponsor}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-start lg:self-auto flex-shrink-0">
              {/* Button 1: Make Deposit */}
              <Link
                to="/deposit"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-slate-950 shadow-gold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <RiArrowDownLine size={16} />
                <span>Make Deposit</span>
              </Link>

              {/* Button 2: Explore Plans */}
              <Link
                to="/plans"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-gold-50 text-slate-900 border-2 border-gold-400 hover:border-gold-500 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <RiFundsLine size={16} className="text-gold-600" />
                <span>Explore Plans</span>
              </Link>

              {/* Button 3: Withdraw */}
              <Link
                to="/withdraw"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <RiArrowUpLine size={16} />
                <span>Withdraw</span>
              </Link>
            </div>
          </div>

          {/* 3 Highlight Metric Cards Embedded In Hero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4 border-t border-gold-200/80">
            {/* 1. Deposit Wallet */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-gold-300 transition-colors shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                  <RiWallet3Line size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deposit Wallet</span>
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    ${(user?.depositWallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <Link to="/deposit" className="text-xs font-bold text-gold-700 hover:text-gold-900 underline">
                + Add
              </Link>
            </div>

            {/* 2. Earning Wallet */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-colors shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                  <RiSafeLine size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Earning Wallet</span>
                  <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
                    ${(user?.earningWallet || user?.earningsWallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <Link to="/withdraw" className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline">
                Payout
              </Link>
            </div>

            {/* 3. Live Streaming Yield */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-gold-100/70 to-amber-100/50 border border-gold-300 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gold-300 flex items-center justify-center text-gold-600 shadow-2xs">
                  <UilBolt size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gold-900 uppercase tracking-wider block">Live Yield Streaming</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black font-mono text-slate-950">
                      ${streamingValue.toFixed(6).split('.')[0]}
                    </span>
                    <span className="text-xs font-black font-mono text-gold-700">
                      .{streamingValue.toFixed(6).split('.')[1]}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 font-mono">
                +${user?.perSecondRate ? user.perSecondRate.toFixed(7) : '0.0000000'}/s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── REAL-TIME STREAMING DETAIL CARD ──────────────── */}
      <div className="card-gold p-6 sm:p-7 relative overflow-hidden rounded-3xl shadow-card border border-gold-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          {/* Left: Streaming counter */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="live-dot"></div>
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800 font-poppins">
                Live Real-Time Investment Profit Streaming
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <UilBolt size={36} className="text-gold-500 flex-shrink-0" />
              <span className="streaming-value text-4xl sm:text-6xl font-black text-slate-950 font-poppins">
                ${streamingValue.toFixed(7).split('.')[0]}
              </span>
              <span className="streaming-value text-4xl sm:text-6xl font-black text-slate-950">.</span>
              <span className="streaming-value text-3xl sm:text-5xl font-black text-gold-600 font-poppins">
                {streamingValue.toFixed(7).split('.')[1]}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-poppins font-medium">
              Streaming rate: <span className="text-emerald-700 font-extrabold font-mono">+${user?.perSecondRate?.toFixed(7) || '0.0007951'}/sec</span>
              {' · '}
              <span className="text-slate-600">Active Assets: Solar Eco Farm & Platinum Vault Offtake</span>
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Link
                to="/plans"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-slate-950 shadow-gold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <UilBolt size={16} />
                <span>Explore Yield Plans</span>
              </Link>
              <Link
                to="/investments"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>My Active Portfolios</span>
                <RiArrowRightLine size={14} />
              </Link>
            </div>
          </div>

          {/* Right: Countdown to next settlement */}
          <div className="flex flex-col items-center gap-2 bg-white/90 p-5 rounded-2xl border border-gold-200 shadow-sm flex-shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 font-poppins">
              Next Daily Settlement
            </span>
            <div className="flex items-center gap-2.5">
              <div className="text-center">
                <div className="countdown-digit text-xl font-bold font-mono">{countdown.hours}</div>
                <div className="countdown-label text-[10px]">HR</div>
              </div>
              <span className="text-xl font-bold text-slate-400 mb-4">:</span>
              <div className="text-center">
                <div className="countdown-digit text-xl font-bold font-mono">{countdown.minutes}</div>
                <div className="countdown-label text-[10px]">MIN</div>
              </div>
              <span className="text-xl font-bold text-slate-400 mb-4">:</span>
              <div className="text-center">
                <div className="countdown-digit text-xl font-bold font-mono">{countdown.seconds}</div>
                <div className="countdown-label text-[10px]">SEC</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── REFERRAL LINK LUXURY BOX ──────────────── */}
      <div className="referral-box p-6 rounded-3xl bg-gradient-to-r from-gold-50/80 via-white to-slate-50 border border-gold-300 shadow-gold">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-100 border border-gold-300 flex items-center justify-center text-gold-700 shadow-2xs">
              <RiGroupLine size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gold-800 font-poppins">Affiliate Partner Network</p>
              <p className="text-sm font-bold text-slate-900 font-poppins">Share your verified referral link to unlock 5-tier leadership commissions</p>
            </div>
          </div>

          <Link to="/referrals" className="text-xs font-bold text-gold-800 hover:text-gold-950 underline hidden sm:inline">
            View Downline Matrix →
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 rounded-2xl bg-white border border-gold-200 text-xs sm:text-sm font-mono font-bold text-slate-900 font-poppins truncate shadow-xs select-all">
            {referralLink}
          </div>
          <button
            type="button"
            onClick={copyReferralLink}
            className={`btn text-xs px-5 py-3 rounded-2xl flex-shrink-0 font-bold cursor-pointer transition-all ${
              copiedRef ? 'btn-secondary text-emerald-700 border-emerald-300 bg-emerald-50' : 'btn-primary shadow-gold'
            }`}
          >
            <RiFileCopyLine size={15} /> {copiedRef ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* ──────────────── QUICK ACCESS LINKS ──────────────── */}
      <div className="card p-6 sm:p-7 border border-slate-200 shadow-sm">
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 font-poppins">Quick Navigation Hub</p>
          <p className="text-base font-bold text-slate-800 font-poppins">Investor Platform Shortcuts</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {quickLinks.map((link) => {
            const Icon = quickLinkIcons[link.label] || RiFundsLine;
            return (
              <Link key={link.path} to={link.path} className="quick-link-card p-4 rounded-2xl border border-slate-200/80 hover:border-gold-300 bg-white hover:bg-gold-50/30 transition-all flex flex-col items-center justify-center gap-2 shadow-2xs group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-110" style={{ background: link.bgColor }}>
                  <Icon size={22} style={{ color: link.color }} />
                </div>
                <span className="text-xs font-bold text-slate-700 font-poppins text-center">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
