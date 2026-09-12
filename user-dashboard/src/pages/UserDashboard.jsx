import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, getReferralLink } from '../context/AuthContext';
import { updateProfile as apiUpdateProfile } from '../api/authApi';
import { uploadFileToCloudinary } from '../api/uploadApi';
import {
  RiFundsLine, RiLineChartLine, RiArrowDownLine, RiArrowUpLine,
  RiGroupLine, RiNodeTree, RiTrophyLine, RiExchangeDollarLine,
  RiUser3Line, RiCustomerService2Line,
  RiFileCopyLine, RiArrowRightLine,
  RiWallet3Line, RiSafeLine, RiSparklingLine,
  RiAwardLine, RiCalendarLine, RiCameraLine
} from 'react-icons/ri';
import { UilBolt } from '@iconscout/react-unicons';

const quickLinks = [
  { name: 'Plans', path: '/plans' },
  { name: 'Investments', path: '/investments' },
  { name: 'Deposit', path: '/deposit' },
  { name: 'Withdraw', path: '/withdraw' },
  { name: 'Referrals', path: '/referrals' },
  { name: 'Ranks', path: '/ranks' },
  { name: 'History', path: '/transactions' },
  { name: 'Referral Plans', path: '/referral-plans' },
  { name: 'Profile', path: '/profile' },
  { name: 'Support', path: '/support' },
];

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

// Helper to retrieve and restore continuous streaming state across page refreshes
const getInitialStreamingState = () => {
  try {
    const savedUser = localStorage.getItem('horizon_user');
    const userObj = savedUser ? JSON.parse(savedUser) : null;

    let baseProfit = Number(userObj?.totalProfit || userObj?.totalEarned || 0);
    let rate = Number(userObj?.perSecondRate || 0);
    let baseTime = Date.now();

    // If user has NO active streaming rate, don't accrue fake earnings
    if (rate <= 0) {
      return { baseValue: baseProfit, baseTime, rate: 0 };
    }

    const savedStream = localStorage.getItem('horizon_streaming_state');
    if (savedStream) {
      const streamObj = JSON.parse(savedStream);
      if (streamObj && typeof streamObj.baseProfit === 'number' && streamObj.timestamp) {
        const streamRate = Number(streamObj.rate !== undefined ? streamObj.rate : rate);
        if (streamRate > 0) {
          const elapsedSec = Math.max(0, (Date.now() - streamObj.timestamp) / 1000);
          const accruedSinceSave = streamObj.baseProfit + (elapsedSec * streamRate);
          if (accruedSinceSave >= baseProfit) {
            baseProfit = accruedSinceSave;
            rate = streamRate;
            baseTime = Date.now();
          }
        }
      }
    }

    if (userObj && userObj.lastYieldSync && rate > 0) {
      const syncElapsedSec = Math.max(0, (Date.now() - new Date(userObj.lastYieldSync).getTime()) / 1000);
      const userAccrued = Number(userObj.totalProfit || userObj.totalEarned || 0) + (syncElapsedSec * rate);
      if (userAccrued > baseProfit) {
        baseProfit = userAccrued;
      }
    }

    return { baseValue: baseProfit, baseTime, rate };
  } catch (e) {
    return { baseValue: 0, baseTime: Date.now(), rate: 0 };
  }
};

