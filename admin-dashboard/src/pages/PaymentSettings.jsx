import React, { useState, useEffect, useRef } from "react";
import {
  RiAddLine,
  RiQrCodeLine,
  RiWallet3Line,
  RiEditLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiStarLine,
  RiGlobalLine,
  RiTimeLine,
  RiShieldCheckLine,
  RiAlertLine,
  RiCoinsLine,
  RiBankLine,
  RiFlashlightLine,
  RiArrowRightLine,
  RiInformationLine,
  RiUploadCloud2Line,
  RiBuildingLine,
  RiImageAddLine,
  RiCloseLine,
  RiSmartphoneLine,
  RiPhoneLine,
  RiIdCardLine,
  RiVideoLine,
  RiPlayCircleLine,
  RiMovieLine,
  RiYoutubeLine,
  RiFolderVideoLine,
  RiLoader4Line,
  RiEyeLine,
  RiFileCopyLine,
  RiPercentLine,
} from "react-icons/ri";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import SearchBar from "../components/ui/SearchBar";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import PageHeader from "../components/ui/PageHeader";

// IMPORT YOUR API FUNCTIONS HERE (Adjust the path as needed)
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getDepositVideo,
  updateDepositVideo,
  getWithdrawalSettings,
  updateWithdrawalSettings,
} from "../api/paymentGatewaysApi";
import { uploadFileToCloudinary, deleteFileFromCloudinary } from "../api/uploadApi";
import { useToast } from "../context/ToastContext";

