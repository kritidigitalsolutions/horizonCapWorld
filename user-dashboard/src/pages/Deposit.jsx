import React, { useState, useEffect, useRef } from 'react';
import {
  RiFileCopyLine, RiCheckLine, RiQrCodeLine, RiVideoLine,
  RiPlayCircleLine, RiBookOpenLine, RiUploadCloud2Line,
  RiInformationLine, RiAlertLine, RiArrowRightLine,
  RiShieldCheckLine, RiDeleteBinLine, RiRefreshLine,
  RiExternalLinkLine, RiSmartphoneLine, RiBankLine,
  RiCloseLine, RiCoinsLine, RiGlobalLine, RiWallet3Line,
  RiCheckboxCircleFill, RiTimeLine, RiLockLine, RiFlashlightLine
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { getDepositGateways, getDepositVideo, createDeposit } from '../api/depositsApi';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../api/uploadApi';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Link } from 'react-router-dom';

// Base Gateway Archetypes
const defaultBaseGateways = [
  // ─── FIAT & MOBILE WALLETS ───
  {
    id: 'easypaisa',
    type: 'fiat',
    name: 'EasyPaisa',
    category: 'Mobile E-Wallet',
    subtitle: 'Rs 1.00 – Rs 100,000,000.00',
    currency: 'PKR',
    minLimit: 'Rs 1.00',
    maxLimit: 'Rs 100,000,000.00',
    accountHolder: 'Mashooq Ali',
    accountNumber: '03493588941',
    network: 'EasyPaisa Mobile Banking',
    networkCode: 'EASYPAISA',
    confirmationTime: 'Instant (< 1 Min)',
    qrCodeUrl: '',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    tagBg: 'bg-emerald-100/80 text-emerald-800 border-emerald-300',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    accentColor: '#10b981',
    instructions: 'Send money to EasyPaisa account number 03493588941 (Title: Mashooq Ali). Save your 11-digit TRX ID / TID for instant auto-verification.',
  },
  {
    id: 'jazzcash',
    type: 'fiat',
    name: 'Jazzcash',
    category: 'Mobile E-Wallet',
    subtitle: 'Rs 1.00 – Rs 5,000,000.00',
    currency: 'PKR',
    minLimit: 'Rs 1.00',
    maxLimit: 'Rs 5,000,000.00',
    accountHolder: 'Sathi Communication',
    accountNumber: '988164873',
    network: 'JazzCash Mobile Banking',
    networkCode: 'JAZZCASH',
    confirmationTime: 'Instant (< 1 Min)',
    qrCodeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
    tagBg: 'bg-rose-100/80 text-rose-800 border-rose-300',
    badgeColor: 'text-rose-700 bg-rose-50 border-rose-300',
    accentColor: '#f43f5e',
    instructions: 'Send payment via JazzCash App or Retailer Shop to Mobile/Till 988164873 (Title: Sathi Communication) or scan the official QR code.',
  },
  {
    id: 'bank-transfer',
    type: 'bank',
    name: 'Bank Transfer',
    category: 'Direct Bank Deposit',
    subtitle: 'Direct bank deposit',
    currency: 'PKR',
    minLimit: 'Rs 1,000.00',
    maxLimit: 'Rs 100,000,000.00',
    bankName: 'United Bank Limited (UBL)',
    accountNumber: 'PK90UNIL0109000304771035',
    accountHolder: 'Al Muzammil Communication',
    network: 'Pakistan 1Link / IBFT Inter-Bank',
    networkCode: '1LINK/IBFT',
    confirmationTime: '5 – 15 Minutes',
    qrCodeUrl: '',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    tagBg: 'bg-blue-100/80 text-blue-800 border-blue-300',
    badgeColor: 'text-blue-700 bg-blue-50 border-blue-300',
    accentColor: '#3b82f6',
    instructions: 'Transfer the exact amount to UBL account above, then upload your payment deposit slip below. Your deposit is credited after verification.',
  },
  {
    id: 'indian-bank',
    type: 'bank',
    name: 'Indian Bank (HDFC & UPI)',
    category: 'Indian Domestic',
    subtitle: '₹100.00 – ₹5,000,000.00 INR',
    currency: 'INR',
    minLimit: '₹100.00',
    maxLimit: '₹5,000,000.00',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200084920194',
    ifsc: 'HDFC0000128',
    accountHolder: 'Horizon Capital India Pvt Ltd',
    upiId: 'horizoncapital@hdfcbank',
    network: 'Indian Domestic (IMPS / NEFT / UPI)',
    networkCode: 'INR/UPI',
    confirmationTime: 'Instant (~2 Minutes)',
    qrCodeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50 text-orange-600 border-orange-200',
    tagBg: 'bg-orange-100/80 text-orange-800 border-orange-300',
    badgeColor: 'text-orange-700 bg-orange-50 border-orange-300',
    accentColor: '#f97316',
    instructions: 'Transfer via IMPS / NEFT / RTGS or scan the UPI QR code. Enter your Horizon User ID in remarks.',
  },

  // ─── CRYPTOCURRENCY NETWORKS ───
  {
    id: 'solana',
    type: 'crypto',
    name: 'Solana High-Speed Treasury',
    category: 'Crypto Digital Treasury',
    subtitle: 'SOL · USDC · USDT',
    currency: 'USD / SOL',
    tokens: ['SOL', 'USDC', 'USDT'],
    network: 'Solana Network (SPL)',
    networkCode: 'SOL',
    confirmationTime: 'Instant (< 1 Second)',
    minDeposit: '$25 USD (0.02 SOL)',
    minDeposits: [
      { token: 'SOL', min: '0.02' },
      { token: 'USDC', min: '5' },
      { token: 'USDT', min: '5' },
    ],
    address: 'BpXCs5H9A14LZ6yC62d6wVF6RJhdzFY9KoNPYBjPsRyq',
    qrCodeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
    tagBg: 'bg-purple-100/80 text-purple-800 border-purple-300',
    badgeColor: 'text-purple-700 bg-purple-50 border-purple-300',
    accentColor: '#a855f7',
    warning: 'Only send SOL, USDC, USDT on the Solana network to this address. Sending any other coin or network may result in permanent loss.',
  },
  {
    id: 'tron',
    type: 'crypto',
    name: 'TRON Primary Treasury',
    category: 'Crypto Digital Treasury',
    subtitle: 'TRX · USDT · USDD',
    currency: 'USD / TRX',
    tokens: ['TRX', 'USDT', 'USDD'],
    network: 'TRON (TRC-20)',
    networkCode: 'TRC20',
    confirmationTime: 'Instant (~1 Block)',
    minDeposit: '$10 USD (20 TRX)',
    minDeposits: [
      { token: 'TRX', min: '20' },
      { token: 'USDT', min: '10' },
      { token: 'USDD', min: '10' },
    ],
    address: 'TX78rQw9pL29Ym82K1vNx4B8zQc12aE9mP',
    qrCodeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50 text-red-600 border-red-200',
    tagBg: 'bg-red-100/80 text-red-800 border-red-300',
    badgeColor: 'text-red-700 bg-red-50 border-red-300',
    accentColor: '#ef4444',
    warning: 'Only send TRX, USDT, USDD on the TRC-20 TRON network to this address. Fast 1-block auto credit.',
  },
  {
    id: 'bnb-smart-chain',
    type: 'crypto',
    name: 'BNB Smart Chain Depository',
    category: 'Crypto Digital Treasury',
    subtitle: 'BNB · USDT · USDC · FDUSD',
    currency: 'USD / BNB',
    tokens: ['BNB', 'USDT', 'USDC', 'FDUSD'],
    network: 'BNB Smart Chain (BEP-20)',
    networkCode: 'BSC',
    confirmationTime: 'Instant (~3 Seconds)',
    minDeposit: '$10 USD (0.01 BNB)',
    minDeposits: [
      { token: 'BNB', min: '0.01' },
      { token: 'USDT', min: '10' },
      { token: 'USDC', min: '10' },
      { token: 'FDUSD', min: '10' },
    ],
    address: '0x71C8395B28b07d9f7832B4FaE2429676644B294',
    qrCodeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    tagBg: 'bg-amber-100/80 text-amber-800 border-amber-300',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-300',
    accentColor: '#f59e0b',
    warning: 'Only send BEP-20 (BNB Smart Chain) tokens to this address. Auto-verified on BSC node.',
  },
  {
    id: 'opbnb',
    type: 'crypto',
    name: 'opBNB Layer-2 Fast Hub',
    category: 'Crypto Digital Treasury',
    subtitle: 'BNB · USDT · FDUSD',
    currency: 'USD / BNB',
    tokens: ['BNB', 'USDT', 'FDUSD'],
    network: 'opBNB Mainnet (L2)',
    networkCode: 'OPBNB',
    confirmationTime: 'Instant (< 1 Second)',
    minDeposit: '$5 USD (0.005 BNB)',
    minDeposits: [
      { token: 'BNB', min: '0.005' },
      { token: 'USDT', min: '5' },
      { token: 'FDUSD', min: '5' },
    ],
    address: '0x71C8395B28b07d9f7832B4FaE2429676644B294',
    qrCodeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    iconColor: 'text-yellow-600',
    iconBg: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    tagBg: 'bg-yellow-100/80 text-yellow-800 border-yellow-300',
    badgeColor: 'text-yellow-700 bg-yellow-50 border-yellow-300',
    accentColor: '#eab308',
    warning: 'Only send opBNB Layer-2 network assets. Sub-cent gas fees and instant settlement.',
  },
  {
    id: 'ethereum',
    type: 'crypto',
    name: 'Ethereum Institutional Vault',
    category: 'Crypto Digital Treasury',
    subtitle: 'ETH · USDT · USDC · DAI',
    currency: 'USD / ETH',
    tokens: ['ETH', 'USDT', 'USDC', 'DAI'],
    network: 'Ethereum Mainnet (ERC-20)',
    networkCode: 'ERC20',
    confirmationTime: '2 – 5 Minutes',
    minDeposit: '$50 USD (0.01 ETH)',
    minDeposits: [
      { token: 'ETH', min: '0.01' },
      { token: 'USDT', min: '50' },
      { token: 'USDC', min: '50' },
      { token: 'DAI', min: '50' },
    ],
    address: '0x91890Bf8976C87d9760773E319760773A194821',
    qrCodeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    tagBg: 'bg-indigo-100/80 text-indigo-800 border-indigo-300',
    badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-300',
    accentColor: '#6366f1',
    warning: 'Only send ERC-20 tokens or Native ETH to this custody address. Verified after 12 block confirmations.',
  },
  {
    id: 'polygon',
    type: 'crypto',
    name: 'Polygon PoS Depository',
    category: 'Crypto Digital Treasury',
    subtitle: 'POL · USDT · USDC · USDC.e',
    currency: 'USD / POL',
    tokens: ['POL', 'USDT', 'USDC', 'USDC.e'],
    network: 'Polygon PoS (POL)',
    networkCode: 'POL',
    confirmationTime: 'Instant (~2 Seconds)',
    minDeposit: '$5 USD (10 POL)',
    minDeposits: [
      { token: 'POL', min: '10' },
      { token: 'USDT', min: '5' },
      { token: 'USDC', min: '5' },
    ],
    address: '0x38B124C8395B28b07d9f7832B4FaE2429676644B',
    qrCodeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
    tagBg: 'bg-purple-100/80 text-purple-800 border-purple-300',
    badgeColor: 'text-purple-800 bg-purple-50 border-purple-300',
    accentColor: '#9333ea',
    warning: 'Only send Polygon PoS (POL) network tokens. Low gas fee network.',
  },
  {
    id: 'arbitrum',
    type: 'crypto',
    name: 'Arbitrum One L2 Depository',
    category: 'Crypto Digital Treasury',
    subtitle: 'ARB · ETH · USDT · USDC',
    currency: 'USD / ARB',
    tokens: ['ARB', 'ETH', 'USDT', 'USDC'],
    network: 'Arbitrum One (L2)',
    networkCode: 'ARB',
    confirmationTime: 'Instant (< 1 Second)',
    minDeposit: '$10 USD (10 ARB)',
    minDeposits: [
      { token: 'ARB', min: '10' },
      { token: 'ETH', min: '0.005' },
      { token: 'USDT', min: '10' },
    ],
    address: '0x91890Bf8976C87d9760773E319760773A194821',
    qrCodeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    tagBg: 'bg-cyan-100/80 text-cyan-800 border-cyan-300',
    badgeColor: 'text-cyan-700 bg-cyan-50 border-cyan-300',
    accentColor: '#06b6d4',
    warning: 'Only send Arbitrum One Layer-2 network assets to this custody contract address.',
  },
];

// Helper: Merges Super Admin's configured gateways and EXACT uploaded QR codes
function mergeAdminGateways(baseGateways) {
  const saved = localStorage.getItem('horizon_payment_methods');
  if (!saved) return baseGateways;

  try {
    const adminMethods = JSON.parse(saved);
    if (!Array.isArray(adminMethods) || adminMethods.length === 0) return baseGateways;

    return baseGateways.map(base => {
      // Find matching admin method
      const matched = adminMethods.find(m => {
        if (base.id === 'easypaisa' && (m.provider === 'EasyPaisa' || (m.name || '').toLowerCase().includes('easypaisa'))) return true;
        if (base.id === 'jazzcash' && (m.provider === 'JazzCash' || (m.name || '').toLowerCase().includes('jazzcash'))) return true;
        if (base.id === 'bank-transfer' && (m.category?.includes('International') || m.bankName?.toLowerCase().includes('ubl') || (m.name || '').toLowerCase().includes('bank'))) return true;
        if (base.id === 'indian-bank' && m.category?.includes('Indian')) return true;
        if (base.id === 'solana' && (m.networkCode === 'SOL' || (m.name || '').toLowerCase().includes('solana'))) return true;
        if (base.id === 'tron' && (m.networkCode === 'TRC20' || (m.name || '').toLowerCase().includes('trc') || (m.name || '').toLowerCase().includes('tron'))) return true;
        if (base.id === 'bnb-smart-chain' && (m.networkCode === 'BSC' || (m.name || '').toLowerCase().includes('bnb') || (m.name || '').toLowerCase().includes('smart chain'))) return true;
        if (base.id === 'ethereum' && (m.networkCode === 'ERC20' || (m.name || '').toLowerCase().includes('ethereum'))) return true;
        return m.id === base.id;
      });

      if (!matched) return base;

      // Extract admin-configured account details, tokens, minDeposits and EXACT QR code uploaded by Super Admin!
      const adminQrCode = matched.qrCodeUrl || '';
      const adminAccNo = matched.accountNo || matched.address || base.accountNumber;
      const adminHolder = matched.accountHolder || base.accountHolder;
      const adminBankName = matched.bankName || base.bankName;
      const adminMinDeposit = matched.minDeposit || base.minLimit;
      const adminInstructions = matched.instructions || base.instructions;
      const adminNetwork = matched.network || base.network;
      const adminNetworkCode = matched.networkCode || base.networkCode;
      const adminConfirmation = matched.confirmationTime || base.confirmationTime;
      const adminTokens = matched.tokens || (matched.minDeposits ? matched.minDeposits.map(d => d.token) : base.tokens);
      const adminMinDeposits = (matched.minDeposits && Array.isArray(matched.minDeposits) && matched.minDeposits.length > 0)
        ? matched.minDeposits
        : base.minDeposits;

      return {
        ...base,
        name: matched.name || base.name,
        accountNumber: adminAccNo,
        address: matched.address || adminAccNo,
        accountHolder: adminHolder,
        bankName: adminBankName,
        minLimit: adminMinDeposit,
        minDeposit: adminMinDeposit,
        instructions: adminInstructions,
        network: adminNetwork,
        networkCode: adminNetworkCode,
        confirmationTime: adminConfirmation,
        tokens: adminTokens,
        minDeposits: adminMinDeposits,
        // EXACT QR CODE UPLOADED BY SUPER ADMIN:
        qrCodeUrl: adminQrCode || base.qrCodeUrl,
        adminCustomQr: !!adminQrCode,
      };
    });
  } catch (err) {
    return baseGateways;
  }
}

export default function Deposit() {
  const { user } = useAuth();
  const [gatewaysList, setGatewaysList] = useState(() => mergeAdminGateways(defaultBaseGateways));
  const [selectedMethod, setSelectedMethod] = useState(() => {
    const list = mergeAdminGateways(defaultBaseGateways);
    return list[0];
  });

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
  const defaultVideoData = {
    title: 'Official Deposit Guide: How to deposit via EasyPaisa, JazzCash, Bank Transfer & Crypto',
    subtitle: 'Watch this 2-minute step-by-step video before transferring funds to ensure instant auto-credit and zero delays.',
    videoType: 'url',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    instructions: [
      'Choose your preferred deposit channel from the left menu (EasyPaisa, JazzCash, Bank Transfer, or Crypto).',
      'Copy the official account number, IBAN or wallet address, or scan the verified QR code.',
      'Complete the transfer through your banking or crypto app.',
      'Enter the amount sent and your Transaction ID (TID / Hash) or upload the bank transfer slip.',
      'Click "Submit deposit" — deposits are auto-credited or verified instantly by compliance.',
    ],
  };

  const [tutorialVideo, setTutorialVideo] = useState(() => {
    const saved = localStorage.getItem('horizon_deposit_tutorial_video');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return defaultVideoData;
  });

  // Fetch Gateways & Video from API on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [gatewaysRes, videoRes] = await Promise.allSettled([
          getDepositGateways(),
          getDepositVideo(),
        ]);

        if (gatewaysRes.status === 'fulfilled' && gatewaysRes.value?.success && Array.isArray(gatewaysRes.value.gateways) && gatewaysRes.value.gateways.length > 0) {
          const apiGateways = gatewaysRes.value.gateways.map(g => ({
            id: g._id || g.id,
            type: g.type === 'crypto' ? 'crypto' : (g.type === 'bank' ? 'bank' : 'fiat'),
            name: g.name,
            category: g.category || (g.type === 'crypto' ? 'Crypto Digital Treasury' : 'Mobile E-Wallet'),
            subtitle: g.subtitle || `$${g.minDeposit || 10} – $${g.maxDeposit || 1000000}`,
            currency: g.currency || 'USD',
            minLimit: g.minLimit || `$${g.minDeposit || 10}`,
            maxLimit: g.maxLimit || `$${g.maxDeposit || 1000000}`,
            accountHolder: g.accountName || g.accountHolder || 'Horizon Capital',
            accountNumber: g.accountNumber || g.walletAddress || '',
            address: g.walletAddress || g.address || '',
            network: g.network || 'Mainnet',
            networkCode: g.networkCode || 'CRYPTO',
            confirmationTime: g.processingTime || '5 – 15 Minutes',
            qrCodeUrl: g.qrCode || g.qrCodeUrl || '',
            iconColor: g.type === 'crypto' ? 'text-amber-600' : 'text-emerald-600',
            iconBg: g.type === 'crypto' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
            tagBg: 'bg-gold-100/80 text-gold-800 border-gold-300',
            badgeColor: 'text-gold-700 bg-gold-50 border-gold-300',
            accentColor: '#B8860B',
            instructions: g.instructions || 'Transfer the exact amount to the coordinates above, then submit your transaction TID or proof slip below.',
          }));
          setGatewaysList(apiGateways);
          setSelectedMethod(apiGateways[0]);
        }

        if (videoRes.status === 'fulfilled' && videoRes.value?.success && videoRes.value.video) {
          setTutorialVideo(videoRes.value.video);
        }
      } catch (err) {
        console.warn('Using default gateways and video:', err.message);
      }
    };

    fetchInitialData();
  }, []);

  // Real-time synchronization with Super Admin Video Tutorial & Payment Gateways (including Admin Uploaded QR Codes!)
  useEffect(() => {
    const handleVideoSync = (e) => {
      if (e.detail) {
        setTutorialVideo(e.detail);
      } else {
        const saved = localStorage.getItem('horizon_deposit_tutorial_video');
        if (saved) {
          try { setTutorialVideo(JSON.parse(saved)); } catch (err) { /* ignore */ }
        }
      }
    };

    const handlePaymentMethodsSync = () => {
      const updatedList = mergeAdminGateways(defaultBaseGateways);
      setGatewaysList(updatedList);
      setSelectedMethod(prev => {
        const found = updatedList.find(g => g.id === prev.id);
        return found || updatedList[0];
      });
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

    if (!amount || parseFloat(amount) <= 0) {
      setErrorMsg('Please enter a valid deposit amount.');
      return;
    }

    if (!transactionHash.trim() && !paymentSlip) {
      setErrorMsg('Please enter your Transaction ID (TID / Hash) or upload your proof of payment document.');
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
        user: user?.fullName || user?.name || 'William Max',
        userCustomId: user?.id || 'HORIZON-USR-07',
        userEmail: user?.email || 'william@horizoncap.com',
        userPhone: user?.phone || '+91 9876543210',
        country: user?.country || 'India',
        sponsorId: user?.sponsorId || 'HORIZON-USR-01',
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

      // Persist into horizon_transactions in localStorage for Super Admin sync
      try {
        const savedTxns = localStorage.getItem('horizon_transactions');
        let txnsArray = [];
        if (savedTxns) {
          txnsArray = JSON.parse(savedTxns);
        }
        const updatedTxns = [depositData, ...txnsArray];
        localStorage.setItem('horizon_transactions', JSON.stringify(updatedTxns));
        window.dispatchEvent(new CustomEvent('horizon-transactions-change', { detail: updatedTxns }));
        window.dispatchEvent(new CustomEvent('horizon-deposit-submitted', { detail: depositData }));
      } catch (err) {
        console.error('Error saving transaction cache:', err);
      }

      setSubmittedDepositInfo(depositData);
      setIsSuccessModalOpen(true);
      setAmount('');
      setTransactionHash('');
      setPaymentSlip(null);
      setPaymentSlipPreview(null);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Deposit submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fiatGateways = gatewaysList.filter(g => g.type === 'fiat' || g.type === 'bank');
  const cryptoGateways = gatewaysList.filter(g => g.type === 'crypto');

  // Returns the EXACT QR code configured/uploaded by Super Admin, or fallback
  const getActiveQrCodeUrl = (method) => {
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

      {/* ──────── MAIN 2-COLUMN DEPOSIT INTERFACE ──────── */}
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
            <div className="space-y-2">
              {fiatGateways.map(method => {
                const isSelected = selectedMethod.id === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => { setSelectedMethod(method); setErrorMsg(''); }}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all text-left border cursor-pointer ${
                      isSelected
                        ? 'card-gold border-gold-400 ring-2 ring-gold-200/80 shadow-gold'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold border flex-shrink-0 shadow-2xs ${method.iconBg}`}>
                        {method.name.includes('Easy') ? <RiSmartphoneLine size={22} /> :
                         method.name.includes('Jazz') ? <RiSmartphoneLine size={22} /> :
                         <RiBankLine size={22} />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-800 font-poppins block truncate">
                          {method.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-poppins block truncate">
                          {method.subtitle}
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

            {/* Separator: CRYPTOCURRENCY */}
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
                  const isSelected = selectedMethod.id === method.id;
                  return (
                    <button
                      key={method.id}
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
                            {method.subtitle}
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
          </div>
        </div>

        {/* ════════ RIGHT COLUMN: DYNAMIC CHANNEL VIEW & INPUT FORM ════════ */}
        <div className="lg:col-span-7">
          <div className="card p-6 sm:p-7 space-y-6 shadow-sm border border-slate-200">
            {/* Top Method Header (Matching Super Admin Card Header Design) */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-13 h-13 rounded-2xl flex items-center justify-center border shadow-2xs flex-shrink-0 ${selectedMethod.iconBg}`}>
                  {selectedMethod.type === 'crypto' ? (
                    <RiCoinsLine size={26} />
                  ) : selectedMethod.name.includes('Easy') || selectedMethod.name.includes('Jazz') ? (
                    <RiSmartphoneLine size={26} />
                  ) : (
                    <RiBankLine size={26} />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-display truncate">
                      {selectedMethod.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider border shadow-2xs uppercase ${selectedMethod.tagBg || 'bg-gold-100 text-gold-800 border-gold-300'}`}>
                      {selectedMethod.networkCode || 'GATEWAY'}
                    </span>
                    <span className="text-xs text-slate-500 font-poppins truncate">
                      {selectedMethod.network || selectedMethod.subtitle}
                    </span>
                  </div>
                </div>
              </div>

              <Badge variant="success" size="sm">
                Active Node
              </Badge>
            </div>

            {/* ─── CASE A: CRYPTOCURRENCY VIEW (SUPER ADMIN CARD & DRAWER DESIGN) ─── */}
            {selectedMethod.type === 'crypto' && (
              <div className="space-y-4 font-poppins">
                {/* Uploaded QR Code & Receiving Address Box (Matching Super Admin Card Lines 662-700) */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-4">
                  {/* Uploaded QR Code Thumbnail with Zoom Trigger */}
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

                  {/* Public Receiving Identifier */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-poppins">
                        RECEIVING WALLET ADDRESS
                      </p>
                      {selectedMethod.adminCustomQr && (
                        <span className="px-2 py-0.5 bg-gold-100 text-gold-800 text-[10px] font-bold rounded-md border border-gold-300">
                          Official Admin Vault
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 tracking-wide truncate select-all pr-2">
                        {selectedMethod.address}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedMethod.address, 'cryptoAddr')}
                        className={`btn text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold cursor-pointer transition-all flex-shrink-0 ${
                          copiedField === 'cryptoAddr'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs'
                            : 'btn-secondary'
                        }`}
                      >
                        {copiedField === 'cryptoAddr' ? (
                          <>
                            <RiCheckLine size={13} /> Copied!
                          </>
                        ) : (
                          <>
                            <RiFileCopyLine size={13} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ─── DUAL-COLUMN SUPPORTED TOKENS & MIN. DEPOSIT LIST (EXACT REFERENCE SCREENSHOT) ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs">
                  {/* Left Column: SUPPORTED */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-poppins">
                      SUPPORTED
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(selectedMethod.tokens || (selectedMethod.minDeposits ? selectedMethod.minDeposits.map(d => d.token) : ['BNB', 'USDT', 'USDC', 'FDUSD'])).map(token => (
                        <span
                          key={token}
                          className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold font-mono border border-slate-200 shadow-2xs"
                        >
                          {token}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: MIN. DEPOSIT */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-poppins">
                      MIN. DEPOSIT
                    </label>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono font-bold text-slate-700">
                      {(selectedMethod.minDeposits && selectedMethod.minDeposits.length > 0 ? selectedMethod.minDeposits : [
                        { token: 'BNB', min: '0.004' },
                        { token: 'USDT', min: '5' },
                        { token: 'USDC', min: '5' },
                        { token: 'FDUSD', min: '5' },
                      ]).map(item => (
                        <div key={item.token} className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-normal">{item.token}:</span>
                          <span className="text-slate-900">{item.min}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Warning Alert Banner */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-poppins flex items-start gap-2.5">
                  <RiAlertLine size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-normal">
                    {selectedMethod.warning || 'Only send supported tokens on this exact network. Auto-credited after 1 node confirmation.'}
                  </p>
                </div>

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

            {/* ─── CASE B: EASYPAISA / JAZZCASH VIEW ─── */}
            {selectedMethod.type === 'fiat' && (
              <div className="space-y-4 font-poppins">
                {/* Account / Mobile Number Box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-4">
                  {selectedMethod.qrCodeUrl ? (
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
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                      <RiSmartphoneLine size={28} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        REGISTERED MOBILE NUMBER & TITLE
                      </p>
                      <span className="text-xs font-bold text-slate-700">
                        {selectedMethod.accountHolder}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-sm font-mono font-bold text-slate-900 tracking-wider truncate select-all pr-2">
                        {selectedMethod.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedMethod.accountNumber, 'accNo')}
                        className={`btn text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold cursor-pointer transition-all flex-shrink-0 ${
                          copiedField === 'accNo'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs'
                            : 'btn-secondary'
                        }`}
                      >
                        {copiedField === 'accNo' ? (
                          <>
                            <RiCheckLine size={13} /> Copied!
                          </>
                        ) : (
                          <>
                            <RiFileCopyLine size={13} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

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

                {/* Account Number / IBAN */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    ACCOUNT NUMBER / IBAN
                  </label>
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-sm sm:text-base font-mono font-bold text-slate-900 tracking-wider break-all">
                      {selectedMethod.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedMethod.accountNumber, 'accIban')}
                      className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedField === 'accIban' ? <RiCheckLine size={18} className="text-emerald-600" /> : <RiFileCopyLine size={18} />}
                    </button>
                  </div>
                </div>

                {/* Account Title */}
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

                {/* Notice Info Box */}
                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                  <RiInformationLine size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Transfer the exact amount to the account above, then upload your payment slip below. Your deposit is credited after admin verification.
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
                    PROOF OF PAYMENT / DEPOSIT SLIP <span className="text-slate-400 font-normal">(Optional if Hash provided)</span>
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

      {/* ════════ MODAL 1: SUPER ADMIN VIDEO TUTORIAL MODAL ════════ */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title={tutorialVideo.title || "Official Deposit Tutorial"}
        subtitle="Watch step-by-step video instructions uploaded by platform administration"
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => setIsVideoModalOpen(false)}
            className="btn btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-gold cursor-pointer"
          >
            Got it, proceed to deposit
          </button>
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
      <Modal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        title={`${selectedMethod.name} Payment Guide`}
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
                Open your {selectedMethod.name} app or banking portal.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0">
                2
              </span>
              <p className="font-semibold text-slate-900">
                Send payment to: <strong className="text-emerald-700 font-mono">{selectedMethod.accountNumber || selectedMethod.address}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0">
                3
              </span>
              <p className="font-semibold text-slate-900">
                Confirm recipient name matches: <strong>{selectedMethod.accountHolder || selectedMethod.name}</strong>
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

      {/* ════════ MODAL 3: EXACT SUPER ADMIN LUXURY SLIDE-OVER QR DRAWER ════════ */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`${selectedMethod.name}`}
        subtitle={`Official ${selectedMethod.network || 'Custody'} Deposit Vault & Scannable QR`}
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => copyToClipboard(selectedMethod.address || selectedMethod.accountNumber, 'drawerAddr')}
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
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-2xs ${selectedMethod.iconBg}`}>
                {selectedMethod.type === 'crypto' ? <RiCoinsLine size={22} /> : <RiSmartphoneLine size={22} />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-display">
                  {selectedMethod.name}
                </h4>
                <p className="text-xs text-slate-500 font-normal">
                  {selectedMethod.network || selectedMethod.subtitle}
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border shadow-2xs uppercase ${selectedMethod.tagBg || 'bg-gold-100 text-gold-800 border-gold-300'}`}>
              {selectedMethod.networkCode || 'VAULT'}
            </span>
          </div>

          {/* Large High-Res QR Code Card (Matching Super Admin) */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gold-50/40 via-slate-50 to-slate-50 rounded-3xl border-2 border-gold-300/80 shadow-gold text-center space-y-3">
            <div className="p-3.5 bg-white rounded-3xl border-2 border-gold-400 shadow-md">
              <img
                src={getActiveQrCodeUrl(selectedMethod)}
                alt={`${selectedMethod.name} Official QR`}
                className="w-52 h-52 sm:w-60 sm:h-60 object-cover rounded-2xl"
              />
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-800 font-poppins">
                  SCAN TO PAY WITH WALLET
                </span>
                {selectedMethod.adminCustomQr && (
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
            <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 break-all select-all pr-2">
                {selectedMethod.address || selectedMethod.accountNumber}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(selectedMethod.address || selectedMethod.accountNumber, 'modalAddr')}
                className={`btn text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer transition-all flex-shrink-0 ${
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
          {selectedMethod.type === 'crypto' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-poppins">
                  SUPPORTED ASSETS
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(selectedMethod.tokens || (selectedMethod.minDeposits ? selectedMethod.minDeposits.map(d => d.token) : ['BNB', 'USDT', 'USDC', 'FDUSD'])).map(token => (
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
                  {(selectedMethod.minDeposits && selectedMethod.minDeposits.length > 0 ? selectedMethod.minDeposits : [
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
                {selectedMethod.networkCode || 'SPL / TRC20'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Settlement Speed
              </span>
              <span className="font-semibold text-emerald-600 mt-0.5 block flex items-center gap-1">
                <RiFlashlightLine size={13} /> {selectedMethod.confirmationTime || 'Instant'}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-poppins flex items-start gap-2.5">
            <RiInformationLine size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-normal">
              {selectedMethod.instructions || selectedMethod.warning || 'Send funds to the verified custody address above. Auto-verified on ledger.'}
            </p>
          </div>
        </div>
      </Modal>

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
