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
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createWithdrawal, getWithdrawalSettings, getWithdrawalVideo } from '../api/withdrawalsApi';
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
    singleIdMaxWithdrawal: '3X + Capital Maximum Withdrawal Allowed',
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

  // ──────── SINGLE ID CAPPING (3X + CAPITAL) QUOTA ────────
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
        `Single ID Limit Exceeded: Maximum allowed withdrawal is 3X + Capital ($${lifetimeWithdrawalCap.toLocaleString()} USD). You have already withdrawn $${totalWithdrawn.toLocaleString()} USD (Remaining quota: $${remainingWithdrawalQuota.toLocaleString()} USD).`
      );
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Please enter your recipient wallet address or bank account coordinates.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createWithdrawal({
        amount: withdrawNum,
        gateway: method.name,
        address: address.trim(),
      });

      if (res?.success) {
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
            `Withdrawal request for $${withdrawNum.toLocaleString()} USD submitted successfully. Net payout: $${calculatedNet.toFixed(2)}.`
        );
        setAmount('');
        setAddress('');
        if (refreshUser) await refreshUser();
      } else {
        setErrorMsg(res?.message || 'Withdrawal request failed.');
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes('blocked')) {
        setErrorMsg(err.response.data.message);
        setTimeout(() => {
          localStorage.removeItem('horizon_user_token');
          localStorage.removeItem('horizon_token');
          localStorage.removeItem('horizon_user');
          window.location.href = '/login';
        }, 3000);
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit withdrawal request.');
      }
    } finally {
      setSubmitting(false);
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
                className={`w-full p-3.5 rounded-xl flex items-center justify-between transition-all text-left text-sm font-poppins border cursor-pointer ${
                  method.id === m.id
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
                3X + Capital
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-800">
              {settings.singleIdMaxWithdrawal || "3X + Capital Maximum Withdrawal Allowed"}
            </p>
            <div className="space-y-1.5 pt-2 border-t border-amber-200/60 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Invested Capital:</span>
                <span className="font-bold text-slate-900">${totalInvested.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Max Withdrawal (4X):</span>
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
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase ${
                      settings.feeEnabled
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
                    {settings.singleIdMaxWithdrawal || '3X + Capital Maximum Withdrawal Allowed'}
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
                disabled={submitting}
                className="w-full btn btn-primary py-3.5 text-sm font-bold cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RiRefreshLine size={18} className="animate-spin" /> Submitting request...
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
    </div>
  );
}
