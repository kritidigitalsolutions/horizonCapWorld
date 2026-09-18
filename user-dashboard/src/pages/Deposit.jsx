
import { useState, useEffect, useRef } from 'react';
import {
  RiFileCopyLine, RiCheckLine, RiQrCodeLine,
  RiPlayCircleLine, RiBookOpenLine, RiUploadCloud2Line,
  RiInformationLine, RiAlertLine, RiArrowRightLine,
  RiShieldCheckLine, RiDeleteBinLine, RiRefreshLine,
  RiSmartphoneLine, RiBankLine,
  RiCoinsLine, RiWallet3Line, RiFlashlightLine,
  RiLoader4Line, RiDownload2Line
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getDepositGateways, getDepositVideo, createDeposit } from '../api/depositsApi';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../api/uploadApi';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Link } from 'react-router-dom';

export default function Deposit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gatewaysList, setGatewaysList] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loadingGateways, setLoadingGateways] = useState(true);

  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [paymentSlipPreview, setPaymentSlipPreview] = useState(null);
  const [copiedField, setCopiedField] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submittedDepositInfo, setSubmittedDepositInfo] = useState(null);

  // Synchronized Super Admin Video Tutorial state
  const [tutorialVideo, setTutorialVideo] = useState({
    title: 'Official Deposit Guide',
    subtitle: 'Watch video instructions before transferring funds to ensure instant auto-credit and zero delays.',
    videoType: 'url',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    instructions: [
      'Choose your preferred deposit channel from the left menu.',
      'Copy the official account number, IBAN or wallet address, or scan the verified QR code.',
      'Complete the transfer through your banking or crypto app.',
      'Enter the amount sent and your Transaction ID (TID / Hash) or upload the transfer slip.',
      'Click "Submit deposit" — deposits are verified promptly by administration.',
    ],
  });

  const fetchInitialData = async () => {
    try {
      setLoadingGateways(true);
      const [gatewaysRes, videoRes] = await Promise.allSettled([
        getDepositGateways(),
        getDepositVideo(),
      ]);

      if (gatewaysRes.status === 'fulfilled' && gatewaysRes.value?.success && Array.isArray(gatewaysRes.value.gateways)) {
        const apiGateways = gatewaysRes.value.gateways.map(g => {
          const type = g.type === 'crypto' ? 'crypto' : (g.type === 'bank' ? 'bank' : 'fiat');
          return {
            id: g._id || g.id,
            _id: g._id,
            type,
            name: g.name,
            category: g.category || (type === 'crypto' ? 'Crypto Digital Treasury' : (type === 'bank' ? 'Direct Bank Deposit' : 'Mobile E-Wallet')),
            subtitle: g.subtitle || (g.minLimit && g.maxLimit ? `${g.minLimit} – ${g.maxLimit}` : `$${g.minDeposit || 10} – $${g.maxDeposit || 1000000}`),
            currency: g.currency || (type === 'crypto' ? 'USD' : (type === 'bank' ? 'PKR' : 'PKR')),
            minLimit: g.minLimit || `$${g.minDeposit || 10}`,
            maxLimit: g.maxLimit || `$${g.maxDeposit || 1000000}`,
            accountHolder: g.accountHolder || g.accountName || '',
            accountNumber: g.accountNumber || g.walletAddress || g.address || '',
            address: g.address || g.walletAddress || g.accountNumber || '',
            bankName: g.bankName || '',
            ifsc: g.ifsc || '',
            iban: g.iban || '',
            swiftCode: g.swiftCode || '',
            upiId: g.upiId || '',
            branch: g.branch || '',
            accountType: g.accountType || '',
            cnic: g.cnic || '',
            tillId: g.tillId || '',
            network: g.network || (type === 'crypto' ? 'Mainnet' : 'Mobile Banking'),
            networkCode: g.networkCode || (type === 'crypto' ? 'CRYPTO' : (type === 'bank' ? 'BANK' : 'E-WALLET')),
            confirmationTime: g.confirmationTime || g.processingTime || '5 – 15 Minutes',
            qrCodeUrl: g.qrCodeUrl || g.qrCode || '',
            adminCustomQr: !!(g.qrCodeUrl || g.qrCode),
            tokens: Array.isArray(g.tokens) && g.tokens.length > 0 ? g.tokens : (g.minDeposits && Array.isArray(g.minDeposits) ? g.minDeposits.map(d => d.token) : ['BNB', 'USDT', 'USDC', 'FDUSD']),
            minDeposits: Array.isArray(g.minDeposits) && g.minDeposits.length > 0 ? g.minDeposits : [],
            warning: g.warning || '',
            instructions: g.instructions || 'Transfer the exact amount to the coordinates above, then submit your transaction TID or proof slip below.',
            iconColor: type === 'crypto' ? 'text-amber-600' : (type === 'bank' ? 'text-blue-600' : 'text-emerald-600'),
            iconBg: type === 'crypto' ? 'bg-amber-50 text-amber-600 border-amber-200' : (type === 'bank' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'),
            tagBg: type === 'crypto' ? 'bg-amber-100/80 text-amber-800 border-amber-300' : (type === 'bank' ? 'bg-blue-100/80 text-blue-800 border-blue-300' : 'bg-emerald-100/80 text-emerald-800 border-emerald-300'),
            badgeColor: type === 'crypto' ? 'text-amber-700 bg-amber-50 border-amber-300' : (type === 'bank' ? 'text-blue-700 bg-blue-50 border-blue-300' : 'text-emerald-700 bg-emerald-50 border-emerald-300'),
            accentColor: type === 'crypto' ? '#d97706' : (type === 'bank' ? '#2563eb' : '#059669'),
          };
        });
        setGatewaysList(apiGateways);
        setSelectedMethod(prev => {
          if (!prev) return apiGateways[0] || null;
          const found = apiGateways.find(g => g.id === prev.id || g._id === prev._id);
          return found || apiGateways[0] || null;
        });
      } else {
        setGatewaysList([]);
        setSelectedMethod(null);
      }

      if (videoRes.status === 'fulfilled' && videoRes.value?.success && videoRes.value.video) {
        setTutorialVideo(videoRes.value.video);
      }
    } catch (err) {
      console.warn('Error fetching dynamic gateways:', err.message);
      setGatewaysList([]);
      setSelectedMethod(null);
    } finally {
      setLoadingGateways(false);
    }
  };

  // Fetch Gateways & Video from API on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Real-time synchronization when Admin updates gateways or video
  useEffect(() => {
    const handleVideoSync = (e) => {
      if (e.detail) {
        setTutorialVideo(e.detail);
      } else {
        fetchInitialData();
      }
    };

    const handlePaymentMethodsSync = () => {
      fetchInitialData();
    };

    window.addEventListener('horizon-deposit-video-change', handleVideoSync);
    window.addEventListener('horizon-payment-methods-change', handlePaymentMethodsSync);
    window.addEventListener('storage', handleVideoSync);
    window.addEventListener('storage', handlePaymentMethodsSync);

    return () => {
      window.removeEventListener('horizon-deposit-video-change', handleVideoSync);
      window.removeEventListener('horizon-payment-methods-change', handlePaymentMethodsSync);
      window.removeEventListener('storage', handleVideoSync);
      window.removeEventListener('storage', handlePaymentMethodsSync);
    };
  }, []);

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleDownloadVideo = (url, fileName = "official_deposit_tutorial.mp4") => {
    if (!url) {
      toast.error("Video tutorial file is not available for download.");
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
      toast.success("Deposit guide video download started!", "Downloading Video");
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, "_blank");
    }
  };

  const handleSlipUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const fileSizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target.result;
      setPaymentSlip({
        name: file.name,
        size: fileSizeFormatted,
        rawSize: file.size,
        type: file.type || 'application/octet-stream',
        isImage,
        isPdf,
        dataUrl,
        cloudinaryUrl: null,
        lastModified: file.lastModified
      });
      setPaymentSlipPreview(dataUrl);
    };
    reader.readAsDataURL(file);

    try {
      const uploadRes = await uploadFileToCloudinary(file, {
        folder: 'horizoncap/deposits',
      });
      if (uploadRes?.secure_url) {
        setPaymentSlip(prev => prev ? { ...prev, cloudinaryUrl: uploadRes.secure_url } : null);
      }
    } catch (err) {
      console.warn('Deposit slip direct Cloudinary upload fallback:', err.message);
    }
  };

  const handleRemoveSlip = () => {
    if (paymentSlip?.cloudinaryUrl && paymentSlip.cloudinaryUrl.includes('cloudinary.com')) {
      deleteFileFromCloudinary(paymentSlip.cloudinaryUrl).catch(() => null);
    }
    setPaymentSlip(null);
    setPaymentSlipPreview(null);
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedMethod) {
      const msg = 'Please select a payment channel before submitting.';
      setErrorMsg(msg);
      toast.warning(msg, 'Payment Method Required');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      const msg = 'Please enter a valid deposit amount.';
      setErrorMsg(msg);
      toast.warning(msg, 'Invalid Amount');
      return;
    }

    if (!paymentSlip) {
      const msg = 'Please upload your proof of payment / deposit slip document.';
      setErrorMsg(msg);
      toast.warning(msg, 'Proof Required');
      return;
    }

    setSubmitting(true);
    const numAmount = parseFloat(amount);
    const formattedAmount = `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const refNo = transactionHash.trim() || `REF-${Date.now().toString().slice(-6)}`;

    try {
      const slipUrlToSave = paymentSlip?.cloudinaryUrl || paymentSlip?.dataUrl || '';
      const res = await createDeposit({
        amount: numAmount,
        gateway: selectedMethod.name,
        referenceNo: refNo,
        slipUrl: slipUrlToSave,
      });

      const receiptId = res?.transaction?.customId || `TXN-DP-${Date.now().toString().slice(-6)}`;

      const depositData = {
        id: receiptId,
        user: user?.fullName || user?.name || 'Investor',
        userCustomId: user?.id || '',
        userEmail: user?.email || '',
        userPhone: user?.phone || '',
        country: user?.country || 'Global',
        sponsorId: user?.sponsorId || 'HORIZON-HQ',
        type: 'Deposit',
        amount: formattedAmount,
        rawAmount: numAmount,
        currency: selectedMethod.currency || 'USD',
        gateway: selectedMethod.name,
        gatewayType: selectedMethod.type,
        gatewayAccount: selectedMethod.accountNumber || selectedMethod.address || selectedMethod.bankName || '',
        referenceNo: refNo,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Pending',
        fee: '$0.00',
        netAmount: formattedAmount,
        proofOfPayment: paymentSlip ? {
          fileName: paymentSlip.name,
          fileType: paymentSlip.type,
          fileSize: paymentSlip.size,
          dataUrl: paymentSlip.dataUrl,
          isPdf: paymentSlip.isPdf,
          isImage: paymentSlip.isImage
        } : null,
        clientNote: `Deposit via ${selectedMethod.name} (${selectedMethod.currency})`,
      };

      // Notify other views cleanly
      window.dispatchEvent(new CustomEvent('horizon-transactions-change', { detail: { action: 'refresh' } }));
      window.dispatchEvent(new CustomEvent('horizon-deposit-submitted', { detail: depositData }));

      // Store flash toast for top-right toaster notification after reload
      toast.flash('Deposit submitted successfully! Your funds are queued for verification.', 'success', {
        title: 'Deposit Successful',
        duration: 6000,
      });

      // Clear local input fields
      setAmount('');
      setTransactionHash('');
      setPaymentSlip(null);
      setPaymentSlipPreview(null);

      // Page refresh as requested: submit deposite karte hai page refresh ho jana chahiye
      setTimeout(() => {
        window.location.reload();
      }, 150);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Deposit submission failed. Please try again.';
      setErrorMsg(msg);
      toast.error(msg, 'Deposit Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fiatGateways = gatewaysList.filter(g => g.type === 'fiat' || g.type === 'bank');
  const cryptoGateways = gatewaysList.filter(g => g.type === 'crypto');

  // Returns the EXACT QR code configured/uploaded by Super Admin, or fallback
  const getActiveQrCodeUrl = (method) => {
    if (!method) return '';
    if (method.qrCodeUrl) return method.qrCodeUrl;
    const addressToEncode = method.address || method.accountNumber || 'HorizonCapital';
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(addressToEncode)}`;
  };

  return (
    <div className="page-enter space-y-6">
      {/* ──────── PAGE HEADER ──────── */}
      <PageHeader
        title="Deposit Funds"
        subtitle="Add funds to your deposit wallet via mobile accounts, direct bank wires, or cryptocurrency"
        badge="Instant Gateway"
        actions={
          <button
            type="button"
            onClick={() => setIsVideoModalOpen(true)}
            className="btn btn-outline-gold text-xs px-4 py-2.5 rounded-xl font-bold shadow-xs flex items-center gap-2 cursor-pointer bg-white"
          >
            <RiPlayCircleLine size={18} className="text-gold-700" />
            <span>Watch Deposit Tutorial</span>
          </button>
        }
      />

      {/* ──────── MAIN DEPOSIT INTERFACE ──────── */}
      {loadingGateways ? (
        <div className="card p-16 text-center text-slate-500 font-poppins flex flex-col items-center justify-center space-y-3 min-h-[360px] border border-slate-200">
          <RiLoader4Line className="animate-spin text-gold-600" size={40} />
          <h4 className="text-sm font-bold text-slate-800 font-display">Loading Payment Channels</h4>
          <p className="text-xs text-slate-400">Fetching live payment channels from verified secure node...</p>
        </div>
      ) : gatewaysList.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 font-poppins space-y-4 max-w-xl mx-auto my-8 border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl border border-amber-200 shadow-2xs">
            <RiWallet3Line size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 font-display">No Payment Gateways Available</h3>
            <p className="text-xs text-slate-500 font-normal leading-relaxed max-w-md mx-auto">
              There are currently no active deposit channels configured in the platform. Please check back later or reach out to our 24/7 support desk.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/support" className="btn btn-outline-gold text-xs px-5 py-2.5 rounded-xl font-bold inline-flex items-center gap-2">
              Contact Support Desk
            </Link>
          </div>
        </div>
      ) : selectedMethod ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ════════ LEFT COLUMN: PAYMENT METHODS SELECTOR ════════ */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card p-5 space-y-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 font-poppins">
                  PAYMENT METHODS
                </p>
                <h3 className="text-sm font-bold text-slate-800 font-poppins mt-0.5">
                  Choose how you'll deposit
                </h3>
              </div>

              {/* Section 1: Mobile E-Wallets & Banks */}
              {fiatGateways.length > 0 && (
                <div className="space-y-2">
                  {fiatGateways.map(method => {
                    const isSelected = selectedMethod?.id === method.id || selectedMethod?._id === method._id;
                    return (
                      <button
                        key={method.id || method._id}
                        onClick={() => { setSelectedMethod(method); setErrorMsg(''); }}
                        className={`w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all text-left border cursor-pointer ${
                          isSelected
                            ? 'card-gold border-gold-400 ring-2 ring-gold-200/80 shadow-gold'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold border flex-shrink-0 shadow-2xs ${method.iconBg}`}>
                            {method.type === 'bank' ? (
                              <RiBankLine size={22} />
                            ) : method.name?.toLowerCase().includes('easy') || method.name?.toLowerCase().includes('jazz') ? (
                              <RiSmartphoneLine size={22} />
                            ) : (
                              <RiWallet3Line size={22} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-slate-800 font-poppins block truncate">
                              {method.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-poppins block truncate">
                              {method.subtitle || method.network}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <RiCheckLine size={14} className="font-bold" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Separator: CRYPTOCURRENCY */}
              {cryptoGateways.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px bg-slate-200 flex-1" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 font-poppins">
                      CRYPTOCURRENCY
                    </span>
                    <div className="h-px bg-slate-200 flex-1" />
                  </div>

                  <div className="space-y-2">
                    {cryptoGateways.map(method => {
                      const isSelected = selectedMethod?.id === method.id || selectedMethod?._id === method._id;
                      return (
                        <button
                          key={method.id || method._id}
                          onClick={() => { setSelectedMethod(method); setErrorMsg(''); }}
                          className={`w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all text-left border cursor-pointer ${
                            isSelected
                              ? 'card-gold border-gold-400 ring-2 ring-gold-200/80 shadow-gold'
                              : 'bg-white hover:bg-slate-50/80 border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold border flex-shrink-0 shadow-2xs ${method.iconBg}`}>
                              <RiCoinsLine size={20} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-slate-800 font-poppins block truncate">
                                {method.name}
                              </span>
                              <span className="text-[11px] text-slate-500 font-poppins block truncate">
                                {method.subtitle || method.network}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                              <RiCheckLine size={14} className="font-bold" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ════════ RIGHT COLUMN: DYNAMIC CHANNEL VIEW & INPUT FORM ════════ */}
          <div className="lg:col-span-7">
            <div className="card p-6 sm:p-7 space-y-6 shadow-sm border border-slate-200">
              {/* Top Method Header */}
              <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={`w-13 h-13 rounded-2xl flex items-center justify-center border shadow-2xs flex-shrink-0 ${selectedMethod.iconBg}`}>
                    {selectedMethod.type === 'crypto' ? (
                      <RiCoinsLine size={26} />
                    ) : selectedMethod.type === 'bank' ? (
                      <RiBankLine size={26} />
                    ) : (
                      <RiSmartphoneLine size={26} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-display break-words">
                        {selectedMethod.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider border shadow-2xs uppercase ${selectedMethod.tagBg || 'bg-gold-100 text-gold-800 border-gold-300'}`}>
                        {selectedMethod.networkCode || 'GATEWAY'}
                      </span>
                      <span className="text-xs text-slate-500 font-poppins">
                        {selectedMethod.network || selectedMethod.subtitle}
                      </span>
                    </div>
                  </div>
                </div>

                <Badge variant="success" size="sm" className="flex-shrink-0">
                  Active Gateway
                </Badge>
              </div>

              {/* ─── CASE A: CRYPTOCURRENCY VIEW ─── */}
              {selectedMethod.type === 'crypto' && (
                <div className="space-y-4 font-poppins">
                  {/* Uploaded QR Code & Receiving Address Box */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* QR Code Thumbnail */}
                    <div className="flex items-center gap-3 sm:block">
                      <div
                        onClick={() => setIsQrModalOpen(true)}
                        className="w-20 h-20 rounded-2xl bg-white border-2 border-gold-300/80 p-1 flex-shrink-0 shadow-2xs cursor-pointer hover:border-gold-500 transition-all group relative overflow-hidden"
                        title="Click to open Full QR Code Drawer"
                      >
                        <img
                          src={getActiveQrCodeUrl(selectedMethod)}
                          alt={`${selectedMethod.name} QR Code`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-bold">
                          <RiQrCodeLine size={20} className="mb-0.5" />
                          <span>OPEN QR</span>
                        </div>
                      </div>
                      <div className="sm:hidden min-w-0">
                        <button
                          type="button"
                          onClick={() => setIsQrModalOpen(true)}
                          className="text-xs font-bold text-gold-800 flex items-center gap-1 hover:underline"
                        >
                          <RiQrCodeLine size={14} /> Scan / Expand QR
                        </button>
                        <p className="text-[10px] text-slate-500 mt-0.5">Tap thumbnail to open full size</p>
                      </div>
                    </div>

                    {/* Receiving Identifier */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-poppins">
                          RECEIVING WALLET ADDRESS
                        </p>
                        {selectedMethod.adminCustomQr && (
                          <span className="px-2 py-0.5 bg-gold-100 text-gold-800 text-[10px] font-bold rounded-md border border-gold-300">
                            Admin Uploaded QR
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 shadow-2xs">
                        <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 tracking-wide break-all select-all leading-relaxed pr-1">
                          {selectedMethod.address || selectedMethod.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedMethod.address || selectedMethod.accountNumber, 'cryptoAddr')}
                          className={`btn text-xs px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all flex-shrink-0 self-end xs:self-auto w-full xs:w-auto ${
                            copiedField === 'cryptoAddr'
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs'
                              : 'btn-secondary'
                          }`}
                        >
                          {copiedField === 'cryptoAddr' ? (
                            <>
                              <RiCheckLine size={14} /> Copied!
                            </>
                          ) : (
                            <>
                              <RiFileCopyLine size={14} /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Supported Tokens & Min. Deposit Matrix */}
                  {selectedMethod.tokens && selectedMethod.tokens.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-poppins">
                          SUPPORTED ASSETS
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedMethod.tokens.map(token => (
                            <span
                              key={token}
                              className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold font-mono border border-slate-200 shadow-2xs"
                            >
                              {token}
                            </span>
                          ))}
                        </div>
                      </div>

                      {selectedMethod.minDeposits && selectedMethod.minDeposits.length > 0 && (
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-poppins">
                            MIN. DEPOSIT
                          </label>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono font-bold text-slate-700">
                            {selectedMethod.minDeposits.map(item => (
                              <div key={item.token} className="flex items-center gap-1.5">
                                <span className="text-slate-400 font-normal">{item.token}:</span>
                                <span className="text-slate-900">{item.min}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Warning Alert Banner */}
                  {selectedMethod.warning && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-poppins flex items-start gap-2.5">
                      <RiAlertLine size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-normal">
                        {selectedMethod.warning}
                      </p>
                    </div>
                  )}

                  {/* Guide & Drawer Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsQrModalOpen(true)}
                      className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs font-poppins"
                    >
                      <RiQrCodeLine size={16} className="text-gold-700" />
                      <span>Show Full QR Drawer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsVideoModalOpen(true)}
                      className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs font-poppins"
                    >
                      <RiPlayCircleLine size={16} className="text-emerald-700" />
                      <span>How to deposit? Watch guide</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ─── CASE B: FIAT / MOBILE E-WALLET VIEW ─── */}
              {selectedMethod.type === 'fiat' && (
                <div className="space-y-4 font-poppins">
                  {/* Account / Mobile Number Box */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {selectedMethod.qrCodeUrl ? (
                      <div className="flex items-center gap-3 sm:block">
                        <div
                          onClick={() => setIsQrModalOpen(true)}
                          className="w-20 h-20 rounded-2xl bg-white border-2 border-gold-300/80 p-1 flex-shrink-0 shadow-2xs cursor-pointer hover:border-gold-500 transition-all group relative overflow-hidden"
                          title="Click to open Full QR Code"
                        >
                          <img
                            src={getActiveQrCodeUrl(selectedMethod)}
                            alt={`${selectedMethod.name} QR Code`}
                            className="w-full h-full object-cover rounded-xl"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-bold">
                            <RiQrCodeLine size={20} className="mb-0.5" />
                            <span>OPEN QR</span>
                          </div>
                        </div>
                        <div className="sm:hidden min-w-0">
                          <button
                            type="button"
                            onClick={() => setIsQrModalOpen(true)}
                            className="text-xs font-bold text-gold-800 flex items-center gap-1 hover:underline"
                          >
                            <RiQrCodeLine size={14} /> Scan / Expand QR
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <RiSmartphoneLine size={28} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          REGISTERED MOBILE / ACCOUNT TITLE
                        </p>
                        {selectedMethod.accountHolder && (
                          <span className="text-xs font-bold text-slate-700">
                            {selectedMethod.accountHolder}
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 shadow-2xs">
                        <span className="text-sm font-mono font-bold text-slate-900 tracking-wider break-all select-all leading-relaxed pr-1">
                          {selectedMethod.accountNumber || selectedMethod.address}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedMethod.accountNumber || selectedMethod.address, 'accNo')}
                          className={`btn text-xs px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all flex-shrink-0 self-end xs:self-auto w-full xs:w-auto ${
                            copiedField === 'accNo'
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs'
                              : 'btn-secondary'
                          }`}
                        >
                          {copiedField === 'accNo' ? (
                            <>
                              <RiCheckLine size={14} /> Copied!
                            </>
                          ) : (
                            <>
                              <RiFileCopyLine size={14} /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Extra fields: CNIC / Till ID */}
                  {(selectedMethod.cnic || selectedMethod.tillId) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      {selectedMethod.cnic && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Account CNIC
                          </span>
                          <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                            {selectedMethod.cnic}
                          </span>
                        </div>
                      )}
                      {selectedMethod.tillId && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Till / Merchant ID
                          </span>
                          <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                            {selectedMethod.tillId}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Specs: Limits & Settlement Speed */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Transaction Limit
                      </span>
                      <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                        {selectedMethod.minLimit} – {selectedMethod.maxLimit}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Settlement Speed
                      </span>
                      <span className="font-semibold text-emerald-600 text-xs mt-0.5 block flex items-center gap-1">
                        <RiFlashlightLine size={13} /> {selectedMethod.confirmationTime || 'Instant (< 1 Min)'}
                      </span>
                    </div>
                  </div>

                  {/* Instructions */}
                  {selectedMethod.instructions && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-poppins">
                      <p className="leading-relaxed">{selectedMethod.instructions}</p>
                    </div>
                  )}

                  {/* Guide Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsGuideModalOpen(true)}
                      className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs font-poppins"
                    >
                      <RiBookOpenLine size={16} className="text-slate-500" />
                      <span>Payment guide</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsVideoModalOpen(true)}
                      className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs font-poppins"
                    >
                      <RiPlayCircleLine size={16} className="text-emerald-700" />
                      <span>How to deposit? Watch guide</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ─── CASE C: BANK TRANSFER VIEW ─── */}
              {selectedMethod.type === 'bank' && (
                <div className="space-y-4 font-poppins">
                  {/* Bank Name */}
                  {selectedMethod.bankName && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        BANK NAME
                      </label>
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-sm sm:text-base font-bold text-slate-800">
                          {selectedMethod.bankName}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedMethod.bankName, 'bankName')}
                          className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Copy Bank Name"
                        >
                          {copiedField === 'bankName' ? <RiCheckLine size={18} className="text-emerald-600" /> : <RiFileCopyLine size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Account Number / IBAN */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      ACCOUNT NUMBER / IBAN
                    </label>
                    <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 p-3 sm:p-3.5 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-sm sm:text-base font-mono font-bold text-slate-900 tracking-wider break-all select-all leading-relaxed">
                        {selectedMethod.accountNumber || selectedMethod.iban}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedMethod.accountNumber || selectedMethod.iban, 'accIban')}
                        className={`btn text-xs px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all flex-shrink-0 self-end xs:self-auto w-full xs:w-auto ${
                          copiedField === 'accIban'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs'
                            : 'btn-secondary'
                        }`}
                        title="Copy Account Number"
                      >
                        {copiedField === 'accIban' ? (
                          <>
                            <RiCheckLine size={14} /> Copied!
                          </>
                        ) : (
                          <>
                            <RiFileCopyLine size={14} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Account Title */}
                  {selectedMethod.accountHolder && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        ACCOUNT TITLE
                      </label>
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-sm sm:text-base font-bold text-slate-800">
                          {selectedMethod.accountHolder}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedMethod.accountHolder, 'accTitle')}
                          className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Copy Account Title"
                        >
                          {copiedField === 'accTitle' ? <RiCheckLine size={18} className="text-emerald-600" /> : <RiFileCopyLine size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Domestic / International Bank Details Grid */}
                  {(selectedMethod.ifsc || selectedMethod.upiId || selectedMethod.swiftCode || selectedMethod.branch || selectedMethod.accountType) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      {selectedMethod.ifsc && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium">IFSC:</span>
                          <span className="font-mono font-bold text-slate-900">{selectedMethod.ifsc}</span>
                        </div>
                      )}
                      {selectedMethod.upiId && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium">UPI ID:</span>
                          <span className="font-mono font-bold text-slate-900">{selectedMethod.upiId}</span>
                        </div>
                      )}
                      {selectedMethod.swiftCode && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium">SWIFT / BIC:</span>
                          <span className="font-mono font-bold text-slate-900">{selectedMethod.swiftCode}</span>
                        </div>
                      )}
                      {selectedMethod.accountType && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium">Account Type:</span>
                          <span className="font-bold text-slate-900">{selectedMethod.accountType}</span>
                        </div>
                      )}
                      {selectedMethod.branch && (
                        <div className="flex justify-between items-center col-span-1 sm:col-span-2">
                          <span className="text-slate-400 font-medium">Branch:</span>
                          <span className="font-semibold text-slate-800">{selectedMethod.branch}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notice Info Box */}
                  <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                    <RiInformationLine size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      {selectedMethod.instructions || 'Transfer the exact amount to the account coordinates above, then upload your payment slip below.'}
                    </p>
                  </div>

                  {/* Guide Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsGuideModalOpen(true)}
                      className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs font-poppins"
                    >
                      <RiBookOpenLine size={16} className="text-slate-500" />
                      <span>Bank guide</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsVideoModalOpen(true)}
                      className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs font-poppins"
                    >
                      <RiPlayCircleLine size={16} className="text-emerald-700" />
                      <span>How to deposit? Watch guide</span>
                    </button>
                  </div>
                </div>
              )}

            {/* ════════ DEPOSIT SUBMISSION FORM ════════ */}
            <form onSubmit={handleSubmitDeposit} className="space-y-4 pt-2 border-t border-slate-100 font-poppins">
              {/* Amount Input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  AMOUNT SENT ({selectedMethod.currency}) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder={selectedMethod.currency === 'PKR' ? 'Rs 1 - 100000000' : 'Enter amount sent (e.g. 500)'}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60 font-poppins"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400 font-mono">
                    {selectedMethod.currency}
                  </div>
                </div>
              </div>

              {/* Transaction ID / TID / Hash Input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  TRANSACTION ID (TID / HASH) {selectedMethod.type !== 'bank' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={transactionHash}
                  onChange={e => setTransactionHash(e.target.value)}
                  placeholder="# Paste your transaction hash or TRX ID"
                  className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Provide the transaction ID or reference number. We auto-verify within minutes — if that is not possible, you'll be asked to upload a payment screenshot.
                </p>
              </div>

              {/* Proof of Payment Document Upload (Images, PDFs, Receipts for All Gateways) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    PROOF OF PAYMENT / DEPOSIT SLIP <span className="text-red-500 font-bold">*</span> <span className="text-red-500 text-[10px] font-semibold">(Mandatory Required)</span>
                  </label>
                  <span className="text-[10px] font-semibold text-gold-600 bg-gold-50 px-2 py-0.5 rounded-lg border border-gold-200">
                    PDF, PNG, JPG, Doc
                  </span>
                </div>

                {paymentSlip ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {paymentSlip.isImage ? (
                        <img
                          src={paymentSlip.dataUrl}
                          alt="Slip Preview"
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-xs flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-red-50 border border-red-200 text-red-600 flex flex-col items-center justify-center flex-shrink-0 shadow-xs">
                          <span className="text-[11px] font-black uppercase font-mono">PDF</span>
                          <span className="text-[8px] font-bold text-slate-400">DOC</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate font-poppins">
                          {paymentSlip.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium font-mono mt-0.5">
                          {paymentSlip.size} • {paymentSlip.isPdf ? 'PDF Document' : (paymentSlip.isImage ? 'Image Receipt' : 'File Document')}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-bold font-poppins mt-0.5 flex items-center gap-1">
                          <RiCheckLine size={12} /> Ready for Admin Approval
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveSlip}
                      className="btn btn-secondary text-xs px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 hover:border-red-200 font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      <RiDeleteBinLine size={14} /> Remove
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-gold-400 bg-slate-50/60 hover:bg-gold-50/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                    <input
                      type="file"
                      accept="image/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleSlipUpload}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 shadow-2xs">
                      <RiUploadCloud2Line size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 font-poppins">
                      Click to upload proof of payment / receipt
                    </p>
                    <p className="text-[10px] text-slate-400 font-poppins mt-0.5">
                      Supports PDF, PNG, JPG, WEBP, DOC up to 15 MB
                    </p>
                  </label>
                )}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <RiAlertLine size={16} /> {errorMsg}
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full btn btn-primary py-4 text-sm font-extrabold rounded-2xl shadow-gold flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <RiRefreshLine size={18} className="animate-spin" /> Verifying node...
                  </>
                ) : (
                  <>
                    Submit deposit <RiArrowRightLine size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    ) : null}

      {/* ════════ MODAL 1: SUPER ADMIN VIDEO TUTORIAL MODAL ════════ */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title={tutorialVideo.title || "Official Deposit Tutorial"}
        subtitle="Watch step-by-step video instructions uploaded by platform administration"
        size="lg"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2.5">
            {tutorialVideo.videoUrl && !tutorialVideo.videoUrl.includes('youtube.com') && !tutorialVideo.videoUrl.includes('youtu.be') && (
              <button
                type="button"
                onClick={() => handleDownloadVideo(tutorialVideo.videoUrl, "official_deposit_tutorial.mp4")}
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
              Got it, proceed to deposit
            </button>
          </div>
        }
      >
        <div className="space-y-5 font-poppins">
          {tutorialVideo.subtitle && (
            <p className="text-xs text-slate-600 font-poppins leading-relaxed">
              {tutorialVideo.subtitle}
            </p>
          )}

          <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-card aspect-video w-full flex items-center justify-center">
            {tutorialVideo.videoUrl?.includes('youtube.com') || tutorialVideo.videoUrl?.includes('youtu.be') ? (
              <iframe
                src={tutorialVideo.videoUrl.replace('watch?v=', 'embed/')}
                title="Deposit Tutorial"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={tutorialVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <div className="p-4 rounded-2xl bg-gold-50/70 border border-gold-200 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <RiShieldCheckLine size={16} className="text-gold-700" />
              Verified Deposit Instructions:
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 font-poppins">
              {(tutorialVideo.instructions || []).map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-gold-400 text-slate-950 font-extrabold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>

      {/* ════════ MODAL 2: INSTRUCTIONAL STEP-BY-STEP PAYMENT GUIDE ════════ */}
      {selectedMethod && (
        <Modal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
          title={`${selectedMethod?.name || 'Payment'} Payment Guide`}
          subtitle="Quick reference for initiating your transfer with zero delays"
          size="md"
          footer={
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(false)}
              className="btn btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-gold cursor-pointer"
            >
              Understood
            </button>
          }
        >
          <div className="space-y-4 font-poppins text-xs text-slate-700">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <p className="font-semibold text-slate-900">
                  Open your {selectedMethod?.name} app or banking portal.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <p className="font-semibold text-slate-900">
                  Send payment to: <strong className="text-emerald-700 font-mono">{selectedMethod?.accountNumber || selectedMethod?.address}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0">
                  3
                </span>
                <p className="font-semibold text-slate-900">
                  Confirm recipient name matches: <strong>{selectedMethod?.accountHolder || selectedMethod?.name}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0">
                  4
                </span>
                <p className="font-semibold text-slate-900">
                  Copy your 11-digit TRX ID / TID from SMS or App, paste it in the form, and click Submit.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ════════ MODAL 3: EXACT SUPER ADMIN LUXURY SLIDE-OVER QR DRAWER ════════ */}
      {selectedMethod && (
        <Modal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          title={`${selectedMethod?.name || 'Deposit'}`}
          subtitle={`Official ${selectedMethod?.network || 'Custody'} Deposit Vault & Scannable QR`}
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => copyToClipboard(selectedMethod?.address || selectedMethod?.accountNumber, 'drawerAddr')}
                className="btn btn-secondary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedField === 'drawerAddr' ? (
                  <>
                    <RiCheckLine size={15} className="text-emerald-600" /> Copied Address!
                  </>
                ) : (
                  <>
                    <RiFileCopyLine size={15} /> Copy Address
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="btn btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-gold cursor-pointer"
              >
                Done
              </button>
            </div>
          }
        >
          <div className="space-y-5 font-poppins">
            {/* Top Channel Header Card (Matching Super Admin) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-2xs ${selectedMethod?.iconBg}`}>
                  {selectedMethod?.type === 'crypto' ? <RiCoinsLine size={22} /> : <RiSmartphoneLine size={22} />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-display">
                    {selectedMethod?.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-normal">
                    {selectedMethod?.network || selectedMethod?.subtitle}
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border shadow-2xs uppercase ${selectedMethod?.tagBg || 'bg-gold-100 text-gold-800 border-gold-300'}`}>
                {selectedMethod?.networkCode || 'VAULT'}
              </span>
            </div>

            {/* Large High-Res QR Code Card (Matching Super Admin) */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gold-50/40 via-slate-50 to-slate-50 rounded-3xl border-2 border-gold-300/80 shadow-gold text-center space-y-3">
              <div className="p-3.5 bg-white rounded-3xl border-2 border-gold-400 shadow-md">
                <img
                  src={getActiveQrCodeUrl(selectedMethod)}
                  alt={`${selectedMethod?.name} Official QR`}
                  className="w-52 h-52 sm:w-60 sm:h-60 object-cover rounded-2xl"
                />
              </div>

              <div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-800 font-poppins">
                    SCAN TO PAY WITH WALLET
                  </span>
                  {selectedMethod?.adminCustomQr && (
                    <span className="px-2 py-0.5 bg-gold-400 text-slate-950 text-[10px] font-extrabold rounded-md shadow-2xs">
                      Official Admin QR
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Scan using camera or crypto wallet app
                </p>
              </div>
            </div>

            {/* Wallet Address / Account Number Card */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-poppins">
                RECEIVING IDENTIFIER / WALLET ADDRESS
              </label>
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 break-all select-all leading-relaxed pr-1">
                  {selectedMethod?.address || selectedMethod?.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedMethod?.address || selectedMethod?.accountNumber, 'modalAddr')}
                  className={`btn text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all flex-shrink-0 self-end xs:self-auto w-full xs:w-auto ${
                    copiedField === 'modalAddr'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs'
                      : 'btn-secondary'
                  }`}
                >
                  {copiedField === 'modalAddr' ? (
                    <>
                      <RiCheckLine size={14} /> Copied!
                    </>
                  ) : (
                    <>
                      <RiFileCopyLine size={14} /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Supported Tokens & Min. Deposit Matrix in Drawer */}
            {selectedMethod?.type === 'crypto' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-poppins">
                    SUPPORTED ASSETS
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(selectedMethod?.tokens || (selectedMethod?.minDeposits ? selectedMethod.minDeposits.map(d => d.token) : ['BNB', 'USDT', 'USDC', 'FDUSD'])).map(token => (
                      <span key={token} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-900 text-[10px] font-mono font-bold">
                        {token}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-poppins">
                    MIN. DEPOSIT
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono font-bold text-slate-700">
                    {(selectedMethod?.minDeposits && selectedMethod.minDeposits.length > 0 ? selectedMethod.minDeposits : [
                      { token: 'BNB', min: '0.004' },
                      { token: 'USDT', min: '5' },
                      { token: 'USDC', min: '5' },
                      { token: 'FDUSD', min: '5' },
                    ]).map(item => (
                      <div key={item.token} className="flex items-center gap-1">
                        <span className="text-slate-400 font-normal">{item.token}:</span>
                        <span className="text-slate-900">{item.min}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Specifications Audit Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Network Standard
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block font-mono">
                  {selectedMethod?.networkCode || 'SPL / TRC20'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Settlement Speed
                </span>
                <span className="font-semibold text-emerald-600 mt-0.5 block flex items-center gap-1">
                  <RiFlashlightLine size={13} /> {selectedMethod?.confirmationTime || 'Instant'}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-poppins flex items-start gap-2.5">
              <RiInformationLine size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed font-normal">
                {selectedMethod?.instructions || selectedMethod?.warning || 'Send funds to the verified custody address above. Auto-verified on ledger.'}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* ════════ MODAL 4: DEPOSIT SUBMISSION SUCCESS RECEIPT ════════ */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Deposit Request Submitted"
        subtitle="Official Deposit Transaction Receipt"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Link
              to="/transactions"
              className="btn btn-secondary text-xs px-4 py-2.5 rounded-xl font-bold"
            >
              View in Ledger
            </Link>
            <button
              type="button"
              onClick={() => setIsSuccessModalOpen(false)}
              className="btn btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-gold cursor-pointer"
            >
              Done
            </button>
          </div>
        }
      >
        {submittedDepositInfo && (
          <div className="space-y-5 font-poppins text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <RiCheckLine size={32} className="font-extrabold" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900 font-display">
                Deposit Submitted Successfully!
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-poppins">
                Your deposit is being confirmed by our automated ledger node.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Receipt ID:</span>
                <span className="font-mono font-bold text-slate-900">{submittedDepositInfo.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Channel:</span>
                <span className="font-bold text-slate-900">{submittedDepositInfo.method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Amount:</span>
                <span className="font-bold text-emerald-600 font-display text-sm">
                  {submittedDepositInfo.currency === 'PKR' ? `Rs ${submittedDepositInfo.amount}` : `$${submittedDepositInfo.amount}`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">TID / Hash:</span>
                <span className="font-mono font-semibold text-slate-800 truncate max-w-[180px]">
                  {submittedDepositInfo.hash}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                  {submittedDepositInfo.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
