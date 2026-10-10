import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  RiArrowUpLine,
  RiWalletLine,
  RiPercentLine,
  RiTimeLine,
  RiShieldCheckLine,
  RiAlertLine,
  RiAlertFill,
  RiCheckLine,
  RiFileCopyLine,
  RiRefreshLine,
  RiPlayCircleLine,
  RiDownload2Line,
  RiMovieLine,
  RiMailSendLine,
  RiKeyLine,
  RiLockPasswordLine,
  RiStackLine,
  RiCoinsLine,
  RiAwardLine,
  RiBriefcaseLine,
  RiTeamLine,
  RiInformationLine,
  RiExchangeDollarLine,
  RiHourglass2Line,
  RiExternalLinkLine,
  RiCustomerService2Line,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createWithdrawal, sendWithdrawalOtp, getWithdrawalSettings, getWithdrawalVideo } from '../api/withdrawalsApi';
import { getMyInvestments } from '../api/plansApi';
import API from '../api/api';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';

const baseWithdrawMethods = [
  { id: 'usdt-bep20', name: 'USDT (BEP20)', type: 'crypto', network: 'BEP20' },
  // { id: 'btc', name: 'Bitcoin (BTC)', type: 'crypto' },
  // { id: 'bank', name: 'Bank Wire Transfer', type: 'bank' },
];