export default function UserDashboard() {
  const { user, updateUser, refreshUser } = useAuth();
  const streamAnchorRef = useRef(getInitialStreamingState());
  const [streamingValue, setStreamingValue] = useState(streamAnchorRef.current.baseValue);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [loading, setLoading] = useState(() => !localStorage.getItem('horizon_user'));
  const [avatar, setAvatar] = useState(() => localStorage.getItem('horizon_user_avatar') || '');
  const fileInputRef = useRef(null);

  // Real-time synchronization with Admin deposit approvals, new investments & live wallet updates
  useEffect(() => {
    if (refreshUser) {
      refreshUser();
    }

    const pollInterval = setInterval(() => {
      if (refreshUser && document.visibilityState === 'visible') {
        refreshUser();
      }
    }, 8000);

    const handleSync = () => {
      if (refreshUser) refreshUser();
    };

    window.addEventListener('focus', handleSync);
    window.addEventListener('horizon-transactions-change', handleSync);
    window.addEventListener('horizon-user-update', handleSync);
    window.addEventListener('horizon-deposit-approved', handleSync);
    window.addEventListener('horizon-investment-created', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('horizon-transactions-change', handleSync);
      window.removeEventListener('horizon-user-update', handleSync);
      window.removeEventListener('horizon-deposit-approved', handleSync);
      window.removeEventListener('horizon-investment-created', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [refreshUser]);

  const referralLink = user?.referralLink || (user?.id || user?.customId ? getReferralLink(user?.customId || user?.id) : '');
  const userId = user?.customId || user?.id || '';
  const userName = user?.fullName || user?.name || 'Investor';
  const userSponsor = user?.sponsorId || 'HORIZON-HQ';

  const hasActiveStreaming = Number(user?.perSecondRate || 0) > 0 || Number(user?.activeInvestments || 0) > 0;
  const activeRate = hasActiveStreaming ? Number(user?.perSecondRate || 0) : 0;

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

  // Instant or smooth loading resolution
  useEffect(() => {
    if (user) {
      setLoading(false);
    } else {
      const t = setTimeout(() => setLoading(false), 150);
      return () => clearTimeout(t);
    }
  }, [user]);

  // Live continuous high-frequency streaming ROI ticker
  useEffect(() => {
    const currentRate = (user?.perSecondRate !== undefined && user?.perSecondRate !== null && Number(user.perSecondRate) > 0)
      ? Number(user.perSecondRate)
      : 0;

    streamAnchorRef.current.rate = currentRate;

    if (currentRate <= 0) {
      const baseProfit = Number(user?.totalProfit || user?.totalEarned || 0);
      streamAnchorRef.current.baseValue = baseProfit;
      streamAnchorRef.current.baseTime = Date.now();
      setStreamingValue(baseProfit);
      try {
        localStorage.setItem('horizon_streaming_state', JSON.stringify({
          baseProfit,
          timestamp: Date.now(),
          rate: 0,
        }));
      } catch (err) {}
      return;
    }

    const tickStream = () => {
      const now = Date.now();
      const elapsedSec = Math.max(0, (now - streamAnchorRef.current.baseTime) / 1000);
      const liveVal = streamAnchorRef.current.baseValue + (elapsedSec * streamAnchorRef.current.rate);
      setStreamingValue(liveVal);
    };

    tickStream();
    const interval = setInterval(tickStream, 100);

    const persistStreamState = () => {
      try {
        const now = Date.now();
        const elapsedSec = Math.max(0, (now - streamAnchorRef.current.baseTime) / 1000);
        const liveVal = streamAnchorRef.current.baseValue + (elapsedSec * streamAnchorRef.current.rate);
        localStorage.setItem('horizon_streaming_state', JSON.stringify({
          baseProfit: liveVal,
          timestamp: now,
          rate: streamAnchorRef.current.rate,
        }));
      } catch (err) {}
    };

    // Auto persist every 1 second for crash/refresh resilience
    const saveInterval = setInterval(persistStreamState, 1000);

    window.addEventListener('beforeunload', persistStreamState);
    window.addEventListener('pagehide', persistStreamState);
    document.addEventListener('visibilitychange', persistStreamState);

    return () => {
      clearInterval(interval);
      clearInterval(saveInterval);
      persistStreamState();
      window.removeEventListener('beforeunload', persistStreamState);
      window.removeEventListener('pagehide', persistStreamState);
      document.removeEventListener('visibilitychange', persistStreamState);
    };
  }, [user?.perSecondRate, user?.totalProfit, user?.totalEarned]);

  // Synchronize when backend user data updates (monotonically progressive)
  useEffect(() => {
    if (!user) return;
    const currentRate = (user?.perSecondRate !== undefined && user?.perSecondRate !== null && Number(user.perSecondRate) > 0)
      ? Number(user.perSecondRate)
      : 0;
    const backendProfit = Number(user?.totalProfit || user?.totalEarned || 0);

    if (currentRate <= 0) {
      streamAnchorRef.current = {
        baseValue: backendProfit,
        baseTime: Date.now(),
        rate: 0,
      };
      setStreamingValue(backendProfit);
      try {
        localStorage.setItem('horizon_streaming_state', JSON.stringify({
          baseProfit: backendProfit,
          timestamp: Date.now(),
          rate: 0,
        }));
      } catch (err) {}
      return;
    }

    const lastSyncTime = user?.lastYieldSync ? new Date(user.lastYieldSync).getTime() : Date.now();
    const elapsedSinceSync = Math.max(0, (Date.now() - lastSyncTime) / 1000);
    const backendAccrued = backendProfit + (elapsedSinceSync * currentRate);

    const currentLocal = streamAnchorRef.current.baseValue +
      (Math.max(0, (Date.now() - streamAnchorRef.current.baseTime) / 1000) * streamAnchorRef.current.rate);

    // Monotonic progression: take maximum so counter never restarts or jumps backward
    const newBaseline = Math.max(currentLocal, backendAccrued, backendProfit);

    streamAnchorRef.current = {
      baseValue: newBaseline,
      baseTime: Date.now(),
      rate: currentRate,
    };
    setStreamingValue(newBaseline);

    try {
      localStorage.setItem('horizon_streaming_state', JSON.stringify({
        baseProfit: newBaseline,
        timestamp: Date.now(),
        rate: currentRate,
      }));
    } catch (err) {}
  }, [user?.totalProfit, user?.totalEarned, user?.perSecondRate, user?.lastYieldSync]);

  // Countdown to next daily payout (midnight) - active only when user has investments
  useEffect(() => {
    if (!hasActiveStreaming) {
      setCountdown({ hours: '00', minutes: '00', seconds: '00' });
      return;
    }

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
  }, [hasActiveStreaming]);

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
              {hasActiveStreaming ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-xs font-extrabold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Multi-Asset Yield Streaming Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Yield Streaming Idle • No Active Plans
                </span>
              )}
              <span className="text-slate-400 font-medium hidden sm:inline">•</span>
              <span className="text-slate-600 font-semibold hidden sm:flex items-center gap-1">
                <RiCalendarLine size={14} className="text-gold-600" /> {currentDateFormatted}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium text-xs">Next Daily Settlement:</span>
              {hasActiveStreaming ? (
                <span className="px-3 py-1 rounded-xl bg-gold-100 text-gold-900 border border-gold-300 font-mono font-bold text-xs shadow-2xs">
                  {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                </span>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 font-mono font-bold text-xs">
                  --h --m --s (No Active Plan)
                </span>
              )}
            </div>
          </div>

          {/* Main Hero Row: Avatar + Dynamic Name + Badges + CTAs */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
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
                    <div className="w-18 h-18 sm:w-22 sm:h-22 md:w-24 md:h-24 xl:w-28 xl:h-28 rounded-full overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner relative">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={userName}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-3xl sm:text-4xl xl:text-5xl font-black text-gold-400 font-poppins">
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
                        <RiCameraLine size={20} />
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

                <h1 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black font-poppins tracking-tight text-slate-950 truncate">
                  {userName}
                </h1>

                {/* User Badges & ID Row */}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                  <button
                    type="button"
                    onClick={copyUserId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white hover:bg-gold-50 border border-slate-200 text-slate-800 font-mono font-bold transition-colors cursor-pointer shadow-2xs"
                    title="Click to copy User ID"
                  >
                    <span>ID: {userId}</span>
                    <RiFileCopyLine size={13} className="text-gold-600" />
                    {copiedId && <span className="text-[10px] text-emerald-600 font-sans font-bold">Copied!</span>}
                  </button>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-gold-400 to-amber-400 text-slate-950 font-extrabold shadow-gold text-xs font-poppins">
                    <RiAwardLine size={14} /> Level {user?.rank?.level || 1} {user?.rank?.name || user?.currentRank || 'Bronze Explorer'}
                  </span>

                  <span className="text-slate-500 text-xs hidden sm:inline font-mono">
                    Sponsor: <strong className="text-slate-800 font-bold">{userSponsor}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto flex-shrink-0">
              {/* Button 1: Make Deposit */}
              <Link
                to="/deposit"
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-slate-950 shadow-gold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <RiArrowDownLine size={16} />
                <span>Make Deposit</span>
              </Link>

              {/* Button 2: Explore Plans */}
              <Link
                to="/plans"
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-gold-50 text-slate-900 border-2 border-gold-400 hover:border-gold-500 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <RiFundsLine size={16} className="text-gold-600" />
                <span>Explore Plans</span>
              </Link>

              {/* Button 3: Withdraw */}
              <Link
                to="/withdraw"
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <RiArrowUpLine size={16} />
                <span>Withdraw</span>
              </Link>
            </div>
          </div>

          {/* 3 Highlight Metric Cards Embedded In Hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gold-200/80">
            {/* 1. Deposit Wallet */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-gold-300 transition-colors shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs flex-shrink-0">
                  <RiWallet3Line size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Deposit Wallet</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 tabular-nums truncate block">
                    ${(user?.depositWallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <Link to="/deposit" className="text-xs font-bold text-gold-700 hover:text-gold-900 underline flex-shrink-0 ml-1">
                + Add
              </Link>
            </div>

            {/* 2. Earning Wallet */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-colors shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs flex-shrink-0">
                  <RiSafeLine size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Earning Wallet</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-emerald-700 tabular-nums truncate block">
                    ${(user?.earningWallet || user?.earningsWallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <Link to="/withdraw" className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline flex-shrink-0 ml-1">
                Payout
              </Link>
            </div>

            {/* 3. Live Streaming Yield */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-gold-100/70 to-amber-100/50 border border-gold-300 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-gold-300 flex items-center justify-center text-gold-600 shadow-2xs flex-shrink-0">
                  <UilBolt size={20} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-gold-900 uppercase tracking-wider block truncate">Live Yield Streaming</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-black font-mono text-slate-950">
                      ${streamingValue.toFixed(6).split('.')[0]}
                    </span>
                    <span className="text-xs font-black font-mono text-gold-700">
                      .{streamingValue.toFixed(6).split('.')[1]}
                    </span>
                  </div>
                </div>
              </div>
              <span className={`text-[10px] sm:text-[11px] font-bold font-mono flex-shrink-0 ml-1 ${hasActiveStreaming ? 'text-emerald-700' : 'text-slate-500'}`}>
                +${activeRate.toFixed(7)}/s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── REAL-TIME STREAMING DETAIL CARD ──────────────── */}
      <div className="card-gold p-5 sm:p-7 relative overflow-hidden rounded-3xl shadow-card border border-gold-300">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 sm:gap-6 relative z-10">
          {/* Left: Streaming counter */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className={hasActiveStreaming ? "live-dot" : "w-2.5 h-2.5 rounded-full bg-slate-400"}></div>
              <span className={`text-xs font-extrabold uppercase tracking-[0.14em] font-poppins ${hasActiveStreaming ? 'text-emerald-800' : 'text-slate-700'}`}>
                {hasActiveStreaming ? 'Live Real-Time Investment Profit Streaming' : 'Live Real-Time Investment Profit Streaming (Idle)'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 flex-wrap">
              <UilBolt size={32} className={`${hasActiveStreaming ? 'text-gold-500' : 'text-slate-400'} flex-shrink-0`} />
              <span className="streaming-value text-3xl sm:text-5xl 2xl:text-6xl font-black text-slate-950 font-poppins">
                ${streamingValue.toFixed(7).split('.')[0]}
              </span>
              <span className="streaming-value text-3xl sm:text-5xl 2xl:text-6xl font-black text-slate-950">.</span>
              <span className="streaming-value text-2xl sm:text-4xl 2xl:text-5xl font-black text-gold-600 font-poppins">
                {streamingValue.toFixed(7).split('.')[1]}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-poppins font-medium">
              Streaming rate: <span className={`font-extrabold font-mono ${hasActiveStreaming ? 'text-emerald-700' : 'text-slate-600'}`}>+${activeRate.toFixed(7)}/sec</span>
              {' · '}
              <span className="text-slate-600">
                Active Assets: {user?.activeAssetNames || (hasActiveStreaming ? 'Active Portfolio' : 'None (No Active Investments)')}
              </span>
            </p>

            <div className="flex items-center gap-2.5 sm:gap-3 pt-2 flex-wrap">
              <Link
                to="/plans"
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-slate-950 shadow-gold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <UilBolt size={16} />
                <span>{hasActiveStreaming ? 'Explore Yield Plans' : 'Start an Investment Plan'}</span>
              </Link>
              <Link
                to="/investments"
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>My Active Portfolios</span>
                <RiArrowRightLine size={14} />
              </Link>
            </div>
          </div>

          {/* Right: Countdown to next settlement */}
          <div className="flex flex-col items-center gap-2 bg-white/90 p-4 sm:p-5 rounded-2xl border border-gold-200 shadow-sm flex-shrink-0 min-w-[200px] self-start xl:self-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 font-poppins">
              Next Daily Settlement
            </span>
            {hasActiveStreaming ? (
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
            ) : (
              <div className="flex flex-col items-center justify-center py-1">
                <div className="flex items-center gap-2 text-slate-300 font-mono text-xl font-bold">
                  <span>00</span>
                  <span>:</span>
                  <span>00</span>
                  <span>:</span>
                  <span>00</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mt-1.5 shadow-2xs">
                  Awaiting Investment
                </span>
              </div>
            )}
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
      {/* <div className="card p-6 sm:p-7 border border-slate-200 shadow-sm">
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
      </div> */}
    </div>
  );
}
