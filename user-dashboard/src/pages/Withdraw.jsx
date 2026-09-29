import { useState, useEffect } from 'react';
import {
  RiArrowUpLine,
  RiWalletLine,
  RiPercentLine,
  RiTimeLine,
  RiShieldCheckLine,
  RiAlertLine,
  RiCheckLine,
  RiRefreshLine,
  RiPlayCircleLine,
  RiDownload2Line,
  RiMovieLine,
  RiMailSendLine,
  RiKeyLine,
  RiLockPasswordLine,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createWithdrawal, sendWithdrawalOtp, getWithdrawalSettings, getWithdrawalVideo } from '../api/withdrawalsApi';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';

const baseWithdrawMethods = [
  { id: 'usdt-bep20', name: 'USDT (BEP20)', type: 'crypto' },
  // { id: 'usdt-trc20', name: 'USDT (TRC20)', type: 'crypto' },
  // { id: 'btc', name: 'Bitcoin (BTC)', type: 'crypto' },
  // { id: 'bank', name: 'Bank Wire Transfer', type: 'bank' },
];

export default function Withdraw() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [method, setMethod] = useState(baseWithdrawMethods[0]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ──────── GMAIL OTP VERIFICATION STATE ────────
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // ──────── TUTORIAL VIDEO STATE ────────
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [withdrawalVideo, setWithdrawalVideo] = useState({
    title: 'Official Withdrawal Guide: How to withdraw funds to Bank, Crypto or E-Wallet',
    subtitle: 'Watch this step-by-step video guide before submitting your withdrawal request for fastest clearance and zero rejection.',
    videoType: 'url',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    instructions: [
      'Ensure your available earning wallet balance meets the minimum withdrawal requirement.',
      'Select your verified receiving channel (Bank, Crypto USDT/BTC, or Mobile E-Wallet).',
      'Enter your correct recipient address / account number and requested amount.',
      'Check the real-time fee calculation and net receiving amount.',
      'Submit your request — platform clears requests within standard turnaround (12-24 hrs).',
    ],
    status: 'Published',
  });

  // ──────── DYNAMIC WITHDRAWAL CHARGES & SETTINGS ────────
  const [settings, setSettings] = useState({
    feeType: 'percentage',
    feePercentage: 5,
    fixedFee: 0,
    minWithdrawal: 5,
    maxWithdrawal: 50000,
    processingTime: '12 - 24 Hours',
    feeEnabled: true,
    singleIdMaxWithdrawal: '3X Maximum Withdrawal Allowed',
    singleIdMaxWithdrawalMultiplier: 4,
    termsNotice:
      'Automated clearance turnaround within 12-24 hours. Standard platform protocol fee is applied upon withdrawal submission.',
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Fetch dynamic withdrawal charges and video from admin backend
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoadingSettings(true);
        const [settingsRes, videoRes] = await Promise.allSettled([
          getWithdrawalSettings(),
          getWithdrawalVideo(),
        ]);

        if (isMounted) {
          if (settingsRes.status === 'fulfilled' && settingsRes.value?.withdrawalSettings) {
            setSettings(settingsRes.value.withdrawalSettings);
          }
          if (videoRes.status === 'fulfilled' && videoRes.value?.success && videoRes.value.video) {
            setWithdrawalVideo(videoRes.value.video);
          }
        }
      } catch (err) {
        console.warn('Failed to load withdrawal data from backend:', err.message);
      } finally {
        if (isMounted) setLoadingSettings(false);
      }
    };
    loadData();

    // Listen for live update events
    const handleVideoSync = (e) => {
      if (e.detail) setWithdrawalVideo(e.detail);
    };
    window.addEventListener('horizon-withdrawal-video-change', handleVideoSync);
    window.addEventListener('storage', handleVideoSync);

    return () => {
      isMounted = false;
      window.removeEventListener('horizon-withdrawal-video-change', handleVideoSync);
      window.removeEventListener('storage', handleVideoSync);
    };
  }, []);

  const handleDownloadVideo = (url, fileName = "official_withdrawal_tutorial.mp4") => {
    if (!url) {
      toast.error("Withdrawal tutorial video is not available for download.");
      return;
    }
    try {
      let downloadUrl = url;
      if (downloadUrl.includes("cloudinary.com") && downloadUrl.includes("/upload/")) {
        downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
      }
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Withdrawal guide video download started!", "Downloading Video");
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, "_blank");
    }
  };

  // ──────── DYNAMIC LIVE FEE & NET PAYOUT CALCULATION ────────
  const numAmount = parseFloat(amount) || 0;
  let calculatedFee = 0;
  if (numAmount > 0 && settings.feeEnabled) {
    if (settings.feeType === 'fixed') {
      calculatedFee = Number(settings.fixedFee) || 0;
    } else {
      calculatedFee = (numAmount * (Number(settings.feePercentage) || 0)) / 100;
    }
  }
  const calculatedNet = Math.max(0, numAmount - calculatedFee);

  // ──────── SINGLE ID CAPPING (3X) QUOTA ────────
  const singleIdMultiplier = Number(settings.singleIdMaxWithdrawalMultiplier) || 4;
  const totalInvested = Number(user?.totalInvested) || 0;
  const lifetimeWithdrawalCap = totalInvested * singleIdMultiplier;
  const totalWithdrawn = Number(user?.totalWithdrawn) || 0;
  const remainingWithdrawalQuota = Math.max(0, lifetimeWithdrawalCap - totalWithdrawn);

  const handlePercentageClick = (pct) => {
    const available = user?.earningWallet || 0;
    if (available <= 0) return;
    const calc = ((available * pct) / 100).toFixed(2);
    setAmount(calc);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const withdrawNum = parseFloat(amount);
    if (!amount || withdrawNum <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount.');
      return;
    }

    const minLimit = settings.minWithdrawal !== undefined ? Number(settings.minWithdrawal) : 5;
    const maxLimit = settings.maxWithdrawal !== undefined ? Number(settings.maxWithdrawal) : 50000;

    if (withdrawNum < minLimit) {
      setErrorMsg(`Minimum withdrawal limit is $${minLimit.toLocaleString()} USD.`);
      return;
    }

    if (withdrawNum > maxLimit) {
      setErrorMsg(`Maximum withdrawal limit is $${maxLimit.toLocaleString()} USD per request.`);
      return;
    }

    if ((user?.earningWallet || 0) < withdrawNum) {
      setErrorMsg(`Insufficient available balance ($${(user?.earningWallet || 0).toFixed(2)} USD).`);
      return;
    }

    if (totalInvested > 0 && (totalWithdrawn + withdrawNum) > lifetimeWithdrawalCap) {
      setErrorMsg(
        `Single ID Limit Exceeded: Maximum allowed withdrawal is 3X ($${lifetimeWithdrawalCap.toLocaleString()} USD). You have already withdrawn $${totalWithdrawn.toLocaleString()} USD (Remaining quota: $${remainingWithdrawalQuota.toLocaleString()} USD).`
      );
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Please enter your recipient wallet address or bank account coordinates.');
      return;
    }

    // Dispatch Gmail OTP before submitting to admin
    setSendingOtp(true);
    try {
      const res = await sendWithdrawalOtp({ amount: withdrawNum });
      if (res?.success) {
        setMaskedEmail(res.email || user?.email || 'your registered Gmail');
        setOtp('');
        setOtpError('');
        setResendCountdown(60);
        setIsOtpModalOpen(true);
        toast.success(
          res.message || 'A 6-digit authorization code has been dispatched to your Gmail.',
          'Gmail OTP Dispatched'
        );
      } else {
        setErrorMsg(res?.message || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to dispatch Gmail verification code.');
      toast.error(err.response?.data?.message || 'Failed to dispatch Gmail verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Resend OTP Code
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || sendingOtp) return;
    try {
      setSendingOtp(true);
      setOtpError('');
      const withdrawNum = parseFloat(amount);
      const res = await sendWithdrawalOtp({ amount: withdrawNum });
      setResendCountdown(60);
      toast.success(res?.message || 'New verification code sent to your Gmail.', 'Code Resent');
    } catch (err) {
      setOtpError(err.response?.data?.message || err.message || 'Failed to resend code.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP and Submit Withdrawal to Admin
  const handleConfirmWithdrawalWithOtp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setOtpError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setOtpError('Please enter the complete 6-digit code received on your Gmail.');
      return;
    }

    const withdrawNum = parseFloat(amount);
    setVerifyingOtp(true);
    try {
      const res = await createWithdrawal({
        amount: withdrawNum,
        gateway: method.name,
        walletAddress: address.trim(),
        address: address.trim(),
        otp: cleanOtp,
      });

      if (res?.success) {
        setIsOtpModalOpen(false);
        setOtp('');
        setOtpError('');

        if (res.accountBlocked) {
          toast.warning(
            "Your account has been blocked after withdrawing your full capital under the 3X Cap plan. Please create a new account to continue.",
            "Account Blocked"
          );
          setSuccessMsg(
            "Account Blocked: Full capital withdrawn under 3X Cap plan. Redirecting to registration to create a new account..."
          );
          setTimeout(() => {
            localStorage.removeItem('horizon_user_token');
            localStorage.removeItem('horizon_token');
            localStorage.removeItem('horizon_user');
            window.location.href = '/register';
          }, 3500);
          return;
        }

        setSuccessMsg(
          res.message ||
          `Withdrawal request for $${withdrawNum.toLocaleString()} USD submitted successfully. Request sent to Admin for review. Net payout: $${calculatedNet.toFixed(2)}.`
        );
        toast.success(
          `Withdrawal request of $${withdrawNum.toLocaleString()} USD submitted to Admin for review.`,
          'Withdrawal Submitted'
        );
        setAmount('');
        setAddress('');
        if (refreshUser) await refreshUser();
      } else {
        setOtpError(res?.message || 'Withdrawal request failed.');
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes('blocked')) {
        setOtpError(err.response.data.message);
        setTimeout(() => {
          localStorage.removeItem('horizon_user_token');
          localStorage.removeItem('horizon_token');
          localStorage.removeItem('horizon_user');
          window.location.href = '/login';
        }, 3000);
      } else {
        setOtpError(err.response?.data?.message || err.message || 'Failed to verify OTP and submit withdrawal.');
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Withdraw Funds"
        subtitle="Request instant payout from your available earning wallet directly to your external address"
        badge="Payout Gateway"
        action={
          <button
            type="button"
            onClick={() => setIsVideoModalOpen(true)}
            className="btn btn-secondary text-xs px-4 py-2.5 rounded-xl font-bold border border-gold-300/80 bg-gold-50/50 hover:bg-gold-50 text-slate-900 flex items-center gap-2 cursor-pointer shadow-2xs transition-all"
          >
            <RiPlayCircleLine size={18} className="text-gold-600" />
            <span>Watch Withdrawal Tutorial</span>
          </button>
        }
      />

      {/* ──────────────── WATCH WITHDRAWAL TUTORIAL BANNER ──────────────── */}
      <div className="card p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-gold-500/10 to-white border-2 border-gold-300/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 font-poppins">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-gold">
            <RiPlayCircleLine size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-display">
                {withdrawalVideo.title || "Official Withdrawal Video Guide"}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase tracking-wider border border-emerald-300">
                Official Guide
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
              {withdrawalVideo.subtitle || "Step-by-step video guide for error-free withdrawal submission and instant clearance."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsVideoModalOpen(true)}
            className="btn btn-primary text-xs px-4 py-2.5 rounded-xl font-bold shadow-gold flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer"
          >
            <RiPlayCircleLine size={16} />
            <span>Watch Tutorial</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance & Method card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card-gold p-6 rounded-2xl">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                <RiWalletLine size={24} className="text-emerald-700" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 font-poppins">
                  Available Balance
                </p>
                <p className="text-2xl font-bold font-display text-slate-900 tabular-nums">
                  ${(user?.earningWallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="space-y-2.5 pt-3 border-t border-gold-200/60 text-sm font-poppins">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Earned</span>
                <span className="text-emerald-600 font-bold tabular-nums">
                  ${(user?.totalEarned || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Withdrawn</span>
                <span className="text-orange-600 font-bold tabular-nums">
                  ${(user?.totalWithdrawn || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Method selection */}
          <div className="card p-5 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400 font-poppins">
              Withdraw Gateway
            </p>
            {baseWithdrawMethods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m)}
                className={`w-full p-3.5 rounded-xl flex items-center justify-between transition-all text-left text-sm font-poppins border cursor-pointer ${method.id === m.id
                    ? 'card-gold border-gold-400 ring-2 ring-gold-200 text-slate-900 font-bold shadow-sm'
                    : 'border-slate-100 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
              >
                <span className="font-semibold">{m.name}</span>
                <span className="text-xs text-slate-400 font-normal">
                  Min ${settings.minWithdrawal || 5}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Info Badge */}
          <div className="card p-4 rounded-2xl border border-slate-200/80 bg-slate-50 text-xs space-y-2 font-poppins">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <RiTimeLine className="text-gold-600 flex-shrink-0" size={16} />
              <span>Turnaround: {settings.processingTime || '12 - 24 Hours'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <RiPercentLine className="text-emerald-600 flex-shrink-0" size={16} />
              <span>
                Withdrawal Fee:{' '}
                <strong className="text-emerald-700">
                  {!settings.feeEnabled
                    ? '0% (Free)'
                    : settings.feeType === 'percentage'
                      ? `${settings.feePercentage}%`
                      : `$${settings.fixedFee} Flat`}
                </strong>
              </span>
            </div>
          </div>

          {/* Single ID Capping Quota Card */}
          <div className="card p-4 space-y-2.5 border-amber-300/80 bg-gradient-to-br from-amber-50/50 via-white to-gold-50/30 rounded-2xl shadow-2xs font-poppins">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Single ID Capping
              </span>
              <span className="badge badge-gold text-[9px] font-black uppercase">
                3X
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-800">
              {settings.singleIdMaxWithdrawal || "3X Maximum Withdrawal Allowed"}
            </p>
            <div className="space-y-1.5 pt-2 border-t border-amber-200/60 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Invested Capital:</span>
                <span className="font-bold text-slate-900">${totalInvested.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Max Withdrawal (3X):</span>
                <span className="font-bold text-amber-900">${lifetimeWithdrawalCap.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Withdrawn So Far:</span>
                <span className="font-bold text-orange-600">${totalWithdrawn.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-amber-200/40 text-xs">
                <span className="font-bold text-emerald-800">Remaining Quota:</span>
                <span className="font-extrabold text-emerald-700 font-mono">${remainingWithdrawalQuota.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Withdraw form */}
        <div className="lg:col-span-2">
          <div className="card p-6 sm:p-8 space-y-6">
            {successMsg && (
              <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-poppins flex items-center gap-2">
                <RiCheckLine size={18} className="flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-poppins flex items-center gap-2">
                <RiAlertLine size={18} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Amount field & quick percentage buttons */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-poppins">
                    Amount (USD)
                  </label>
                  <div className="flex items-center gap-1">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePercentageClick(pct)}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gold-100/80 hover:bg-gold-200 text-gold-900 border border-gold-300/80 transition-colors cursor-pointer"
                      >
                        {pct === 100 ? 'MAX' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder={`Min $${settings.minWithdrawal || 5} - Max $${(settings.maxWithdrawal || 50000).toLocaleString()}`}
                  className="input text-base font-semibold"
                  required
                />
                <p className="text-[11px] text-slate-400 font-poppins mt-1">
                  Available in Earning Wallet: ${(user?.earningWallet || 0).toFixed(2)} USD
                </p>
              </div>

              {/* ──────── DYNAMIC LIVE WITHDRAWAL FEE & NET BREAKDOWN CARD ──────── */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-gold-50/50 via-slate-50 to-slate-50 border border-gold-300/70 shadow-2xs space-y-3 font-poppins">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Live Payout Calculation
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase ${settings.feeEnabled
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                  >
                    {settings.feeEnabled
                      ? settings.feeType === 'percentage'
                        ? `${settings.feePercentage}% Fee`
                        : `$${settings.fixedFee} Flat Fee`
                      : '0% Free Payout'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-center">
                  <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                    <p className="text-[10px] text-slate-400 font-medium">Gross Request</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 font-display mt-0.5">
                      ${numAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                    <p className="text-[10px] text-slate-400 font-medium">Protocol Fee</p>
                    <p className="text-xs sm:text-sm font-bold text-red-600 font-display mt-0.5">
                      -${calculatedFee.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-50/80 rounded-xl border border-emerald-200">
                    <p className="text-[10px] text-emerald-800 font-medium">Net Received</p>
                    <p className="text-xs sm:text-sm font-bold text-emerald-700 font-display mt-0.5">
                      ${calculatedNet.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Destination address */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">
                  {method.id === 'bank' ? 'Bank Account Coordinates' : 'Recipient Wallet Address'}
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={
                    method.id === 'bank'
                      ? 'Bank Name, Account number, IFSC / IBAN / Title...'
                      : `Enter your external ${method.name} wallet address`
                  }
                  className="input"
                  required
                />
              </div>

              {/* Dynamic Withdrawal Policy & Terms notice from Admin */}
              <div className="px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-poppins space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <RiShieldCheckLine className="text-gold-600" size={15} />
                  <span>Platform Withdrawal Policy:</span>
                </div>
                <p>• Automated clearance turnaround: <strong>{settings.processingTime || '12-24 hours'}</strong></p>
                <p>
                  • Platform fee:{' '}
                  <strong>
                    {!settings.feeEnabled
                      ? '0% (Platform fee waived)'
                      : settings.feeType === 'percentage'
                        ? `${settings.feePercentage}% standard protocol fee applied`
                        : `$${settings.fixedFee} USD fixed fee per payout`}
                  </strong>
                </p>
                <p>• Minimum withdrawal: <strong>${settings.minWithdrawal || 5} USD</strong></p>
                <p>• Maximum limit per request: <strong>${(settings.maxWithdrawal || 50000).toLocaleString()} USD</strong></p>
                <p>
                  • Single ID Capping:{' '}
                  <strong className="text-amber-800">
                    {settings.singleIdMaxWithdrawal || '3X Maximum Withdrawal Allowed'}
                  </strong>
                </p>
                {settings.termsNotice && (
                  <p className="pt-1 text-[11px] text-slate-500 border-t border-slate-200/80 leading-relaxed italic">
                    "{settings.termsNotice}"
                  </p>
                )}
              </div>

              {/* 3X Cap Capital Withdrawal Notice & Warning */}
              {totalInvested > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300/80 text-xs font-poppins space-y-1.5 text-amber-950">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <RiAlertLine size={16} className="text-amber-600 flex-shrink-0" />
                    <span>3X Cap Capital Withdrawal Policy:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Under the 3X Cap plan, once your cumulative withdrawals reach your total invested capital (<strong>${totalInvested.toLocaleString()} USD</strong>), your account will be automatically completed and blocked. You will need to create a new account to continue investing.
                  </p>
                  {totalWithdrawn + numAmount >= totalInvested && numAmount > 0 && (
                    <p className="text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200 mt-1">
                      ⚠️ Warning: Submitting this withdrawal of ${numAmount.toFixed(2)} USD will reach or exceed your total invested capital (${(totalWithdrawn + numAmount).toFixed(2)} / ${totalInvested.toLocaleString()} USD). Your account will be blocked upon submission.
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || sendingOtp}
                className="w-full btn btn-primary py-3.5 text-sm font-bold cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {sendingOtp ? (
                  <>
                    <RiRefreshLine size={18} className="animate-spin" /> Sending Gmail verification code...
                  </>
                ) : (
                  <>
                    <RiArrowUpLine size={16} /> Request Withdrawal ({numAmount > 0 ? `$${calculatedNet.toFixed(2)} Net` : 'Instant Payout'})
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ════════ WITHDRAWAL TUTORIAL VIDEO MODAL ════════ */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title={withdrawalVideo.title || "Official Withdrawal Tutorial"}
        subtitle="Watch step-by-step video instructions uploaded by platform administration"
        size="lg"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2.5">
            {withdrawalVideo.videoUrl && !withdrawalVideo.videoUrl.includes('youtube.com') && !withdrawalVideo.videoUrl.includes('youtu.be') && (
              <button
                type="button"
                onClick={() => handleDownloadVideo(withdrawalVideo.videoUrl, "official_withdrawal_tutorial.mp4")}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-600 hover:to-gold-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-gold cursor-pointer"
              >
                <RiDownload2Line size={16} />
                <span>Download Video Guide</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(false)}
              className="w-full sm:w-auto btn btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-gold cursor-pointer"
            >
              Got it, proceed to withdraw
            </button>
          </div>
        }
      >
        <div className="space-y-5 font-poppins">
          {withdrawalVideo.subtitle && (
            <p className="text-xs text-slate-600 font-poppins leading-relaxed">
              {withdrawalVideo.subtitle}
            </p>
          )}

          <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-card aspect-video w-full flex items-center justify-center">
            {withdrawalVideo.videoUrl?.includes('youtube.com') || withdrawalVideo.videoUrl?.includes('youtu.be') ? (
              <iframe
                src={withdrawalVideo.videoUrl.replace('watch?v=', 'embed/')}
                title="Withdrawal Tutorial"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={withdrawalVideo.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <RiShieldCheckLine size={16} className="text-amber-700" />
              Verified Withdrawal Instructions:
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 font-poppins">
              {(withdrawalVideo.instructions || []).map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>

      {/* ════════ GMAIL OTP VERIFICATION MODAL ════════ */}
      <Modal
        isOpen={isOtpModalOpen}
        onClose={() => {
          if (!verifyingOtp) {
            setIsOtpModalOpen(false);
            setOtp('');
            setOtpError('');
          }
        }}
        title="Authorize Withdrawal Security"
        subtitle="Gmail OTP Verification Required"
        size="md"
      >
        <div className="space-y-5 font-poppins py-1">
          {/* Header Security Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-gold-50/40 to-white border border-gold-200/80 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gold-400 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-gold">
              <RiMailSendLine size={24} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Security Authorization Code Sent
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                A 6-digit OTP code was sent to <strong className="text-slate-900 font-semibold">{maskedEmail || user?.email}</strong>. Please enter the code below to authorize this withdrawal.
              </p>
            </div>
          </div>

          {/* Withdrawal Summary Strip */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-poppins">
            <div className="flex justify-between text-slate-600">
              <span>Withdrawal Amount:</span>
              <strong className="text-slate-900">${numAmount.toFixed(2)} USD</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Net Payout ({method.name}):</span>
              <strong className="text-emerald-700 font-bold">${calculatedNet.toFixed(2)} USD</strong>
            </div>
            <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200/60">
              <span>Payout Coordinates:</span>
              <span className="font-mono text-slate-800 truncate max-w-[210px]">{address}</span>
            </div>
          </div>

          {/* Error Alert inside Modal */}
          {otpError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <RiAlertLine size={16} className="flex-shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          {/* OTP Input Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 text-center">
              Enter 6-Digit Verification Code
            </label>
            <div className="relative max-w-[280px] mx-auto">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(val);
                  setOtpError('');
                }}
                placeholder="• • • • • •"
                className="w-full py-3.5 px-4 text-center text-2xl font-bold tracking-[0.45em] bg-white border-2 border-gold-300 rounded-2xl shadow-xs text-slate-900 focus:outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-100 font-mono transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Code expires in 10 minutes. Check your inbox and spam/junk folder.
            </p>
          </div>

          {/* Resend Code Section */}
          <div className="text-center pt-1 border-t border-slate-100">
            {resendCountdown > 0 ? (
              <span className="text-xs text-slate-400 font-medium inline-flex items-center gap-1.5">
                <RiTimeLine size={14} /> Resend new code in <strong className="text-slate-700 font-mono">{resendCountdown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                disabled={sendingOtp}
                onClick={handleResendOtp}
                className="text-xs font-bold text-gold-700 hover:text-gold-900 underline inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RiRefreshLine size={14} className={sendingOtp ? 'animate-spin' : ''} />
                <span>{sendingOtp ? 'Sending New Code...' : 'Didn’t receive code? Resend OTP'}</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={verifyingOtp}
              onClick={() => {
                setIsOtpModalOpen(false);
                setOtp('');
                setOtpError('');
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={verifyingOtp || otp.length < 6}
              onClick={handleConfirmWithdrawalWithOtp}
              className="btn btn-primary px-6 py-2.5 text-xs font-bold rounded-xl shadow-gold flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifyingOtp ? (
                <>
                  <RiRefreshLine size={16} className="animate-spin" />
                  <span>Verifying & Submitting...</span>
                </>
              ) : (
                <>
                  <RiCheckLine size={16} />
                  <span>Verify & Submit Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