export default function Withdraw() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [method, setMethod] = useState(baseWithdrawMethods[0]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ──────── USER INVESTMENTS & 15-DAY ESCROW STATE ────────
  const [investments, setInvestments] = useState([]);
  const [isSubmittingEscrowClaim, setIsSubmittingEscrowClaim] = useState(false);
  const [escrowTicketSuccess, setEscrowTicketSuccess] = useState(false);

  useEffect(() => {
    getMyInvestments({ limit: 50 })
      .then((res) => {
        if (res?.success && Array.isArray(res.investments)) {
          setInvestments(res.investments);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-fill address from linked profile crypto wallets
  useEffect(() => {
    if (user?.cryptoWallets) {
      if (method.id === 'usdt-bep20' && user.cryptoWallets.usdtBep20) {
        setAddress(user.cryptoWallets.usdtBep20);
      }
    }
  }, [method.id, user]);

  // ──────── GMAIL OTP VERIFICATION STATE ────────
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // ──────── INSTANT SMART CONTRACT PAYOUT MODAL STATE ────────
  const [instantPayoutData, setInstantPayoutData] = useState(null);
  const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);

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

  // ──────── INCOME STREAMS & EARNING WALLET BREAKDOWN ────────
  const [selectedStreamId, setSelectedStreamId] = useState('all');

  const totalEarningWallet = Number(user?.earningWallet) || 0;
  const rawPvRoi = Number(user?.pvRoiBalance) || 0;
  const rawLevelIncome = Number(user?.levelIncomeBalance) || 0;
  const rawRankReward = Number(user?.rankRewardBalance) || 0;
  const rawCompanyProfit = Number(user?.companyProfitBalance) || 0;
  const rawSalary = Number(user?.salaryBalance) || 0;

  const totalAllocated = rawPvRoi + rawLevelIncome + rawRankReward + rawCompanyProfit + rawSalary;
  // If user has unallocated legacy earning balance, attribute difference to PV ROI for seamless backward compatibility
  const effectivePvRoi = Number((rawPvRoi + Math.max(0, totalEarningWallet - totalAllocated)).toFixed(2));

  const incomeStreams = [
    {
      id: 'all',
      name: 'Total Earning Wallet',
      label: 'Main Earning Wallet',
      balance: totalEarningWallet,
      mode: 'All Combined',
      sourceType: 'Combined',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      tagColor: 'bg-indigo-600',
      icon: RiStackLine,
      desc: 'Liquid balance across all 5 revenue channels combined',
      refVal: '',
    },
    {
      id: 'pvRoi',
      name: 'PV ROI',
      label: 'PV ROI',
      balance: effectivePvRoi,
      mode: 'Automatic',
      sourceType: 'Automatic',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      tagColor: 'bg-emerald-600',
      icon: RiPercentLine,
      desc: 'Daily investment return / yield on Personal Volume',
      refVal: '1000',
    },
    {
      id: 'levelIncome',
      name: 'Level Income',
      label: 'Level Income',
      balance: rawLevelIncome,
      mode: 'Automatic',
      sourceType: 'Automatic',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      tagColor: 'bg-emerald-600',
      icon: RiTeamLine,
      desc: 'Multi-tier referral network team turnover commissions',
      refVal: '',
    },
    {
      id: 'rankReward',
      name: 'One Time Cash Reward ($)',
      label: 'One Time Cash Reward ($)',
      balance: rawRankReward,
      mode: 'Super Admin',
      sourceType: 'Super Admin',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
      tagColor: 'bg-amber-600',
      icon: RiAwardLine,
      desc: 'One-time leadership rank milestone bonus credited by Admin',
      refVal: '',
    },
    {
      id: 'companyProfit',
      name: 'Company Profit %ge',
      label: 'Company Profit %ge',
      balance: rawCompanyProfit,
      mode: 'Super Admin',
      sourceType: 'Super Admin',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      tagColor: 'bg-purple-600',
      icon: RiCoinsLine,
      desc: 'Company profit sharing percentage dividend credited by Admin',
      refVal: '25000',
    },
    {
      id: 'salary',
      name: 'Per Month Salary',
      label: 'Per Month Salary',
      balance: rawSalary,
      mode: 'Super Admin',
      sourceType: 'Super Admin',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      tagColor: 'bg-blue-600',
      icon: RiBriefcaseLine,
      desc: 'Fixed monthly leadership salary allowance credited by Admin',
      refVal: '',
    },
  ];

  const currentStream = incomeStreams.find((s) => s.id === selectedStreamId) || incomeStreams[0];
  const streamAvailableBalance = currentStream.balance;

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

  // ──────── SINGLE ID CAPPING (4X) QUOTA & WITHDRAWABLE VS REINVEST SPLIT (Matches Image 4) ────────
  const singleIdMultiplier = Number(settings.singleIdMaxWithdrawalMultiplier) || 4;
  const totalInvested = Number(user?.totalInvested) || 0;
  const lifetimeWithdrawalCap = totalInvested * singleIdMultiplier;
  const totalWithdrawn = Number(user?.totalWithdrawn) || 0;
  const remainingWithdrawalQuota = Math.max(0, lifetimeWithdrawalCap - totalWithdrawn);

  // Maximum total withdrawable across entire account under 4X cap
  const maxWithdrawableTotal = totalInvested > 0 ? Math.min(totalEarningWallet, remainingWithdrawalQuota) : totalEarningWallet;
  // Balance that CANNOT be withdrawn because it exceeds 4X cap, but CAN be re-invested to expand the 4X cap
  const balanceCanBeReinvest = Math.max(0, Number((totalEarningWallet - maxWithdrawableTotal).toFixed(2)));

  // Stream-specific Withdrawable breakdown (Matches Image 4 Excel logic)
  const maxPvRoiAllowed = totalInvested > 0 ? totalInvested * 3 : effectivePvRoi;
  const pvRoiWithdrawable = Math.min(effectivePvRoi, maxPvRoiAllowed, maxWithdrawableTotal);

  const remainingQuotaForOtherStreams = Math.max(0, maxWithdrawableTotal - pvRoiWithdrawable);
  const otherStreamsSum = rawLevelIncome + rawRankReward + rawCompanyProfit + rawSalary;
  const levelIncomeWithdrawable = otherStreamsSum > 0
    ? Math.min(rawLevelIncome, remainingQuotaForOtherStreams)
    : 0;

  // Selected stream max withdrawable allowance
  let currentStreamMaxWithdrawable = maxWithdrawableTotal;
  if (selectedStreamId === 'pvRoi') {
    currentStreamMaxWithdrawable = pvRoiWithdrawable;
  } else if (selectedStreamId === 'levelIncome') {
    currentStreamMaxWithdrawable = levelIncomeWithdrawable;
  } else if (selectedStreamId !== 'all') {
    currentStreamMaxWithdrawable = Math.min(streamAvailableBalance, remainingQuotaForOtherStreams);
  }

  // ──────── 15-DAY ROI EXPIRY & ESCROW DETECTION ────────
  const completed3XContracts = investments.filter(
    (inv) => inv.lockInPeriod === '3X Cap' && (inv.status === 'Completed' || (Number(inv.totalProfitEarned) >= Number(inv.amount) * 3))
  );
  const expiringContract = completed3XContracts.find(
    (inv) => inv.roiExpiryDate && new Date(inv.roiExpiryDate) > new Date() && !inv.isRoiExpired
  );
  const daysLeftToWithdrawRoi = expiringContract
    ? Math.max(1, Math.ceil((new Date(expiringContract.roiExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;
  const lockedRoiBalance = Number(user?.lockedRoiBalance) || 0;

  const handleRequestEscrowRelease = async () => {
    if (lockedRoiBalance <= 0) return;
    setIsSubmittingEscrowClaim(true);
    try {
      const res = await API.post('/user/support/tickets', {
        subject: `Claim Expired 3X ROI ($${lockedRoiBalance.toLocaleString()} USD) - Administrative Release Request`,
        category: 'Expired ROI Claim',
        priority: 'High',
        claimedAmount: lockedRoiBalance,
        isRoiClaimTicket: true,
        message: `I am requesting the administrative release of my expired 3X ROI ($${lockedRoiBalance.toLocaleString()} USD) held in escrow past the 15-day withdrawal window. Please approve and credit this balance back to my Earning Wallet.`,
      });
      if (res.data?.success) {
        setEscrowTicketSuccess(true);
        toast.success(
          `Support ticket #${res.data.ticket?.ticketId || 'TICK'} submitted! Admin desk will review and release the escrow funds.`,
          'Escrow Release Requested',
          { duration: 6000 }
        );
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit release ticket.', 'Request Failed');
    } finally {
      setIsSubmittingEscrowClaim(false);
    }
  };

  const handlePercentageClick = (pct) => {
    const available = Math.min(streamAvailableBalance, currentStreamMaxWithdrawable);
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

    if (streamAvailableBalance < withdrawNum) {
      setErrorMsg(
        `Insufficient available balance in ${currentStream.name}: $${streamAvailableBalance.toFixed(2)} USD available.`
      );
      return;
    }

    if ((user?.earningWallet || 0) < withdrawNum) {
      setErrorMsg(`Insufficient total available balance ($${(user?.earningWallet || 0).toFixed(2)} USD).`);
      return;
    }

    if (withdrawNum > currentStreamMaxWithdrawable) {
      if (balanceCanBeReinvest > 0 && selectedStreamId === 'all') {
        setErrorMsg(
          `4X Cap Limit: You can only withdraw up to $${maxWithdrawableTotal.toLocaleString()} USD (Max 4X of Capital). The remaining $${balanceCanBeReinvest.toLocaleString()} USD can be Re-invested into a plan to increase your capital!`
        );
      } else {
        setErrorMsg(
          `Withdrawal limit for ${currentStream.name} is $${currentStreamMaxWithdrawable.toLocaleString()} USD under your active 4X cap.`
        );
      }
      return;
    }

    if (totalInvested > 0 && (totalWithdrawn + withdrawNum) > lifetimeWithdrawalCap) {
      setErrorMsg(
        `Single ID Limit Exceeded: Maximum allowed withdrawal is ${singleIdMultiplier}X ($${lifetimeWithdrawalCap.toLocaleString()} USD). You have already withdrawn $${totalWithdrawn.toLocaleString()} USD (Remaining quota: $${remainingWithdrawalQuota.toLocaleString()} USD).`
      );
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Please enter your recipient wallet address or bank account coordinates.');
      return;
    }

    const cleanAddress = address.trim();
    if (method.id === 'usdt-bep20' && (!cleanAddress.startsWith('0x') || cleanAddress.length !== 42)) {
      setErrorMsg('Invalid BSC (BEP-20) address format. Must start with 0x and be 42 characters.');
      return;
    }

    // Dispatch Gmail OTP before submitting to admin
    setSendingOtp(true);
    try {
      const res = await sendWithdrawalOtp({
        amount: withdrawNum,
        incomeSource: currentStream.label,
      });
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
      const res = await sendWithdrawalOtp({
        amount: withdrawNum,
        incomeSource: currentStream.label,
      });
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
        incomeSource: currentStream.label,
        gateway: method.name,
        walletAddress: address.trim(),
        address: address.trim(),
        otp: cleanOtp,
      });

      if (res?.success) {
        setIsOtpModalOpen(false);
        setOtp('');
        setOtpError('');

        if (res.isInstantOnChain && res.txHash) {
          setInstantPayoutData({
            txHash: res.txHash,
            explorerUrl: res.blockchainExplorerUrl || `https://bscscan.com/tx/${res.txHash}`,
            netAmount: calculatedNet,
            recipient: address.trim(),
            customId: res.transaction?.customId || "WD-INSTANT",
          });
          setIsInstantModalOpen(true);
          toast.success(
            `Instant Smart Contract Payout Dispatched! Net: $${calculatedNet.toFixed(2)} USD`,
            'Blockchain Clearance Complete'
          );
          setSuccessMsg(
            `Instant Smart Contract withdrawal of $${calculatedNet.toFixed(2)} USD cleared on-chain! TxHash: ${res.txHash}`
          );
        } else if (res.accountBlocked) {
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
        } else {
          setSuccessMsg(
            res.message ||
            `Withdrawal request for $${withdrawNum.toLocaleString()} USD submitted successfully. Request sent to Admin for review. Net payout: $${calculatedNet.toFixed(2)}.`
          );
          toast.success(
            `Withdrawal request of $${withdrawNum.toLocaleString()} USD submitted to Admin for review.`,
            'Withdrawal Submitted'
          );
        }

        setAmount('');
        setAddress('');
        try {
          localStorage.removeItem('horizon_streaming_state');
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('horizon-transactions-change'));
        window.dispatchEvent(new CustomEvent('horizon-user-update'));
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
          {/* ──────── EARNING WALLET STREAM BREAKDOWN CARD (Left Top) ──────── */}
          <div className="card p-5 rounded-2xl border-2 border-gold-300/80 bg-gradient-to-b from-amber-50/40 via-white to-white shadow-2xs font-poppins space-y-3">
            <div className="flex items-center justify-between border-b border-gold-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gold-400/20 text-gold-800 flex items-center justify-center font-bold">
                  <RiStackLine size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-display">
                    Earning Wallet (Streams)
                  </h4>
                  <p className="text-[10px] text-slate-500">Breakdown of earnings available</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-300">
                5 Streams
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                    <th className="text-left pb-1.5 font-medium">Income Stream</th>
                    <th className="text-right pb-1.5 font-medium">Balance ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomeStreams.filter(s => s.id !== 'all').map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{item.name}</span>
                          {item.refVal && (
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded">
                              {item.refVal}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block line-clamp-1">{item.desc}</span>
                      </td>
                      <td className="py-2.5 px-1 text-right font-extrabold text-slate-900 tabular-nums font-mono">
                        ${item.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gold-300 font-extrabold text-slate-900 bg-amber-50/70">
                    <td className="py-2.5 px-2">Total Earning Wallet</td>
                    <td className="py-2.5 px-1 text-right text-emerald-700 font-mono text-xs font-black">
                      ${totalEarningWallet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ──────── 15-DAY ADMINISTRATIVE ESCROW CLAIM ALERT (If user has expired 3X ROI) ──────── */}
          {lockedRoiBalance > 0 && (
            <div className="card p-4.5 rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 via-white to-amber-50 shadow-sm font-poppins space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                  <RiAlertFill size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-900">
                    Administrative Escrow Hold: ${lockedRoiBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    This 3X ROI balance surpassed the <strong>15-day withdrawal window</strong> and has been placed into Administrative Escrow. Per company policy, submit a Support Ticket to request release back to your Earning Wallet.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-red-200 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-slate-500">
                  Ticket Category: Expired ROI Claim
                </span>
                <button
                  type="button"
                  onClick={handleRequestEscrowRelease}
                  disabled={isSubmittingEscrowClaim || escrowTicketSuccess}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RiCustomerService2Line size={14} />
                  <span>
                    {isSubmittingEscrowClaim
                      ? 'Submitting Request...'
                      : escrowTicketSuccess
                      ? 'Claim Ticket Submitted'
                      : 'Claim via Support Ticket'}
                  </span>
                </button>
              </div>
            </div>
          )}

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

          {/* ──────── PLATFORM WITHDRAWAL POLICY (Left ke sabse niche) ──────── */}
          <div className="card p-5 rounded-2xl border border-slate-200/90 bg-slate-50/80 text-xs text-slate-600 font-poppins space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200/80 pb-2.5">
              <div className="w-7 h-7 rounded-lg bg-gold-400 text-slate-950 flex items-center justify-center font-bold shadow-2xs">
                <RiShieldCheckLine size={16} />
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider font-display font-bold">
                  Platform Withdrawal Policy:
                </h4>
                <p className="text-[10px] text-slate-400 font-normal">Official platform guidelines & limits</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <RiTimeLine className="text-gold-600" size={14} /> Turnaround:
                </span>
                <strong className="text-slate-800">{settings.processingTime || '12-24 hours'}</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <RiPercentLine className="text-emerald-600" size={14} /> Platform Fee:
                </span>
                <strong className="text-emerald-700">
                  {!settings.feeEnabled
                    ? '0% (Free)'
                    : settings.feeType === 'percentage'
                      ? `${settings.feePercentage}% Protocol Fee`
                      : `$${settings.fixedFee} Flat`}
                </strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Minimum Withdrawal:</span>
                <strong className="text-slate-800">${settings.minWithdrawal || 5} USD</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Max Limit / Request:</span>
                <strong className="text-slate-800">${(settings.maxWithdrawal || 50000).toLocaleString()} USD</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Single ID Capping:</span>
                <strong className="text-amber-800">{settings.singleIdMaxWithdrawal || '4X Max Multiplier'}</strong>
              </div>
            </div>

            {settings.termsNotice && (
              <p className="pt-2 text-[10.5px] text-slate-500 border-t border-slate-200/80 leading-relaxed italic">
                "{settings.termsNotice}"
              </p>
            )}

            {totalInvested > 0 && (
              <div className="pt-2 border-t border-slate-200/80 text-[11px] text-amber-900 leading-relaxed bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80">
                <strong className="block mb-0.5 text-amber-950 font-bold">3X Cap Capital Withdrawal Policy:</strong>
                Cumulative withdrawals reaching your invested capital (${totalInvested.toLocaleString()} USD) completes contract and requires a new account.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Withdrawable vs Re-invest Matrix + Withdrawal Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* ──────── 4X CAPPING WITHDRAWABLE VS RE-INVEST MATRIX CARD (Right side top!) ──────── */}
          <div className="card p-5 rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/60 via-white to-white shadow-2xs font-poppins space-y-3.5">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow-2xs">
                  <RiCoinsLine size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">
                    Withdrawable vs Re-invest Matrix
                  </h4>
                  <p className="text-[10px] text-slate-500">Capped by 4X Single ID Multiplier</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-300">
                Max 4X Cap
              </span>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-amber-200 bg-amber-100/50">
                    <th className="text-left py-2 px-2.5 font-bold">Stream</th>
                    <th className="text-center py-2 px-1 font-bold">Cap</th>
                    <th className="text-right py-2 px-1.5 font-bold">Earned ($)</th>
                    <th className="text-right py-2 px-2.5 font-bold">Withdrawable ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/70">
                  {/* PV ROI Row */}
                  <tr className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-2 px-2.5 font-semibold text-slate-900">
                      <span>PV ROI</span>
                      <span className="block text-[9.5px] font-normal text-slate-400">Capital: ${totalInvested.toLocaleString()}</span>
                    </td>
                    <td className="py-2 px-1 text-center font-bold text-amber-800 text-[10px]">
                      3X Cap
                    </td>
                    <td className="py-2 px-1.5 text-right font-extrabold text-slate-800 font-mono">
                      ${effectivePvRoi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-2.5 text-right font-black text-emerald-700 font-mono">
                      ${pvRoiWithdrawable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="block text-[9px] font-bold text-slate-400 font-sans">Max 3X</span>
                    </td>
                  </tr>

                  {/* Level Income Row */}
                  <tr className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-2 px-2.5 font-semibold text-slate-900">
                      <span>Level Income</span>
                      <span className="block text-[9.5px] font-normal text-slate-400">Affiliate network</span>
                    </td>
                    <td className="py-2 px-1 text-center font-semibold text-slate-400 text-[10px]">
                      —
                    </td>
                    <td className="py-2 px-1.5 text-right font-extrabold text-slate-800 font-mono">
                      ${rawLevelIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-2.5 text-right font-black text-emerald-700 font-mono">
                      ${levelIncomeWithdrawable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Total Earning & Max 4X Withdrawable Row */}
                  <tr className="border-t-2 border-amber-300 font-extrabold bg-amber-100/70 text-slate-950">
                    <td className="py-2.5 px-2.5 font-black uppercase text-[11px]" colSpan={2}>
                      Total Earning
                    </td>
                    <td className="py-2.5 px-1.5 text-right font-mono text-slate-900 text-xs font-black">
                      ${totalEarningWallet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-emerald-800 text-xs font-black">
                      ${maxWithdrawableTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="block text-[9px] font-extrabold text-amber-900 font-sans">Max 4X</span>
                    </td>
                  </tr>

                  {/* Balance Can Be Reinvest Row */}
                  <tr className="bg-gradient-to-r from-amber-500/15 via-gold-400/20 to-amber-500/15 font-black text-slate-950">
                    <td className="py-3 px-2.5" colSpan={2}>
                      <span className="text-amber-950 text-xs font-black flex items-center gap-1">
                        <span>Balance Can Be Re-invest</span>
                      </span>
                      <span className="text-[9.5px] font-semibold text-amber-800 block">
                        Exceeds 4X withdrawal quota
                      </span>
                    </td>
                    <td className="py-3 px-1.5 text-right font-mono text-amber-950 text-sm font-black" colSpan={2}>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-base text-amber-900">
                          ${balanceCanBeReinvest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {balanceCanBeReinvest > 0 && (
                          <button
                            type="button"
                            onClick={() => navigate('/plans', { state: { reinvest: true, amount: balanceCanBeReinvest } })}
                            className="px-2.5 py-1 rounded-lg bg-gold-500 hover:bg-gold-600 text-slate-950 text-[10.5px] font-black shadow-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap active:scale-95"
                          >
                            <RiExchangeDollarLine size={13} />
                            <span>Re-invest Now</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 15-Day ROI Withdrawal Window Policy */}
            <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/70 text-emerald-950 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <RiHourglass2Line size={15} className="text-emerald-700 shrink-0" />
                <span className="uppercase tracking-wider text-[10.5px]">15-Day 3X ROI Withdrawal Window Policy</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-900/90 font-medium">
                Only the 3X ROI must be withdrawn within <strong>15 days</strong> of reaching 300% maturity. Otherwise, the unwithdrawn ROI moves to <strong>Administrative Escrow</strong> and can only be withdrawn via Support Ticket release.
              </p>
              {expiringContract && daysLeftToWithdrawRoi !== null && (
                <div className="p-2 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-950 font-bold text-[11px] flex items-center justify-between gap-1">
                  <span>Contract #{expiringContract.customId} completed:</span>
                  <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full font-black">
                    {daysLeftToWithdrawRoi} Day(s) Left to Withdraw
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Withdraw form */}
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
                <p className="text-[11px] text-slate-500 font-poppins mt-1">
                  Available Balance: <strong className="text-emerald-700 font-mono">${totalEarningWallet.toFixed(2)} USD</strong>
                  {maxWithdrawableTotal < totalEarningWallet && (
                    <span className="text-slate-400 ml-1">
                      (Max 4X Withdrawable: <strong className="text-emerald-800 font-mono">${maxWithdrawableTotal.toFixed(2)} USD</strong>)
                    </span>
                  )}
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
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="text-xs font-semibold text-slate-700 font-poppins flex items-center gap-1">
                    <span>{method.id === 'bank' ? 'Bank Account Coordinates' : 'Recipient Wallet Address'}</span>
                    <span className="text-red-500">*</span>
                  </label>
                  {/* Linked Wallet Helper/Status */}
                  {method.type === 'crypto' && (() => {
                    const isBsc = method.id === 'usdt-bep20';
                    const isTron = method.id === 'usdt-trc20';
                    const savedWallet = user?.cryptoWallets?.usdtBep20 || '';

                    if (savedWallet) {
                      const isAutoFilled = address === savedWallet;
                      return (
                        <div className="flex items-center gap-2">
                          {isAutoFilled ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <RiCheckLine size={12} /> Auto-filled from Profile (BEP-20)
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddress(savedWallet)}
                              className="text-[10px] font-bold text-gold-800 hover:text-gold-950 underline cursor-pointer"
                            >
                              Fill Linked Profile Wallet
                            </button>
                          )}
                          <Link to="/profile" className="text-[10px] text-slate-400 hover:text-slate-600 underline">
                            Edit in Profile
                          </Link>
                        </div>
                      );
                    } else {
                      return (
                        <Link
                          to="/profile"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200"
                        >
                          <span>⚠️ No BEP-20 wallet linked — Save in Profile →</span>
                        </Link>
                      );
                    }
                  })()}
                </div>
                <div className="relative">
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={
                      method.id === 'bank'
                        ? 'Bank Name, Account number, IFSC / IBAN / Title...'
                        : 'Enter your external USDT (BEP20) wallet address (e.g. 0x...)'
                    }
                    className="input font-mono text-xs pr-8"
                    required
                  />
                  {address && (
                    <button
                      type="button"
                      onClick={() => setAddress('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      title="Clear address"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {/* Format live feedback */}
                {method.id === 'usdt-bep20' && address && (
                  !address.startsWith('0x') || address.length !== 42 ? (
                    <p className="text-[11px] text-amber-600 mt-1">
                      ⚠️ BSC (BEP-20) address must start with 0x and be 42 characters long.
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                      <RiCheckLine size={13} /> Valid BEP-20 format
                    </p>
                  )
                )}
              </div>

              {/* 3X Cap Capital Exceed Warning (Live check if withdrawal reaches or exceeds invested capital) */}
              {totalInvested > 0 && (totalWithdrawn + numAmount >= totalInvested) && numAmount > 0 && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-poppins space-y-1 text-red-700">
                  <div className="flex items-center gap-2 font-bold text-red-800">
                    <RiAlertLine size={16} className="text-red-600 flex-shrink-0" />
                    <span>Capital Exceeded Warning:</span>
                  </div>
                  <p className="leading-relaxed">
                    Submitting this withdrawal of ${numAmount.toFixed(2)} USD will reach or exceed your total invested capital (${(totalWithdrawn + numAmount).toFixed(2)} / ${totalInvested.toLocaleString()} USD). Your account will be completed and blocked upon submission.
                  </p>
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
              <span>Income Source:</span>
              <strong className="text-slate-900 font-semibold">
                Main Earning Wallet
              </strong>
            </div>
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

      {/* ──────────────── INSTANT ON-CHAIN SMART CONTRACT SUCCESS MODAL ──────────────── */}
      <Modal
        isOpen={isInstantModalOpen}
        onClose={() => setIsInstantModalOpen(false)}
        title="Instant On-Chain Clearance Complete"
        subtitle="Funds have been automatically disbursed directly from the Smart Contract Pool"
      >
        <div className="space-y-5 p-2 font-poppins">
          <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-gradient-to-b from-emerald-500/10 via-emerald-50 to-white border border-emerald-200 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3 animate-bounce">
              <RiShieldCheckLine size={36} />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-300 mb-2">
              BNB Smart Chain (BEP-20) Verified
            </span>
            <h3 className="text-xl font-bold font-display text-slate-900">
              ${instantPayoutData?.netAmount?.toFixed(2)} USD Disbursed
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Your withdrawal was cleared by the automated liquidity pool. Tokens are already in your external wallet!
            </p>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Tracking ID</span>
              <span className="font-mono font-bold text-slate-800">{instantPayoutData?.customId}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Recipient Address</span>
              <span className="font-mono font-semibold text-slate-700 truncate max-w-[180px] sm:max-w-[240px]">
                {instantPayoutData?.recipient}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-1.5">Blockchain Transaction Hash (TxHash)</span>
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-mono text-[11px] text-slate-800 truncate flex-1 select-all">
                  {instantPayoutData?.txHash}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(instantPayoutData?.txHash || '');
                    setCopiedTxHash(true);
                    setTimeout(() => setCopiedTxHash(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedTxHash ? <RiCheckLine size={13} className="text-emerald-600" /> : <RiFileCopyLine size={13} />}
                  <span>{copiedTxHash ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href={instantPayoutData?.explorerUrl || `https://bscscan.com/tx/${instantPayoutData?.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>View On BscScan Explorer</span>
              <RiExternalLinkLine size={15} />
            </a>
            <button
              type="button"
              onClick={() => setIsInstantModalOpen(false)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