export default function PaymentSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Drawer & Modals State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [qrModalWallet, setQrModalWallet] = useState(null);
  const [walletToDelete, setWalletToDelete] = useState(null);
  const [copiedWalletId, setCopiedWalletId] = useState(null);

  // ──────── DEPOSIT VIDEO TUTORIAL STUDIO STATE ────────
  const defaultTutorialVideo = {
    title:
      "Official Deposit Guide: How to deposit via EasyPaisa, JazzCash, Bank Transfer & Crypto",
    subtitle:
      "Watch this 2-minute step-by-step video before transferring funds to ensure instant auto-credit and zero delays.",
    videoType: "url",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    uploadedVideoName: "",
    instructions: [
      "Choose your preferred deposit channel from the left menu.",
      "Copy the official account number, IBAN or wallet address.",
      "Complete the transfer through your banking or crypto app.",
      "Enter the amount sent and your Transaction ID (TID / Hash).",
      'Click "Submit deposit" — deposits are auto-credited instantly.',
    ],
    status: "Published",
  };

  const [tutorialVideo, setTutorialVideo] = useState(defaultTutorialVideo);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
  const [videoForm, setVideoForm] = useState(defaultTutorialVideo);
  const [videoSavedNotification, setVideoSavedNotification] = useState(false);
  const videoFileInputRef = useRef(null);

  // ──────── WITHDRAWAL CHARGES & POLICY STATE ────────
  const defaultWithdrawalSettings = {
    feeType: "percentage",
    feePercentage: 5,
    fixedFee: 0,
    minWithdrawal: 5,
    maxWithdrawal: 50000,
    singleIdMaxWithdrawal: "3X + Capital Maximum Withdrawal Allowed",
    singleIdMaxWithdrawalMultiplier: 4,
    processingTime: "12 - 24 Hours",
    feeEnabled: true,
    termsNotice:
      "Automated clearance turnaround within 12-24 hours. Standard platform protocol fee is applied upon withdrawal submission. Single ID maximum withdrawal allowed is 3X + Capital.",
  };

  const [withdrawalSettings, setWithdrawalSettings] = useState(defaultWithdrawalSettings);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState(defaultWithdrawalSettings);
  const [savingWithdrawal, setSavingWithdrawal] = useState(false);
  const [withdrawalSavedNotice, setWithdrawalSavedNotice] = useState(false);

  // Form State
  const [category, setCategory] = useState("Mobile E-Wallet");
  const [name, setName] = useState("");
  const [network, setNetwork] = useState("EasyPaisa Mobile Banking");
  const [networkCode, setNetworkCode] = useState("EASYPAISA");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [minDeposit, setMinDeposit] = useState("PKR 1,500 (~$5 USD)");
  const [confirmationTime, setConfirmationTime] = useState(
    "Instant / 5 Minutes",
  );
  const [instructions, setInstructions] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [status, setStatus] = useState("Active");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrUploadError, setQrUploadError] = useState("");

  // Mobile E-Wallet Form Fields
  const [ewalletProvider, setEwalletProvider] = useState("EasyPaisa");
  const [ewalletMobileNo, setEwalletMobileNo] = useState("");
  const [ewalletAccountTitle, setEwalletAccountTitle] = useState("");
  const [ewalletCnic, setEwalletCnic] = useState("");
  const [ewalletTillId, setEwalletTillId] = useState("");

  // Indian Bank Form Fields
  const [indianBankName, setIndianBankName] = useState("HDFC Bank Ltd");
  const [indianAccountNo, setIndianAccountNo] = useState("");
  const [indianIfsc, setIndianIfsc] = useState("");
  const [indianHolder, setIndianHolder] = useState(
    "Horizon Capital India Pvt Ltd",
  );
  const [indianAccountType, setIndianAccountType] = useState("Current Account");
  const [indianBranch, setIndianBranch] = useState("Mumbai, India");
  const [indianUpiId, setIndianUpiId] = useState("");

  // International Bank Form Fields
  const [intlBankName, setIntlBankName] = useState("JPMorgan Chase Bank, N.A.");
  const [intlAccountNo, setIntlAccountNo] = useState("");
  const [intlSwift, setIntlSwift] = useState("CHASUS33XXX");
  const [intlRouting, setIntlRouting] = useState("021000021");
  const [intlHolder, setIntlHolder] = useState(
    "Horizon Capital Global Holdings LLC",
  );
  const [intlAccountType, setIntlAccountType] = useState(
    "Corporate Escrow Trust",
  );
  const [intlBranch, setIntlBranch] = useState("270 Park Ave, New York, USA");

  const [cryptoMinDeposits, setCryptoMinDeposits] = useState([
    { token: "BNB", min: "0.004" },
    { token: "USDT", min: "5" },
    { token: "USDC", min: "5" },
    { token: "FDUSD", min: "5" },
  ]);

  const fileInputRef = useRef(null);

  // ──────── FETCH DATA ON MOUNT ────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [methodsRes, videoRes, withdrawalRes] = await Promise.all([
          getPaymentMethods().catch(() => null),
          getDepositVideo().catch(() => null),
          getWithdrawalSettings().catch(() => null),
        ]);

        if (methodsRes) {
          const list = Array.isArray(methodsRes)
            ? methodsRes
            : Array.isArray(methodsRes.methods)
              ? methodsRes.methods
              : [];
          setMethods(list);
        }
        if (videoRes) {
          const videoData = videoRes.video || videoRes;
          if (videoData && typeof videoData === "object") {
            setTutorialVideo((prev) => ({ ...prev, ...videoData }));
          }
        }
        if (withdrawalRes?.withdrawalSettings) {
          setWithdrawalSettings(withdrawalRes.withdrawalSettings);
          setWithdrawalForm(withdrawalRes.withdrawalSettings);
        }
      } catch (error) {
        console.error("Error loading payment data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddTokenRow = () => {
    setCryptoMinDeposits([...cryptoMinDeposits, { token: "", min: "5" }]);
  };

  const handleRemoveTokenRow = (idx) => {
    setCryptoMinDeposits(cryptoMinDeposits.filter((_, i) => i !== idx));
  };

  const handleTokenRowChange = (idx, field, value) => {
    const updated = [...cryptoMinDeposits];
    updated[idx] = { ...updated[idx], [field]: value };
    setCryptoMinDeposits(updated);
  };

  const handleApplyCryptoPreset = (presetKey) => {
    // Preset logic remains unchanged
    if (presetKey === "bnb") {
      setName("BNB Smart Chain Depository");
      setNetwork("BNB Smart Chain (BEP-20)");
      setNetworkCode("BSC");
      setMinDeposit("$10 USD (0.004 BNB)");
      setCryptoMinDeposits([
        { token: "BNB", min: "0.004" },
        { token: "USDT", min: "5" },
        { token: "USDC", min: "5" },
        { token: "FDUSD", min: "5" },
      ]);
    } else if (presetKey === "solana") {
      setName("Solana High-Speed Treasury");
      setNetwork("Solana Network (SPL)");
      setNetworkCode("SOL");
      setMinDeposit("$25 USD (0.02 SOL)");
      setCryptoMinDeposits([
        { token: "SOL", min: "0.02" },
        { token: "USDC", min: "5" },
        { token: "USDT", min: "5" },
      ]);
    } else if (presetKey === "tron") {
      setName("TRON Primary Treasury");
      setNetwork("TRON (TRC-20)");
      setNetworkCode("TRC20");
      setMinDeposit("$10 USD (20 TRX)");
      setCryptoMinDeposits([
        { token: "TRX", min: "20" },
        { token: "USDT", min: "10" },
        { token: "USDD", min: "10" },
      ]);
    } else if (presetKey === "eth") {
      setName("Ethereum Institutional Vault");
      setNetwork("Ethereum Mainnet (ERC-20)");
      setNetworkCode("ERC20");
      setMinDeposit("$50 USD (0.01 ETH)");
      setCryptoMinDeposits([
        { token: "ETH", min: "0.01" },
        { token: "USDT", min: "50" },
        { token: "USDC", min: "50" },
        { token: "DAI", min: "50" },
      ]);
    } else if (presetKey === "polygon") {
      setName("Polygon PoS Depository");
      setNetwork("Polygon PoS (POL)");
      setNetworkCode("POL");
      setMinDeposit("$5 USD (10 POL)");
      setCryptoMinDeposits([
        { token: "POL", min: "10" },
        { token: "USDT", min: "5" },
        { token: "USDC", min: "5" },
      ]);
    } else if (presetKey === "opbnb") {
      setName("opBNB Layer-2 Fast Hub");
      setNetwork("opBNB Mainnet (L2)");
      setNetworkCode("OPBNB");
      setMinDeposit("$5 USD (0.005 BNB)");
      setCryptoMinDeposits([
        { token: "BNB", min: "0.005" },
        { token: "USDT", min: "5" },
        { token: "FDUSD", min: "5" },
      ]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setQrUploadError("Please select a valid image file (PNG, JPG, WEBP, SVG).");
      return;
    }

    setQrUploadError("");
    setUploadingQr(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      setQrCodeUrl(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      const previousQr =
        qrCodeUrl && qrCodeUrl.startsWith("https://res.cloudinary.com")
          ? qrCodeUrl
          : editingWallet?.qrCodeUrl;
      const uploadRes = await uploadFileToCloudinary(file, {
        folder: "horizoncap/payments",
        oldUrl: previousQr,
      });
      if (uploadRes?.secure_url) {
        setQrCodeUrl(uploadRes.secure_url);
      }
    } catch (err) {
      console.warn("QR code upload to Cloudinary fallback:", err.message);
    } finally {
      setUploadingQr(false);
    }
  };

  const handleRemoveQrCode = () => {
    if (qrCodeUrl && qrCodeUrl.includes("cloudinary.com")) {
      deleteFileFromCloudinary(qrCodeUrl).catch(() => null);
    }
    setQrCodeUrl("");
    setQrUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAutoGenerateQr = () => {
    const rawTarget =
      category === "Crypto Digital Wallet"
        ? address
        : category === "Mobile E-Wallet"
          ? ewalletMobileNo
          : category === "Indian Bank Account"
            ? (indianUpiId || indianAccountNo)
            : intlAccountNo;

    const dataToEncode = rawTarget
      ? rawTarget.trim()
      : address || name || "HorizonCapital";
    if (!dataToEncode) {
      alert("Please enter a wallet address first to generate its QR code.");
      return;
    }
    const generatedUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(dataToEncode)}`;
    setQrCodeUrl(generatedUrl);
  };

  const handleOpenVideoStudio = () => {
    setVideoForm(tutorialVideo);
    setVideoModalOpen(true);
  };

  // ──────── SAVE / UPDATE VIDEO TUTORIAL ────────
  const handleSaveVideoTutorial = async () => {
    try {
      const updated = await updateDepositVideo(videoForm);
      const videoData = updated?.video || updated;
      if (videoData && typeof videoData === "object") {
        setTutorialVideo((prev) => ({ ...prev, ...videoData }));
      }
      setVideoSavedNotification(true);
      setVideoModalOpen(false);
      toast.success("Deposit video tutorial and verified instructions saved successfully!", "Video Tutorial Updated");
      setTimeout(() => setVideoSavedNotification(false), 3000);
    } catch (error) {
      console.error("Failed to update video:", error);
      toast.error("Failed to update deposit video tutorial.", "Update Failed");
    }
  };

  // ──────── SAVE / UPDATE WITHDRAWAL CHARGES & POLICY ────────
  const handleSaveWithdrawalSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingWithdrawal(true);
    try {
      const res = await updateWithdrawalSettings(withdrawalForm);
      const wsData = res?.withdrawalSettings || res;
      if (wsData && typeof wsData === "object") {
        setWithdrawalSettings(wsData);
        setWithdrawalForm(wsData);
      }
      setWithdrawalSavedNotice(true);
      setWithdrawalModalOpen(false);
      toast.success("Withdrawal charges, protocols and limits saved successfully!", "Withdrawal Rules Updated");
      setTimeout(() => setWithdrawalSavedNotice(false), 3500);
    } catch (err) {
      console.error("Failed to update withdrawal settings:", err);
      toast.error("Failed to save withdrawal settings.", "Update Failed");
    } finally {
      setSavingWithdrawal(false);
    }
  };

  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const videoObjectUrl = URL.createObjectURL(file);
    setVideoForm((prev) => ({
      ...prev,
      videoType: "upload",
      videoUrl: videoObjectUrl,
      uploadedVideoName: file.name,
    }));

    try {
      const previousVideo = tutorialVideo?.videoUrl;
      const uploadRes = await uploadFileToCloudinary(file, {
        folder: "horizoncap/videos",
        resource_type: "video",
        oldUrl: previousVideo,
      });
      if (uploadRes?.secure_url) {
        setVideoForm((prev) => ({
          ...prev,
          videoUrl: uploadRes.secure_url,
        }));
      }
    } catch (err) {
      console.warn("Video upload to Cloudinary fallback:", err.message);
    }
  };

  const openCreateDrawer = (defaultCat = "Mobile E-Wallet") => {
    setEditingWallet(null);
    setCategory(defaultCat);
    setName("");
    setIsDefault(false);
    setStatus("Active");
    setQrCodeUrl("");
    setUploadingQr(false);
    setQrUploadError("");

    if (defaultCat === "Mobile E-Wallet") {
      setEwalletProvider("EasyPaisa");
      setEwalletMobileNo("");
      setEwalletAccountTitle("");
      setEwalletCnic("");
      setEwalletTillId("");
      setNetwork("EasyPaisa Mobile Banking");
      setNetworkCode("EASYPAISA");
      setMinDeposit("PKR 1,500 (~$5 USD)");
      setConfirmationTime("Instant / 5 Minutes");
      setInstructions(
        "Send payment to this mobile number or scan QR code. Save transaction TRX ID as deposit proof.",
      );
    } else if (defaultCat === "Indian Bank Account") {
      setIndianBankName("HDFC Bank Ltd");
      setIndianAccountNo("");
      setIndianIfsc("HDFC0000128");
      setIndianHolder("Horizon Capital India Pvt Ltd");
      setIndianAccountType("Current Account");
      setIndianBranch("Nariman Point, Mumbai");
      setIndianUpiId("horizoncapital@hdfcbank");
      setNetwork("Indian Domestic (IMPS / NEFT / RTGS / UPI)");
      setNetworkCode("INR");
      setMinDeposit("₹5,000 INR (~$60 USD)");
      setConfirmationTime("Instant / 15 Minutes");
      setInstructions(
        "Transfer via IMPS/NEFT/RTGS or UPI QR. Include user ID in remarks.",
      );
    } else if (defaultCat === "International Bank Account") {
      setIntlBankName("JPMorgan Chase Bank, N.A.");
      setIntlAccountNo("");
      setIntlSwift("CHASUS33XXX");
      setIntlRouting("021000021");
      setIntlHolder("Horizon Capital Global Holdings LLC");
      setIntlAccountType("Corporate Escrow Trust");
      setIntlBranch("270 Park Ave, New York, USA");
      setNetwork("Global Wire Transfer / SWIFT / FedNow");
      setNetworkCode("GLOBAL");
      setMinDeposit("$5,000 USD");
      setConfirmationTime("1-2 Business Days");
      setInstructions(
        "Official USD custody escrow account. Specify User ID in Field 70 memo.",
      );
    } else {
      setName("BNB Smart Chain Depository");
      setNetwork("BNB Smart Chain (BEP-20)");
      setNetworkCode("BSC");
      setAddress("");
      setMemo("");
      setMinDeposit("$10 USD (0.004 BNB)");
      setConfirmationTime("Instant (~3 Seconds)");
      setInstructions(
        "Send only BEP-20 tokens (BNB, USDT, USDC, FDUSD) to this address. Verified automatically.",
      );
      setCryptoMinDeposits([
        { token: "BNB", min: "0.004" },
        { token: "USDT", min: "5" },
        { token: "USDC", min: "5" },
        { token: "FDUSD", min: "5" },
      ]);
    }

    setDrawerOpen(true);
  };

  const openEditDrawer = (w) => {
    setEditingWallet(w);
    setCategory(w.category || "Mobile E-Wallet");
    setName(w.name || "");
    setNetwork(w.network || "");
    setNetworkCode(w.networkCode || "");
    setAddress(w.address || "");
    setMemo(w.memo || "");
    setMinDeposit(w.minLimit || w.minDeposit || "$50 USD");
    setConfirmationTime(w.confirmationTime || "Instant");
    setInstructions(w.instructions || "");
    setIsDefault(!!w.isDefault);
    setStatus(w.status || "Active");
    setQrCodeUrl(w.qrCodeUrl || "");
    setUploadingQr(false);
    setQrUploadError("");

    if (
      w.minDeposits &&
      Array.isArray(w.minDeposits) &&
      w.minDeposits.length > 0
    ) {
      setCryptoMinDeposits(w.minDeposits);
    } else if (w.tokens && Array.isArray(w.tokens)) {
      setCryptoMinDeposits(w.tokens.map((t) => ({ token: t, min: "5" })));
    }

    if (w.category === "Mobile E-Wallet") {
      setEwalletProvider(w.provider || "EasyPaisa");
      setEwalletMobileNo(w.accountNumber || "");
      setEwalletAccountTitle(w.accountHolder || "");
      setEwalletCnic(w.cnic || w.memo?.replace("CNIC: ", "") || "");
      setEwalletTillId(w.tillId || "");
    } else if (w.category === "Indian Bank Account") {
      setIndianBankName(w.bankName || "HDFC Bank Ltd");
      setIndianAccountNo(w.accountNumber || "");
      setIndianIfsc(w.ifsc || "HDFC0000128");
      setIndianHolder(w.accountHolder || "Horizon Capital India Pvt Ltd");
      setIndianAccountType(w.accountType || "Current Account");
      setIndianBranch(w.branch || "Mumbai, India");
      setIndianUpiId(w.upiId || w.memo?.replace("UPI: ", "") || "");
    } else if (w.category === "International Bank Account") {
      setIntlBankName(w.bankName || "JPMorgan Chase Bank, N.A.");
      setIntlAccountNo(w.accountNumber || w.iban || "");
      setIntlSwift(
        w.swiftCode || w.memo?.replace("SWIFT: ", "") || "CHASUS33XXX",
      );
      setIntlRouting(w.routingNo || "021000021");
      setIntlHolder(w.accountHolder || "Horizon Capital Global Holdings LLC");
      setIntlAccountType(w.accountType || "Corporate Escrow Trust");
      setIntlBranch(w.branch || "270 Park Ave, New York, USA");
    }
    setDrawerOpen(true);
  };

  // ──────── SAVE / UPDATE PAYMENT METHOD ────────
  const handleSaveWallet = async () => {
    let finalName = name;
    let finalAddress = address;
    let finalMemo = memo;
    let finalNetwork = network;
    let finalCode = networkCode;

    // Resolve DB `type` mapping
    let schemaType = "crypto";
    if (category === "Mobile E-Wallet") schemaType = "fiat";
    else if (category.includes("Bank")) schemaType = "bank";

    if (category === "Mobile E-Wallet") {
      finalName = `${ewalletProvider} Official Merchant Wallet`;
      finalAddress = `Mobile No: ${ewalletMobileNo || "0300 0000000"} • Title: ${ewalletAccountTitle || "Horizon Agent"}`;
      finalMemo = ewalletCnic
        ? `CNIC: ${ewalletCnic}`
        : ewalletTillId
          ? `Till ID: ${ewalletTillId}`
          : "";
      finalNetwork = `${ewalletProvider} Mobile Banking`;
      finalCode = ewalletProvider.toUpperCase().replace(/\s+/g, "");
    } else if (category === "Indian Bank Account") {
      finalName = `${indianBankName} Corporate Account`;
      finalAddress = `A/C: ${indianAccountNo || "50200084920194"} • IFSC: ${indianIfsc || "HDFC0000128"}`;
      finalMemo = indianUpiId ? `UPI: ${indianUpiId}` : "";
      finalNetwork = "Indian Domestic (IMPS / NEFT / RTGS / UPI)";
      finalCode = "INR";
    } else if (category === "International Bank Account") {
      finalName = `${intlBankName} Institutional Wire`;
      finalAddress = `A/C: ${intlAccountNo || "109288492019"} • Routing: ${intlRouting || "021000021"}`;
      finalMemo = intlSwift ? `SWIFT: ${intlSwift}` : "";
      finalNetwork = "Global Wire Transfer / SWIFT / FedNow";
      finalCode = "GLOBAL";
    }

    if (!finalName.trim() || !finalAddress.trim()) return;

    const validMinDeposits = cryptoMinDeposits.filter(
      (d) => d.token && d.token.trim(),
    );
    const validTokens = validMinDeposits.map((d) =>
      d.token.trim().toUpperCase(),
    );

    // Construct Payload conforming to Mongoose Schema
    const payload = {
      type: schemaType,
      category,
      name: finalName,
      network: finalNetwork,
      networkCode: finalCode,
      address: schemaType === "crypto" ? address : finalAddress,
      memo: finalMemo,
      minLimit: minDeposit,
      confirmationTime,
      instructions,
      qrCodeUrl,
      tokens: validTokens,
      minDeposits: validMinDeposits,
      provider: ewalletProvider,
      accountNumber:
        category === "Mobile E-Wallet"
          ? ewalletMobileNo
          : category === "Indian Bank Account"
            ? indianAccountNo
            : intlAccountNo,
      accountHolder:
        category === "Mobile E-Wallet"
          ? ewalletAccountTitle
          : category === "Indian Bank Account"
            ? indianHolder
            : intlHolder,
      cnic: ewalletCnic,
      tillId: ewalletTillId,
      bankName:
        category === "Indian Bank Account" ? indianBankName : intlBankName,
      ifsc: indianIfsc,
      swiftCode: intlSwift,
      accountType:
        category === "Indian Bank Account"
          ? indianAccountType
          : intlAccountType,
      branch: category === "Indian Bank Account" ? indianBranch : intlBranch,
      upiId: indianUpiId,
      status,
      isDefault,
    };

    try {
      if (editingWallet) {
        await updatePaymentMethod(editingWallet._id, payload);
      } else {
        await createPaymentMethod(payload);
      }

      // Refresh Data after save
      const res = await getPaymentMethods();
      const updatedList = Array.isArray(res)
        ? res
        : Array.isArray(res?.methods)
          ? res.methods
          : [];
      setMethods(updatedList);

      // Synchronize local storage for instant live preview in User Dashboard
      try {
        localStorage.setItem("horizon_payment_methods", JSON.stringify(updatedList));
        window.dispatchEvent(
          new CustomEvent("horizon-payment-methods-change", { detail: updatedList })
        );
      } catch (e) {
        /* ignore local storage error */
      }

      setDrawerOpen(false);
      toast.success(
        editingWallet
          ? `Payment gateway "${editingWallet.name}" updated successfully!`
          : "New payment gateway created and activated successfully!",
        "Gateway Saved"
      );
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error("Failed to save payment method. Please check all required fields.", "Save Failed");
    }
  };

  // ──────── SET DEFAULT GATEWAY ────────
  const handleSetDefault = async (id) => {
    try {
      await updatePaymentMethod(id, { isDefault: true });
      const res = await getPaymentMethods(); // Refresh to get all updated (backend should unset other defaults)
      const updatedList = Array.isArray(res)
        ? res
        : Array.isArray(res?.methods)
          ? res.methods
          : [];
      setMethods(updatedList);
      toast.success("Default payment gateway updated successfully.", "Default Set");
    } catch (error) {
      console.error("Error setting default method:", error);
      toast.error("Failed to set default payment gateway.", "Error");
    }
  };

  // ──────── DELETE GATEWAY ────────
  const handleDeleteWallet = async () => {
    if (!walletToDelete) return;
    try {
      await deletePaymentMethod(walletToDelete._id);
      setMethods((prev) =>
        Array.isArray(prev)
          ? prev.filter((m) => m._id !== walletToDelete._id)
          : []
      );
      toast.info(`Payment gateway "${walletToDelete.name}" deleted successfully.`, "Gateway Deleted");
      setWalletToDelete(null);
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error("Failed to delete payment method.", "Delete Failed");
    }
  };

  const safeMethods = Array.isArray(methods) ? methods : [];

  // Filter Logic
  const filtered = safeMethods.filter((method) => {
    const q = search.trim().toLowerCase();
    const matchCat =
      categoryFilter === "all" ||
      (categoryFilter === "E-Wallet" && method.category?.includes("Mobile")) ||
      (categoryFilter === "Crypto" && method.category?.includes("Crypto")) ||
      (categoryFilter === "Indian" && method.category?.includes("Indian")) ||
      (categoryFilter === "International" &&
        method.category?.includes("International"));

    const matchSearch =
      !q ||
      (method.name || "").toLowerCase().includes(q) ||
      (method.network || "").toLowerCase().includes(q) ||
      (method.address || "").toLowerCase().includes(q) ||
      (method.networkCode || "").toLowerCase().includes(q) ||
      (method.accountHolder || "").toLowerCase().includes(q);

    return matchCat && matchSearch;
  });

  const getChannelBadgeVisual = (wallet) => {
    const cat = wallet.category || "";
    if (cat.includes("Mobile")) {
      return {
        icon: <RiSmartphoneLine size={22} />,
        bgColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
        tagBg: "bg-emerald-100/80 text-emerald-800 border-emerald-300",
      };
    }
    if (cat.includes("Indian")) {
      return {
        icon: <RiBankLine size={22} />,
        bgColor: "bg-orange-50 text-orange-600 border-orange-200",
        tagBg: "bg-orange-100/80 text-orange-800 border-orange-300",
      };
    }
    if (cat.includes("International")) {
      return {
        icon: <RiGlobalLine size={22} />,
        bgColor: "bg-indigo-50 text-indigo-600 border-indigo-200",
        tagBg: "bg-indigo-100/80 text-indigo-800 border-indigo-300",
      };
    }
    return {
      icon: <RiCoinsLine size={22} />,
      bgColor: "bg-gold-50 text-gold-700 border-gold-300",
      tagBg: "bg-gold-100/80 text-gold-900 border-gold-300",
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton w-64 h-8 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonLoader type="card" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-poppins">
      <PageHeader
        title="Payment Gateways & Accounts"
        subtitle="Manage Mobile E-Wallets (EasyPaisa, JazzCash), Indian domestic banks, International wire & crypto addresses"
        badge="Gateway Engine"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              icon={<RiPercentLine className="text-emerald-600" />}
              onClick={() => {
                setWithdrawalForm(withdrawalSettings);
                setWithdrawalModalOpen(true);
              }}
            >
              Withdrawal Charges
            </Button>
            <Button
              variant="secondary"
              icon={<RiVideoLine className="text-gold-600" />}
              onClick={handleOpenVideoStudio}
            >
              Deposit Video Studio
            </Button>
            <Button
              variant="primary"
              icon={<RiAddLine />}
              onClick={() => openCreateDrawer("Mobile E-Wallet")}
            >
              Add Gateway / Account
            </Button>
          </div>
        }
      />

      {videoSavedNotification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <RiCheckLine size={18} className="text-emerald-600" />
          Deposit tutorial video guide updated and broadcasted to user
          dashboards successfully!
        </div>
      )}

      {withdrawalSavedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <RiCheckLine size={18} className="text-emerald-600" />
          Withdrawal charges & platform policy rules saved and updated live on user withdraw pages!
        </div>
      )}

      {/* ──────────────── TWO STUDIO CARDS: DEPOSIT VIDEO & WITHDRAWAL CHARGES ──────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Card 1: Deposit Tutorial Video */}
        <div className="card p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-gold-500/5 to-white border-2 border-gold-300 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-gold">
              <RiVideoLine size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                  Deposit Video Tutorial Studio
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-300">
                  ● Live on User App
                </span>
              </div>
              <p className="text-xs text-slate-600 font-poppins mt-1 line-clamp-1">
                <strong>Title:</strong> {tutorialVideo?.title}
              </p>
              <p className="text-[11px] text-slate-400 font-poppins mt-0.5">
                Users can watch step-by-step deposit guides before transferring funds.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 flex-shrink-0">
            <Button
              variant="secondary"
              icon={<RiPlayCircleLine className="text-gold-700" />}
              size="sm"
              onClick={() => setVideoPreviewOpen(true)}
            >
              Preview
            </Button>
            <Button
              variant="primary"
              icon={<RiUploadCloud2Line />}
              size="sm"
              onClick={handleOpenVideoStudio}
            >
              Edit Video
            </Button>
          </div>
        </div>

        {/* Card 2: Withdrawal Charges & Policy Studio */}
        <div className="card p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white border-2 border-emerald-300 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <RiPercentLine size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                  Withdrawal Charges & Policy Studio
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    withdrawalSettings.feeEnabled
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-slate-100 text-slate-600 border-slate-300"
                  }`}
                >
                  ● {withdrawalSettings.feeEnabled ? "Fee Active" : "Fee Waived (0%)"}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-poppins mt-1">
                <strong>Current Fee:</strong>{" "}
                <span className="text-emerald-700 font-bold">
                  {withdrawalSettings.feeEnabled
                    ? withdrawalSettings.feeType === "percentage"
                      ? `${withdrawalSettings.feePercentage}% Per Payout`
                      : `$${withdrawalSettings.fixedFee} USD Flat Fee`
                    : "0% (Free Payouts)"}
                </span>
                {" • "}
                <strong>Min/Max:</strong> ${withdrawalSettings.minWithdrawal} - ${Number(withdrawalSettings.maxWithdrawal || 50000).toLocaleString()} USD
              </p>
              <p className="text-[11px] text-slate-400 font-poppins mt-0.5 line-clamp-1">
                Turnaround: <span className="font-semibold text-slate-700">{withdrawalSettings.processingTime}</span>
                {" • "}Live on User /withdraw page with instant net calculation.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 flex-shrink-0">
            <Button
              variant="primary"
              icon={<RiPercentLine />}
              size="sm"
              onClick={() => {
                setWithdrawalForm(withdrawalSettings);
                setWithdrawalModalOpen(true);
              }}
            >
              Configure Charges
            </Button>
          </div>
        </div>
      </div>

      {/* ──────────────── TOP SUMMARY METRICS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 sm:gap-4 xl:gap-5">
        <div className="card p-4 flex items-center gap-3.5 border-l-4 border-l-emerald-500 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <RiSmartphoneLine size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Mobile E-Wallets
            </p>
            <p className="text-base font-bold text-slate-800 font-poppins mt-0.5">
              {safeMethods.filter((m) => m.category?.includes("Mobile")).length}{" "}
              Active Wallets
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5 border-l-4 border-l-gold-400 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-gold-50 text-gold-700 flex items-center justify-center flex-shrink-0">
            <RiCoinsLine size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Crypto Digital Treasury
            </p>
            <p className="text-base font-bold text-slate-800 font-poppins mt-0.5">
              {safeMethods.filter((m) => m.category?.includes("Crypto")).length}{" "}
              Active Vaults
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5 border-l-4 border-l-orange-500 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
            <RiBankLine size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Indian Banking & UPI
            </p>
            <p className="text-base font-bold text-slate-800 font-poppins mt-0.5">
              {safeMethods.filter((m) => m.category?.includes("Indian")).length}{" "}
              Bank Accounts
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5 border-l-4 border-l-indigo-500 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <RiGlobalLine size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Global Wire Depository
            </p>
            <p className="text-base font-bold text-slate-800 font-poppins mt-0.5">
              {
                safeMethods.filter((m) => m.category?.includes("International"))
                  .length
              }{" "}
              SWIFT Depository
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            placeholder="Search by wallet name, account/phone number, or network..."
            value={search}
            onChange={setSearch}
            className="flex-1"
          />
          <div className="flex gap-2 overflow-x-auto font-poppins">
            {[
              { id: "all", label: `All Channels (${safeMethods.length})` },
              { id: "E-Wallet", label: "Mobile E-Wallets" },
              { id: "Crypto", label: "Crypto Wallets" },
              { id: "Indian", label: "Indian Bank Accounts" },
              { id: "International", label: "International Banks" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? "bg-gold-400 text-slate-900 font-semibold shadow-gold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ──────────────── GATEWAY & WALLET CARDS GRID ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {filtered.map((wallet, i) => {
          const isMobile = wallet.category?.includes("Mobile");
          const isCrypto = wallet.category?.includes("Crypto");
          const isIndian = wallet.category?.includes("Indian");
          const isIntl = wallet.category?.includes("International");
          const visual = getChannelBadgeVisual(wallet);

          return (
            <div
              key={wallet._id || wallet.id}
              className={`card p-5 animate-slide-up hover:shadow-card-hover transition-all flex flex-col justify-between border ${
                wallet.isDefault
                  ? "border-gold-300 bg-gradient-to-br from-gold-50/40 via-white to-white"
                  : "border-slate-200"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xs flex-shrink-0 ${visual.bgColor}`}
                    >
                      {visual.icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-800 font-poppins leading-tight">
                          {wallet.name}
                        </h3>
                        {wallet.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-400 text-slate-900 text-[10px] font-bold shadow-2xs">
                            <RiStarLine size={11} /> Default
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border shadow-2xs ${visual.tagBg}`}
                        >
                          {wallet.networkCode || "CHANNEL"}
                        </span>
                        <span className="text-xs text-slate-400 font-normal">
                          {wallet.network}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={wallet.status === "Active" ? "success" : "danger"}
                    size="sm"
                  >
                    {wallet.status}
                  </Badge>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  {wallet.qrCodeUrl ? (
                    <div
                      onClick={() => setQrModalWallet(wallet)}
                      className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex-shrink-0 shadow-2xs cursor-pointer hover:border-gold-400 transition-colors group relative"
                      title="Click to view full QR code"
                    >
                      <img
                        src={wallet.qrCodeUrl}
                        alt="QR Code"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <RiQrCodeLine size={16} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 flex-shrink-0">
                      {isMobile ? (
                        <RiSmartphoneLine size={24} />
                      ) : isIndian || isIntl ? (
                        <RiBankLine size={24} />
                      ) : (
                        <RiWallet3Line size={24} />
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {isMobile
                        ? "Mobile Number & Account Title"
                        : isCrypto
                          ? "Receiving Wallet Address"
                          : isIndian
                            ? "Indian Account & IFSC"
                            : "Global IBAN / Wire Account"}
                    </p>
                    <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      <span className="text-xs font-mono font-bold text-slate-800 break-all leading-relaxed select-all">
                        {wallet.address || wallet.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(wallet.address || wallet.accountNumber);
                          setCopiedWalletId(wallet._id);
                          setTimeout(() => setCopiedWalletId(null), 2000);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer flex-shrink-0 transition-colors"
                        title="Copy Address"
                      >
                        {copiedWalletId === wallet._id ? (
                          <RiCheckLine size={15} className="text-emerald-600" />
                        ) : (
                          <RiFileCopyLine size={15} />
                        )}
                      </button>
                    </div>
                    {wallet.memo && (
                      <p className="text-[11px] font-mono text-gold-700 break-all">
                        {wallet.memo}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">
                      Min. Deposit
                    </span>
                    <span className="font-semibold text-slate-800">
                      {wallet.minLimit || wallet.minDeposit || "No Min."}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">
                      Settlement Speed
                    </span>
                    <span className="font-medium text-slate-700">
                      {wallet.confirmationTime || "Instant"}
                    </span>
                  </div>
                </div>

                {wallet.instructions && (
                  <p className="text-[11px] text-slate-500 leading-relaxed font-normal bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 flex items-start gap-1.5">
                    <RiInformationLine
                      size={14}
                      className="text-amber-600 flex-shrink-0 mt-0.5"
                    />
                    <span>{wallet.instructions}</span>
                  </p>
                )}
              </div>

              {/* ACTION CONTROLS FOOTER */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  {!wallet.isDefault && (
                    <button
                      onClick={() => handleSetDefault(wallet._id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-gold-50 text-slate-600 hover:text-gold-800 text-xs font-medium border border-slate-200 transition-colors shadow-2xs"
                    >
                      Set Default
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditDrawer(wallet)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-gold-50 text-slate-700 hover:text-gold-800 text-xs font-medium border border-slate-200 transition-colors shadow-2xs"
                  >
                    <RiEditLine size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setWalletToDelete(wallet)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-medium border border-red-200 transition-colors shadow-2xs"
                  >
                    <RiDeleteBinLine size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center font-poppins">
          <p className="text-slate-400 font-normal">
            No gateways or bank accounts found matching your search.
          </p>
        </div>
      )}

      {/* ──────────────── ADD / EDIT SLIDE-OVER DRAWER ──────────────── */}
      <Modal
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          editingWallet
            ? `Edit ${category === "Mobile E-Wallet" ? "Mobile E-Wallet" : category === "Indian Bank Account" ? "Indian Bank" : category === "International Bank Account" ? "International Bank" : "Digital Wallet"}`
            : `Add New ${category === "Mobile E-Wallet" ? "Mobile E-Wallet" : category === "Indian Bank Account" ? "Indian Bank Account" : category === "International Bank Account" ? "International Bank Account" : "Digital Wallet"}`
        }
        subtitle="Configure receiving credentials, custom QR codes, and investor deposit instructions"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<RiCheckLine />}
              onClick={handleSaveWallet}
            >
              {editingWallet ? "Save Changes" : "Activate Channel"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-poppins">
          {/* Gateway Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Gateway Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "Mobile E-Wallet", label: "Mobile E-Wallet" },
                { id: "Crypto Digital Wallet", label: "Crypto Wallet" },
                { id: "Indian Bank Account", label: "Indian Bank" },
                {
                  id: "International Bank Account",
                  label: "International Bank",
                },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl text-xs font-medium text-center border transition-all ${
                    category === cat.id
                      ? "bg-gold-50 border-gold-400 text-gold-900 font-semibold shadow-2xs ring-1 ring-gold-300"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ──────────────── 1. MOBILE E-WALLET ──────────────── */}
          {category === "Mobile E-Wallet" && (
            <div className="space-y-3.5 p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200/80">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <RiSmartphoneLine size={16} className="text-emerald-600" />
                Mobile E-Wallet Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-Wallet Provider *
                  </label>
                  <input
                    type="text"
                    value={ewalletProvider}
                    onChange={(e) => setEwalletProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Holder / Title *
                  </label>
                  <input
                    type="text"
                    value={ewalletAccountTitle}
                    onChange={(e) => setEwalletAccountTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    value={ewalletMobileNo}
                    onChange={(e) => setEwalletMobileNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CNIC (Optional)
                  </label>
                  <input
                    type="text"
                    value={ewalletCnic}
                    onChange={(e) => setEwalletCnic(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Till ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={ewalletTillId}
                    onChange={(e) => setEwalletTillId(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 2. INDIAN BANK ACCOUNT ──────────────── */}
          {category === "Indian Bank Account" && (
            <div className="space-y-3.5 p-4 bg-orange-50/40 rounded-2xl border border-orange-200/80">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <RiBuildingLine size={16} className="text-orange-600" />
                Indian Domestic Bank Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={indianBankName}
                    onChange={(e) => setIndianBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    value={indianHolder}
                    onChange={(e) => setIndianHolder(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={indianAccountNo}
                    onChange={(e) => setIndianAccountNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    value={indianIfsc}
                    onChange={(e) => setIndianIfsc(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UPI ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={indianUpiId}
                    onChange={(e) => setIndianUpiId(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={indianBranch}
                    onChange={(e) => setIndianBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 3. INTERNATIONAL BANK ACCOUNT ──────────────── */}
          {category === "International Bank Account" && (
            <div className="space-y-3.5 p-4 bg-indigo-50/40 rounded-2xl border border-indigo-200/80">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <RiGlobalLine size={16} className="text-indigo-600" />
                International Bank / SWIFT
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={intlBankName}
                    onChange={(e) => setIntlBankName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Account Holder *
                  </label>
                  <input
                    type="text"
                    value={intlHolder}
                    onChange={(e) => setIntlHolder(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Account Number / IBAN *
                  </label>
                  <input
                    type="text"
                    value={intlAccountNo}
                    onChange={(e) => setIntlAccountNo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    SWIFT / BIC Code *
                  </label>
                  <input
                    type="text"
                    value={intlSwift}
                    onChange={(e) => setIntlSwift(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Routing Code
                  </label>
                  <input
                    type="text"
                    value={intlRouting}
                    onChange={(e) => setIntlRouting(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Branch Location
                  </label>
                  <input
                    type="text"
                    value={intlBranch}
                    onChange={(e) => setIntlBranch(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 4. CRYPTO DIGITAL WALLET ──────────────── */}
          {category === "Crypto Digital Wallet" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Wallet Display Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-white rounded-xl border text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Blockchain / Network *
                  </label>
                  <input
                    type="text"
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Network Tag
                  </label>
                  <input
                    type="text"
                    value={networkCode}
                    onChange={(e) => setNetworkCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Public Receiving Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Deposit Memo (Optional)
                </label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>

              {/* Tokens */}
              <div className="p-4 bg-gold-50/50 rounded-2xl border border-gold-200/80">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-900">
                    Supported Tokens
                  </label>
                  <button
                    onClick={handleAddTokenRow}
                    type="button"
                    className="px-3 py-1 bg-gold-400 rounded-xl text-xs font-bold"
                  >
                    Add Token
                  </button>
                </div>
                {cryptoMinDeposits.map((row, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={row.token}
                      onChange={(e) =>
                        handleTokenRowChange(
                          idx,
                          "token",
                          e.target.value.toUpperCase(),
                        )
                      }
                      placeholder="Token"
                      className="w-1/2 px-2 py-1 border rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={row.min}
                      onChange={(e) =>
                        handleTokenRowChange(idx, "min", e.target.value)
                      }
                      placeholder="Min Limit"
                      className="w-1/2 px-2 py-1 border rounded-lg text-xs"
                    />
                    <button
                      onClick={() => handleRemoveTokenRow(idx)}
                      type="button"
                      className="text-red-500"
                    >
                      <RiDeleteBinLine size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ──────────────── UNIVERSAL & CRYPTO RECEIVING QR / SCAN IMAGE UPLOADER ──────────────── */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-poppins">
                    <RiQrCodeLine size={16} className="text-gold-600" />
                    {category === "Crypto Digital Wallet"
                      ? "Receiving Wallet QR / Scan Image"
                      : "Official Deposit QR / Scan Image"}
                  </label>
                  {qrCodeUrl ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                      ● Active Scan Attached
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                      Optional Scan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 font-poppins">
                  {category === "Crypto Digital Wallet"
                    ? "Upload official receiving address QR code or deposit scan image. Investors will scan this directly from their crypto app (Binance, TrustWallet, OKX, MetaMask, Phantom)."
                    : "Upload official account deposit QR code or merchant scan code."}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
                {(address || ewalletMobileNo || indianAccountNo || indianUpiId) && (
                  <button
                    type="button"
                    onClick={handleAutoGenerateQr}
                    className="px-2.5 py-1 rounded-xl bg-gold-100 hover:bg-gold-200 text-gold-900 text-[11px] font-semibold border border-gold-300 transition-colors flex items-center gap-1 shadow-2xs font-poppins cursor-pointer"
                    title="Auto-generate QR code from current receiving address"
                  >
                    <RiFlashlightLine size={13} className="text-gold-700" />
                    <span>Auto Generate QR</span>
                  </button>
                )}

                {qrCodeUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveQrCode}
                    className="px-2.5 py-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold border border-red-200 transition-colors flex items-center gap-1 shadow-2xs font-poppins cursor-pointer"
                  >
                    <RiCloseLine size={13} />
                    <span>Remove Scan</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hidden File Input for QR Code */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload Area / Image Preview */}
            {qrCodeUrl ? (
              <div className="p-3.5 bg-white rounded-xl border border-gold-300/80 shadow-2xs flex flex-col sm:flex-row items-center gap-4">
                {/* QR Image Thumbnail */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white border-2 border-gold-400 p-1 flex-shrink-0 shadow-2xs cursor-pointer hover:border-gold-600 transition-all group relative overflow-hidden flex items-center justify-center"
                  title="Click to replace scan image"
                >
                  <img
                    src={qrCodeUrl}
                    alt="Wallet QR Code"
                    className="w-full h-full object-contain rounded-xl"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold gap-1 p-2 text-center">
                    <RiImageAddLine size={20} className="text-gold-400" />
                    <span>Click to Replace</span>
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="min-w-0 flex-1 space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 font-poppins">
                      Verified Scan Code Attached
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Live on User App
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded-xl border border-slate-200 break-all line-clamp-1 select-all">
                    {qrCodeUrl}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<RiImageAddLine />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingQr ? "Uploading..." : "Replace Scan"}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<RiEyeLine />}
                      onClick={() =>
                        setQrModalWallet({
                          name: name || `${category} Scan`,
                          qrCodeUrl,
                        })
                      }
                    >
                      Preview Zoom
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-gold-400 bg-white rounded-2xl p-5 text-center cursor-pointer transition-all group shadow-2xs"
              >
                {uploadingQr ? (
                  <div className="py-4 space-y-2">
                    <RiLoader4Line
                      size={28}
                      className="animate-spin text-gold-500 mx-auto"
                    />
                    <p className="text-xs font-semibold text-slate-700 font-poppins">
                      Uploading wallet scan image to cloud storage...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    <div className="w-12 h-12 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-2xs border border-gold-200">
                      <RiUploadCloud2Line size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 font-poppins">
                        Click to Upload Wallet QR / Scan Image
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-poppins">
                        Supports PNG, JPG, JPEG, WEBP, SVG • Fast Cloudinary Upload
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Optional Direct URL Input */}
            <div className="flex gap-2 items-center pt-0.5">
              <input
                type="url"
                placeholder="Or paste direct scan image / QR URL (https://...)"
                value={qrCodeUrl}
                onChange={(e) => setQrCodeUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 focus:border-gold-400 outline-none font-mono"
              />
              {address && !qrCodeUrl && (
                <button
                  type="button"
                  onClick={handleAutoGenerateQr}
                  className="px-3 py-1.5 bg-gold-400 hover:bg-gold-500 text-slate-900 text-xs font-bold rounded-xl whitespace-nowrap shadow-gold transition-all cursor-pointer font-poppins"
                >
                  Generate QR
                </button>
              )}
            </div>

            {qrUploadError && (
              <p className="text-xs text-red-600 font-medium font-poppins">{qrUploadError}</p>
            )}
          </div>

          {/* COMMON LIMITS & SPEED */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Minimum Deposit
              </label>
              <input
                type="text"
                value={minDeposit}
                onChange={(e) => setMinDeposit(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Confirmation Speed
              </label>
              <input
                type="text"
                value={confirmationTime}
                onChange={(e) => setConfirmationTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Investor Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full p-2 border rounded-xl text-xs"
              rows="2"
            ></textarea>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-gold-50/60 rounded-xl border border-gold-200/80">
            <div>
              <p className="text-xs font-semibold">Set as Default Channel</p>
            </div>
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-gold-500 rounded"
            />
          </div>
        </div>
      </Modal>

      {/* ──────────────── DELETE CONFIRMATION ──────────────── */}
      <Modal
        isOpen={!!walletToDelete}
        onClose={() => setWalletToDelete(null)}
        title="Confirm Gateway Deletion"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setWalletToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={<RiDeleteBinLine />}
              onClick={handleDeleteWallet}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        {walletToDelete && (
          <div className="text-center py-2 space-y-3">
            <RiAlertLine size={32} className="text-red-500 mx-auto" />
            <p className="text-sm">
              Delete{" "}
              <strong className="text-slate-800">{walletToDelete.name}</strong>{" "}
              permanently?
            </p>
          </div>
        )}
      </Modal>

      {/* ──────────────── VIDEO STUDIO MODAL ──────────────── */}
      <Modal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        title="Deposit Video Tutorial Studio"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setVideoModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<RiCheckLine />}
              onClick={handleSaveVideoTutorial}
            >
              Save & Broadcast
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Title *</label>
            <input
              type="text"
              value={videoForm.title || ""}
              onChange={(e) =>
                setVideoForm({ ...videoForm, title: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Subtitle</label>
            <textarea
              value={videoForm.subtitle || ""}
              onChange={(e) =>
                setVideoForm({ ...videoForm, subtitle: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-xl text-xs"
              rows="2"
            ></textarea>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Video URL (MP4 / YouTube)
            </label>
            <input
              type="url"
              value={videoForm.videoUrl || ""}
              onChange={(e) =>
                setVideoForm({ ...videoForm, videoUrl: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Step-by-Step Instructions (1 per line)
            </label>
            <textarea
              value={
                Array.isArray(videoForm.instructions)
                  ? videoForm.instructions.join("\n")
                  : videoForm.instructions || ""
              }
              onChange={(e) =>
                setVideoForm({
                  ...videoForm,
                  instructions: e.target.value.split("\n"),
                })
              }
              className="w-full px-3 py-2 border rounded-xl text-xs"
              rows="4"
            ></textarea>
          </div>
        </div>
      </Modal>

      {/* ──────────────── VIDEO PREVIEW MODAL ──────────────── */}
      <Modal
        isOpen={videoPreviewOpen}
        onClose={() => setVideoPreviewOpen(false)}
        title={tutorialVideo?.title || "Video Preview"}
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setVideoPreviewOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-5">
          <video
            src={tutorialVideo?.videoUrl}
            controls
            autoPlay
            className="w-full rounded-xl aspect-video bg-black"
          />
          <div className="p-4 bg-gold-50/70 border border-gold-200 rounded-xl space-y-2">
            <h4 className="text-xs font-bold">Instructions:</h4>
            <ul className="text-xs space-y-1">
              {(tutorialVideo?.instructions || []).map((step, i) => (
                <li key={i}>
                  {" "}
                  {i + 1}. {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>

      {/* ──────────────── QR PREVIEW MODAL ──────────────── */}
      <Modal
        isOpen={!!qrModalWallet}
        onClose={() => setQrModalWallet(null)}
        title={qrModalWallet ? `${qrModalWallet.name || "Payment"} QR Code` : "Deposit QR Code"}
        subtitle="Official receiving address scan image verified for platform deposits"
        size="sm"
        footer={
          <div className="flex items-center justify-between w-full">
            {qrModalWallet?.qrCodeUrl && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(qrModalWallet.qrCodeUrl);
                  alert("Scan image URL copied to clipboard!");
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors font-poppins"
              >
                <RiFileCopyLine size={14} />
                <span>Copy URL</span>
              </button>
            )}
            <Button variant="primary" onClick={() => setQrModalWallet(null)}>
              Done
            </Button>
          </div>
        }
      >
        {qrModalWallet && (
          <div className="text-center py-3 space-y-3 font-poppins">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-2xs">
              <img
                src={qrModalWallet.qrCodeUrl}
                alt="QR"
                className="w-56 h-56 mx-auto object-contain rounded-xl bg-white border border-slate-200 p-2 shadow-2xs"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{qrModalWallet.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scan using any supported banking or cryptocurrency mobile wallet
              </p>
            </div>
            {(qrModalWallet.address || qrModalWallet.accountNumber) && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Address / Account
                </span>
                <p className="font-mono text-xs font-bold text-slate-800 break-all select-all">
                  {qrModalWallet.address || qrModalWallet.accountNumber}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ──────────────── MODAL: WITHDRAWAL CHARGES & POLICY STUDIO ──────────────── */}
      <Modal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        title="Withdrawal Charges & Policy Studio"
        subtitle="Set standard platform withdrawal fees, turnaround time, minimum/maximum payout limits and investor policy"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full font-poppins">
            <Button
              variant="secondary"
              onClick={() => setWithdrawalModalOpen(false)}
              disabled={savingWithdrawal}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveWithdrawalSettings}
              disabled={savingWithdrawal}
              icon={savingWithdrawal ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
            >
              {savingWithdrawal ? "Saving Changes..." : "Save Withdrawal Settings"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 font-poppins text-xs text-slate-700">
          {/* Fee Active Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900 font-display">
                Enable Withdrawal Platform Fee
              </p>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                When enabled, the configured fee will be automatically deducted from user withdrawal requests. When disabled, withdrawals are 100% free (0% fee).
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={withdrawalForm.feeEnabled}
                onChange={(e) =>
                  setWithdrawalForm((prev) => ({
                    ...prev,
                    feeEnabled: e.target.checked,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Fee Model Selector (Percentage vs Fixed) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Fee Structure Model
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setWithdrawalForm((prev) => ({
                    ...prev,
                    feeType: "percentage",
                  }))
                }
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  withdrawalForm.feeType === "percentage"
                    ? "card-gold border-gold-400 ring-2 ring-gold-200/80 shadow-gold"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-extrabold text-sm">
                  %
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Percentage (%) Based
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Deduct a proportional percent of requested amount (e.g. 5%)
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setWithdrawalForm((prev) => ({
                    ...prev,
                    feeType: "fixed",
                  }))
                }
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  withdrawalForm.feeType === "fixed"
                    ? "card-gold border-gold-400 ring-2 ring-gold-200/80 shadow-gold"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-extrabold text-sm">
                  $
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Fixed ($ USD) Flat Fee
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Deduct a flat dollar amount per request (e.g. $2.00)
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Fee Value & Processing Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {withdrawalForm.feeType === "percentage" ? (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Fee Percentage Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={withdrawalForm.feePercentage}
                    onChange={(e) =>
                      setWithdrawalForm((prev) => ({
                        ...prev,
                        feePercentage: e.target.value,
                      }))
                    }
                    className="input pr-8"
                    placeholder="e.g. 5"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Standard protocol fee is usually 3% - 7%.
                </p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Fixed Fee Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={withdrawalForm.fixedFee}
                    onChange={(e) =>
                      setWithdrawalForm((prev) => ({
                        ...prev,
                        fixedFee: e.target.value,
                      }))
                    }
                    className="input pl-8"
                    placeholder="e.g. 2.00"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Fixed flat dollar amount deducted from each request.
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Clearance Turnaround Time
              </label>
              <input
                type="text"
                value={withdrawalForm.processingTime}
                onChange={(e) =>
                  setWithdrawalForm((prev) => ({
                    ...prev,
                    processingTime: e.target.value,
                  }))
                }
                className="input"
                placeholder="e.g. 12 - 24 Hours or Instant"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Shown to investors on the withdrawal page policy card.
              </p>
            </div>
          </div>

          {/* Min and Max Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Minimum Withdrawal ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  value={withdrawalForm.minWithdrawal}
                  onChange={(e) =>
                    setWithdrawalForm((prev) => ({
                      ...prev,
                      minWithdrawal: e.target.value,
                    }))
                  }
                  className="input pl-8"
                  placeholder="e.g. 5"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Requests below this amount will be rejected automatically.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Maximum Withdrawal Limit ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  value={withdrawalForm.maxWithdrawal}
                  onChange={(e) =>
                    setWithdrawalForm((prev) => ({
                      ...prev,
                      maxWithdrawal: e.target.value,
                    }))
                  }
                  className="input pl-8"
                  placeholder="e.g. 50000"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Upper threshold per transaction (e.g. $50,000 USD).
              </p>
            </div>
          </div>

          {/* Single ID Maximum Withdrawal Allowed Rule */}
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-300">
            <label className="text-xs font-bold text-amber-950 block mb-1">
              Single ID Maximum Withdrawal Allowed Rule
            </label>
            <input
              type="text"
              value={withdrawalForm.singleIdMaxWithdrawal || "3X + Capital Maximum Withdrawal Allowed"}
              onChange={(e) =>
                setWithdrawalForm((prev) => ({
                  ...prev,
                  singleIdMaxWithdrawal: e.target.value,
                }))
              }
              className="input text-xs font-bold text-amber-950 bg-white"
              placeholder="3X + Capital Maximum Withdrawal Allowed"
            />
            <p className="text-[10px] text-amber-800 mt-1">
              Limits the maximum lifetime withdrawal on a single account ID to 3X returns + principal capital.
            </p>
          </div>

          {/* Custom User Policy Notice */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Investor Withdrawal Policy Notice
            </label>
            <textarea
              rows={3}
              value={withdrawalForm.termsNotice}
              onChange={(e) =>
                setWithdrawalForm((prev) => ({
                  ...prev,
                  termsNotice: e.target.value,
                }))
              }
              className="input text-xs leading-relaxed"
              placeholder="Custom notice shown to users before confirming payout request..."
            />
          </div>

          {/* Live Simulator Calculation Box */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 font-poppins">
                Live Simulation on $100.00 Withdrawal Request
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Preview
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-amber-200/60 text-center font-poppins">
              <div>
                <p className="text-[10px] text-slate-500">Gross Request</p>
                <p className="text-xs font-bold text-slate-900 font-display">$100.00</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">
                  Fee (
                  {!withdrawalForm.feeEnabled
                    ? "Waived"
                    : withdrawalForm.feeType === "percentage"
                      ? `${withdrawalForm.feePercentage}%`
                      : "Fixed"}
                  )
                </p>
                <p className="text-xs font-bold text-red-600 font-display">
                  -
                  $
                  {!withdrawalForm.feeEnabled
                    ? "0.00"
                    : withdrawalForm.feeType === "percentage"
                      ? ((100 * Number(withdrawalForm.feePercentage || 0)) / 100).toFixed(2)
                      : Number(withdrawalForm.fixedFee || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Net Received</p>
                <p className="text-xs font-bold text-emerald-700 font-display">
                  $
                  {!withdrawalForm.feeEnabled
                    ? "100.00"
                    : withdrawalForm.feeType === "percentage"
                      ? Math.max(0, 100 - (100 * Number(withdrawalForm.feePercentage || 0)) / 100).toFixed(2)
                      : Math.max(0, 100 - Number(withdrawalForm.fixedFee || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
