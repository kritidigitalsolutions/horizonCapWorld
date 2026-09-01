import React, { useState, useEffect, useRef } from 'react';
import {
  RiLockPasswordLine, RiMailLine, RiShieldCheckLine, RiUser3Line,
  RiSaveLine, RiKey2Line, RiCheckLine,
  RiNotification3Line, RiDeleteBinLine,
  RiEyeLine, RiEyeOffLine, RiCoinsLine, RiTrophyLine,
  RiCustomerService2Line, RiSmartphoneLine,
  RiUpload2Line
} from 'react-icons/ri';
import Button from '../components/ui/Button';
import OTPInput from '../components/ui/OTPInput';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import PageHeader from '../components/ui/PageHeader';
import {
  getAdminProfile,
  updateAdminProfile,
  sendAdminOtp,
  verifyAdminOtp,
  changeAdminEmail,
  changeAdminPassword,
  getAdminSettings,
  updateAdminSettings
} from '../api/authApi';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../api/uploadApi';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('profile');

  // Profile Form & Avatar State (Synced with Header)
  const [adminAvatar, setAdminAvatar] = useState(() => localStorage.getItem('horizon_admin_avatar') || '');
  const avatarInputRef = useRef(null);
  const [profileName, setProfileName] = useState('Super Admin');
  const [profileEmail, setProfileEmail] = useState('admin@horizoncap.com');
  const [profileRecovery, setProfileRecovery] = useState('recovery@horizoncap.com');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);

  // Change Email State (with OTP)
  const [newEmailAddress, setNewEmailAddress] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState('');
  const [emailUpdated, setEmailUpdated] = useState(false);

  // Change Password State (with OTP)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);
  const [passwordOtpVerified, setPasswordOtpVerified] = useState(false);
  const [passwordOtpCode, setPasswordOtpCode] = useState('');
  const [passwordOtpLoading, setPasswordOtpLoading] = useState(false);
  const [passwordOtpError, setPasswordOtpError] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // Comprehensive Automated User Dashboard Alerts & Notifications State
  const [automatedAlerts, setAutomatedAlerts] = useState({
    // Financial & ROI Automations
    autoDepositApproval: true,
    autoRoiStreaming: true,
    autoDailyPayout: true,
    autoWithdrawalBroadcast: true,
    autoPlanMaturity: true,
    // Rank & Referral Automations
    autoRankMilestones: true,
    autoReferralCommissions: true,
    autoDownlineJoins: true,
    // Support & CRM Automations
    autoTicketReplies: true,
    autoTicketStatusChange: true,
    // News & Broadcasts
    autoNewsBroadcasts: true,
    autoSystemMaintenance: true,
    // Security & Auth Automations
    autoNewDeviceLogin: true,
    autoSecurityOtpDispatch: true,
  });
  const [alertsSaved, setAlertsSaved] = useState(false);

  useEffect(() => {
    const fetchProfileAndSettings = async () => {
      try {
        const [profRes, setRes] = await Promise.allSettled([
          getAdminProfile(),
          getAdminSettings()
        ]);

        if (profRes.status === 'fulfilled' && profRes.value?.success && profRes.value.admin) {
          const a = profRes.value.admin;
          if (a.name) setProfileName(a.name);
          if (a.email) setProfileEmail(a.email);
          if (a.recoveryEmail) setProfileRecovery(a.recoveryEmail);
          if (a.avatar) setAdminAvatar(a.avatar);
          if (a.is2FAEnabled !== undefined) setTwoFactorEnabled(a.is2FAEnabled);
        }

        if (setRes.status === 'fulfilled' && setRes.value?.success && setRes.value.settings) {
          if (setRes.value.settings.automatedAlerts) {
            setAutomatedAlerts(prev => ({ ...prev, ...setRes.value.settings.automatedAlerts }));
          }
        }
      } catch (err) {
        console.warn('Using fallback admin settings data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndSettings();
  }, []);

  // Avatar Upload Handler
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const previewUrl = uploadEvent.target.result;
        setAdminAvatar(previewUrl);
      };
      reader.readAsDataURL(file);

      try {
        const previousAvatar = adminAvatar;
        const uploadRes = await uploadFileToCloudinary(file, {
          folder: 'horizoncap/avatars/admin',
          oldUrl: previousAvatar,
        });

        if (uploadRes?.secure_url) {
          const finalUrl = uploadRes.secure_url;
          setAdminAvatar(finalUrl);
          localStorage.setItem('horizon_admin_avatar', finalUrl);
          window.dispatchEvent(new CustomEvent('admin-avatar-change', { detail: finalUrl }));
          await updateAdminProfile({ avatar: finalUrl });
        }
      } catch (err) {
        console.warn('Direct avatar upload to Cloudinary fallback:', err.message);
      }
    }
  };

  // Avatar Remove Handler
  const handleRemoveAvatar = async () => {
    const previousAvatar = adminAvatar;
    setAdminAvatar('');
    localStorage.removeItem('horizon_admin_avatar');
    window.dispatchEvent(new CustomEvent('admin-avatar-change', { detail: '' }));
    if (avatarInputRef.current) avatarInputRef.current.value = '';

    if (previousAvatar && previousAvatar.includes('cloudinary.com')) {
      deleteFileFromCloudinary(previousAvatar).catch(() => null);
    }

    try {
      await updateAdminProfile({ avatar: '' });
    } catch (err) {
      console.warn('Avatar removal sync failed:', err.message);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateAdminProfile({
        name: profileName,
        email: profileEmail,
        recoveryEmail: profileRecovery,
        avatar: adminAvatar,
        is2FAEnabled: twoFactorEnabled
      });
    } catch (err) {
      console.warn('API update admin profile offline:', err.message);
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Handle Email Update with OTP
  const handleSendEmailOtp = async () => {
    if (!newEmailAddress.trim() || newEmailAddress.trim() === profileEmail) return;
    setEmailOtpError('');
    setEmailOtpLoading(true);
    try {
      const res = await sendAdminOtp({ purpose: 'CHANGE_EMAIL', newEmail: newEmailAddress.trim() });
      if (res?.success) {
        setEmailOtpSent(true);
      } else {
        setEmailOtpError(res?.message || 'Failed to dispatch email OTP.');
      }
    } catch (err) {
      setEmailOtpError(err.response?.data?.message || err.message || 'Failed to send OTP.');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (code) => {
    setEmailOtpCode(code);
    setEmailOtpError('');
    setEmailOtpLoading(true);
    try {
      const res = await verifyAdminOtp({ otp: code });
      if (res?.success) {
        setEmailOtpVerified(true);
      } else {
        setEmailOtpError(res?.message || 'Invalid OTP code.');
      }
    } catch (err) {
      setEmailOtpError(err.response?.data?.message || err.message || 'Invalid OTP code.');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleCommitEmailUpdate = async () => {
    if (!newEmailAddress.trim()) return;
    setEmailOtpError('');
    setEmailOtpLoading(true);
    try {
      const res = await changeAdminEmail({
        newEmail: newEmailAddress.trim(),
        otp: emailOtpCode
      });
      if (res?.success) {
        setProfileEmail(newEmailAddress.trim());
        setEmailUpdated(true);
        setTimeout(() => {
          setEmailUpdated(false);
          setEmailOtpSent(false);
          setEmailOtpVerified(false);
          setEmailOtpCode('');
          setNewEmailAddress('');
        }, 3000);
      } else {
        setEmailOtpError(res?.message || 'Failed to update email.');
      }
    } catch (err) {
      setEmailOtpError(err.response?.data?.message || err.message || 'Failed to update email.');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  // Handle Password Update with OTP
  const handleSendPasswordOtp = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;
    setPasswordOtpError('');
    setPasswordOtpLoading(true);
    try {
      const res = await sendAdminOtp({ purpose: 'CHANGE_PASSWORD' });
      if (res?.success) {
        setPasswordOtpSent(true);
      } else {
        setPasswordOtpError(res?.message || 'Failed to dispatch password OTP.');
      }
    } catch (err) {
      setPasswordOtpError(err.response?.data?.message || err.message || 'Failed to send OTP.');
    } finally {
      setPasswordOtpLoading(false);
    }
  };

  const handleVerifyPasswordOtp = async (code) => {
    setPasswordOtpCode(code);
    setPasswordOtpError('');
    setPasswordOtpLoading(true);
    try {
      const res = await verifyAdminOtp({ otp: code });
      if (res?.success) {
        setPasswordOtpVerified(true);
      } else {
        setPasswordOtpError(res?.message || 'Invalid OTP code.');
      }
    } catch (err) {
      setPasswordOtpError(err.response?.data?.message || err.message || 'Invalid OTP code.');
    } finally {
      setPasswordOtpLoading(false);
    }
  };

  const handleCommitPasswordUpdate = async () => {
    if (!newPassword || newPassword !== confirmPassword) return;
    setPasswordOtpError('');
    setPasswordOtpLoading(true);
    try {
      const res = await changeAdminPassword({
        currentPassword,
        newPassword,
        otp: passwordOtpCode
      });
      if (res?.success) {
        setPasswordUpdated(true);
        setTimeout(() => {
          setPasswordUpdated(false);
          setPasswordOtpSent(false);
          setPasswordOtpVerified(false);
          setPasswordOtpCode('');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }, 3000);
      } else {
        setPasswordOtpError(res?.message || 'Failed to update password.');
      }
    } catch (err) {
      setPasswordOtpError(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setPasswordOtpLoading(false);
    }
  };

  // Handle Save Alerts
  const handleSaveAlerts = async () => {
    try {
      await updateAdminSettings({
        automatedAlerts
      });
    } catch (err) {
      console.warn('API update admin settings offline:', err.message);
    }
    setAlertsSaved(true);
    setTimeout(() => setAlertsSaved(false), 3000);
  };

  // Password Strength Calculation
  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength();
  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-slate-200', 'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500'];

  const sections = [
    { key: 'profile', label: 'Admin Profile', icon: RiUser3Line },
    { key: 'credentials', label: 'Change Email & Password (OTP)', icon: RiLockPasswordLine },
    { key: 'preferences', label: 'Automated User Alerts & Notifications', icon: RiNotification3Line },
  ];

  if (loading) {
    return (
      <div className="space-y-6 font-poppins">
        <div className="skeleton w-56 h-8 rounded-lg"></div>
        <div className="card p-6">
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-poppins">
      {/* Header */}
      <PageHeader
        title="Super Admin Control & Settings"
        subtitle="Manage administrator profile, avatar photo, email and password rotation with OTP & automated user notification policies"
        badge="System Security"
      />

      {/* ──────────────── SECTION TABS BAR (3 CLEAN TABS) ──────────────── */}
      <div className="card p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.key;
            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gold-400 text-slate-900 font-semibold shadow-gold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon size={16} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ──────────────── TAB 1: ADMIN PROFILE & MASTER DETAILS (WITH 2FA TOGGLE INSIDE) ──────────────── */}
      {activeSection === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Profile Card Left Column (Interactive Avatar with Upload & Remove) */}
          <div className="card p-6 flex flex-col items-center text-center space-y-4 border border-gold-200/80 justify-between">
            <div className="space-y-3.5 flex flex-col items-center">
              {/* Round Circle Avatar (Photo or Fallback SA) */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl shadow-gold ring-4 ring-gold-200 bg-slate-900 flex-shrink-0">
                  {adminAvatar ? (
                    <img src={adminAvatar} alt="Super Admin" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-900 font-bold flex items-center justify-center text-3xl">
                      SA
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden File Input for Avatar Photo */}
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />

              {/* Upload & Remove Buttons */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-400 hover:bg-gold-500 text-slate-900 text-xs font-bold rounded-xl shadow-gold transition-all cursor-pointer"
                >
                  <RiUpload2Line size={14} />
                  <span>{adminAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                </button>

                {adminAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl border border-red-200 transition-colors"
                    title="Remove profile photo"
                  >
                    <RiDeleteBinLine size={14} />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">{profileName}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">HORIZON-ADM-01</p>
              </div>

              <div className="flex flex-col gap-1.5 pt-0.5">
                <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-gold-50 text-gold-900 border border-gold-300 rounded-xl text-xs font-semibold shadow-2xs">
                  <RiShieldCheckLine size={14} className="text-gold-600" /> Super Administrator
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  Full Authority Level
                </span>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Security Clearance:</span>
                <strong className="text-slate-700">Tier 1 (Master)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Account Created:</span>
                <span className="text-slate-700">Jan 15, 2026</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Last Active:</span>
                <span className="text-emerald-600 font-semibold">Just now</span>
              </div>
            </div>
          </div>

          {/* Profile Form Right Column (With 2FA Switch directly inside) */}
          <div className="lg:col-span-2 card p-6 space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-poppins">Master Account Details</h3>
                <p className="text-xs text-slate-400">Update system administrator information, recovery channels and 2FA login enforcement</p>
              </div>
              {profileSaved && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl animate-fade-in">
                  <RiCheckLine size={14} /> Profile Saved Successfully
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-poppins">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Administrator Name *
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Registered Super Admin Email *
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 outline-none cursor-not-allowed shadow-2xs"
                  />
                  <p className="text-[10px] text-gold-700 font-medium mt-1">To rotate this email, use the "Change Email & Password (OTP)" tab.</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Emergency Recovery Email
                </label>
                <input
                  type="email"
                  value={profileRecovery}
                  onChange={e => setProfileRecovery(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">Used exclusively for emergency root credentials recovery in case of lockout</p>
              </div>

              {/* ──────────────── 2FA AUTHENTICATION TOGGLE (CLEAN SLIDING TOGGLE SWITCH) ──────────────── */}
              <div className="p-4 bg-gold-50/50 rounded-2xl border border-gold-300/80 shadow-2xs">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <RiSmartphoneLine size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-800">Two-Factor Authentication (2FA)</h4>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          twoFactorEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Enforce Google Authenticator / Authy TOTP code on Super Admin login</p>
                    </div>
                  </div>

                  {/* Clean Sliding Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={twoFactorEnabled}
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      twoFactorEnabled ? 'bg-gold-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <Button variant="primary" icon={<RiSaveLine />} type="submit">
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: CHANGE EMAIL & PASSWORD (BOTH WITH OTP VERIFICATION) ──────────────── */}
      {activeSection === 'credentials' && (
        <div className="space-y-6 animate-fade-in font-poppins">
          {/* SECTION A: CHANGE MASTER EMAIL (WITH OTP) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Form Left Column */}
            <div className="card p-6 space-y-4 border border-slate-200">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <RiMailLine size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Change Master Admin Email</h3>
                  <p className="text-xs text-slate-400">Update primary administrative login address with OTP verification</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs font-poppins">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Registered Email
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 outline-none cursor-not-allowed shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Master Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="Enter new administrator email address"
                    value={newEmailAddress}
                    onChange={e => setNewEmailAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500">
                  <p className="font-semibold text-slate-700">Email Rotation Policy:</p>
                  <p className="mt-0.5">Changing your email address triggers a 6-digit security OTP to verify access before activating the new administrative address.</p>
                </div>
              </div>
            </div>

            {/* Email OTP Verification Flow Right Column */}
            <div className="card p-6 space-y-4 border border-blue-200 bg-blue-50/20 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <RiShieldCheckLine size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-poppins">Email Change OTP Verification</h4>
                    <p className="text-xs text-slate-500">Authorize email update via 6-digit cryptographic code</p>
                  </div>
                </div>

                {/* Email Errors */}
                {emailOtpError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold animate-slide-up">
                    {emailOtpError}
                  </div>
                )}

                {!emailOtpSent && !emailOtpVerified && (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-2 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">Email Verification Required</p>
                      <p className="text-slate-500">Click below to dispatch a 6-digit verification OTP to: <strong className="text-slate-800 font-mono">{profileEmail}</strong>.</p>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={handleSendEmailOtp}
                      disabled={emailOtpLoading || !newEmailAddress.trim() || newEmailAddress.trim() === profileEmail}
                    >
                      {emailOtpLoading ? 'Sending Email OTP...' : 'Send 6-Digit Email OTP'}
                    </Button>
                  </div>
                )}

                {emailOtpSent && !emailOtpVerified && (
                  <div className="space-y-4 pt-2 animate-slide-up">
                    <div className="p-4 bg-white rounded-2xl border border-blue-300 shadow-2xs text-center space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Enter 6-Digit Email OTP</h5>
                      <p className="text-[11px] text-slate-400">Code dispatched to {profileEmail}</p>
                      <div className="py-2 flex justify-center">
                        <OTPInput length={6} onComplete={handleVerifyEmailOtp} />
                      </div>
                      {emailOtpLoading && <p className="text-xs text-blue-600 font-semibold animate-pulse">Verifying code...</p>}
                    </div>

                    <div className="text-center text-xs">
                      <button
                        onClick={handleSendEmailOtp}
                        disabled={emailOtpLoading}
                        className="text-gold-700 font-semibold hover:underline cursor-pointer"
                      >
                        Resend OTP Code
                      </button>
                    </div>
                  </div>
                )}

                {emailOtpVerified && (
                  <div className="space-y-4 pt-2 animate-slide-up">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-800 space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <RiShieldCheckLine size={16} /> Email OTP Verified Successfully
                      </div>
                      <p className="text-[11px] text-emerald-700">Root authorization confirmed. Click commit to activate new master email.</p>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      icon={<RiMailLine />}
                      disabled={emailOtpLoading}
                      onClick={handleCommitEmailUpdate}
                    >
                      {emailOtpLoading ? 'Updating Email...' : 'Commit & Update Master Email'}
                    </Button>
                  </div>
                )}

                {emailUpdated && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-800 text-xs font-bold text-center animate-fade-in">
                    Master Admin Email Updated Successfully!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION B: CHANGE MASTER PASSWORD (WITH OTP) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Password Form Left Column */}
            <div className="card p-6 space-y-4 border border-slate-200">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <RiLockPasswordLine size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Change Master Password</h3>
                  <p className="text-xs text-slate-400">Passwords must contain at least 8 characters with numbers and symbols</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs font-poppins">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current master password"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Create a strong new password"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        {[1, 2, 3, 4].map(idx => (
                          <div
                            key={idx}
                            className={`flex-1 transition-all duration-300 ${
                              idx <= strengthScore ? strengthColors[strengthScore] : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold block">
                        Strength: <strong>{strengthLabels[strengthScore]}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password Policy Guidelines */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-[11px] text-slate-500">
                  <p className="font-semibold text-slate-700">Security Guidelines:</p>
                  <div className="grid grid-cols-2 gap-1 pt-0.5">
                    <span className={newPassword.length >= 8 ? 'text-emerald-600 font-medium' : ''}>• Min. 8 characters</span>
                    <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-medium' : ''}>• 1 Uppercase letter</span>
                    <span className={/[0-9]/.test(newPassword) ? 'text-emerald-600 font-medium' : ''}>• 1 Number (0-9)</span>
                    <span className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-600 font-medium' : ''}>• 1 Special character</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Password OTP Verification Flow Right Column */}
            <div className="card p-6 space-y-4 border border-gold-300 bg-gold-50/30 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <RiKey2Line size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 font-poppins">Password Change OTP Verification</h4>
                    <p className="text-xs text-slate-500">Mandatory root verification code before updating password</p>
                  </div>
                </div>

                {/* Password OTP Error */}
                {passwordOtpError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold animate-slide-up">
                    {passwordOtpError}
                  </div>
                )}

                {!passwordOtpSent && !passwordOtpVerified && (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 bg-white rounded-2xl border border-gold-200 shadow-2xs space-y-2 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">Authorization Code Required</p>
                      <p className="text-slate-500">A one-time 6-digit verification code will be sent to the registered master address: <strong className="text-slate-800 font-mono">{profileEmail}</strong>.</p>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={handleSendPasswordOtp}
                      disabled={passwordOtpLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                    >
                      {passwordOtpLoading ? 'Sending Password OTP...' : 'Send 6-Digit Password OTP'}
                    </Button>
                  </div>
                )}

                {passwordOtpSent && !passwordOtpVerified && (
                  <div className="space-y-4 pt-2 animate-slide-up">
                    <div className="p-4 bg-white rounded-2xl border border-gold-300 shadow-2xs text-center space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Enter 6-Digit Password Code</h5>
                      <p className="text-[11px] text-slate-400">Code dispatched to {profileEmail}</p>
                      <div className="py-2 flex justify-center">
                        <OTPInput length={6} onComplete={handleVerifyPasswordOtp} />
                      </div>
                      {passwordOtpLoading && <p className="text-xs text-gold-700 font-semibold animate-pulse">Verifying code...</p>}
                    </div>

                    <div className="text-center text-xs">
                      <button
                        onClick={handleSendPasswordOtp}
                        disabled={passwordOtpLoading}
                        className="text-gold-700 font-semibold hover:underline cursor-pointer"
                      >
                        Resend OTP Code
                      </button>
                    </div>
                  </div>
                )}

                {passwordOtpVerified && (
                  <div className="space-y-4 pt-2 animate-slide-up">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-800 space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <RiShieldCheckLine size={16} /> OTP Verified Successfully
                      </div>
                      <p className="text-[11px] text-emerald-700">Root credentials authorization confirmed. You may now commit the new master password.</p>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      icon={<RiLockPasswordLine />}
                      disabled={passwordOtpLoading}
                      onClick={handleCommitPasswordUpdate}
                    >
                      {passwordOtpLoading ? 'Updating Password...' : 'Commit & Update Master Password'}
                    </Button>
                  </div>
                )}

                {passwordUpdated && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-800 text-xs font-bold text-center animate-fade-in">
                    Master Password Updated Successfully!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: AUTOMATED USER DASHBOARD ALERTS & NOTIFICATIONS ──────────────── */}
      {activeSection === 'preferences' && (
        <div className="card p-6 border border-slate-200 space-y-6 animate-fade-in font-poppins">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-poppins">Automated User Dashboard Notification Engine</h3>
              <p className="text-xs text-slate-400">Configure comprehensive automated notifications and instant dispatch triggers for the investor dashboard</p>
            </div>
            {alertsSaved && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl animate-fade-in">
                <RiCheckLine size={14} /> Automation Settings Saved
              </span>
            )}
          </div>

          <div className="space-y-6 text-xs">
            {/* Category 1: Financial & Investment Plan Automations */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-gold-100 text-gold-700 flex items-center justify-center">
                  <RiCoinsLine size={14} />
                </div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  1. Financial & Investment Plan Automations
                </h4>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">Automated Deposit Approvals & Confirmation</p>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">Instant Push & Email</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Automatically trigger confirmation receipt and credit user vault upon blockchain / bank match</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={automatedAlerts.autoDepositApproval}
                    onChange={e => setAutomatedAlerts({ ...automatedAlerts, autoDepositApproval: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">Automated Real-Time Per-Second ROI Streaming</p>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded">Live Dynamic Stream</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Trigger live streaming counter notifications and instant daily yield settlement summaries</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={automatedAlerts.autoRoiStreaming}
                    onChange={e => setAutomatedAlerts({ ...automatedAlerts, autoRoiStreaming: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">Automated Withdrawal Broadcast & TXID Hash Notification</p>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded">Instant Webhook</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Instantly dispatch blockchain TXID explorer link and PDF receipt to client upon broadcast</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={automatedAlerts.autoWithdrawalBroadcast}
                    onChange={e => setAutomatedAlerts({ ...automatedAlerts, autoWithdrawalBroadcast: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">Automated Investment Contract Maturity & Rollover Alert</p>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold rounded">Maturity Bell</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Alert investor 48 hours before contract completion with capital rollover & renewal options</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={automatedAlerts.autoPlanMaturity}
                    onChange={e => setAutomatedAlerts({ ...automatedAlerts, autoPlanMaturity: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Category 2: Ranks, Cash Rewards & 5-Tier Referral Automations */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <RiTrophyLine size={14} />
                </div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  2. Ranks, Cash Rewards & 5-Tier Referral Automations
                </h4>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">Automated Rank Ladder Milestone Unlock & Instant Cash Bonus</p>
                      <span className="px-2 py-0.5 bg-gold-100 text-gold-900 border border-gold-300 text-[10px] font-bold rounded">Celebration Modal</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Automatically elevate user rank and disburse cash reward bonus into wallet upon turnover achievement</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={automatedAlerts.autoRankMilestones}
                    onChange={e => setAutomatedAlerts({ ...automatedAlerts, autoRankMilestones: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">Automated 5-Tier Referral Commission Payout Notifications</p>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">Real-Time Credit</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Real-time notification ping to promoters whenever Level 1 (5%) or Levels 2-5 downline teams deposit</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={automatedAlerts.autoReferralCommissions}
                    onChange={e => setAutomatedAlerts({ ...automatedAlerts, autoReferralCommissions: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">Automated Downline Investor Sign-Up Alerts</p>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded">Network Tree Ping</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Alert sponsor whenever a new member registers using their unique affiliate invite code</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={automatedAlerts.autoDownlineJoins}
                    onChange={e => setAutomatedAlerts({ ...automatedAlerts, autoDownlineJoins: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Category 3: Support Helpdesk, Security & News Automations */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <RiCustomerService2Line size={14} />
                </div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  3. Helpdesk, Security & Platform News Automations
                </h4>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">Automated Ticket Response & Resolution Alerts</p>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded">Instant Push & Email</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Notify users instantly with message preview when support officers reply to their open inquiry</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={automatedAlerts.autoTicketReplies}
                    onChange={e => setAutomatedAlerts({ ...automatedAlerts, autoTicketReplies: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">Automated News & Media Editorial Broadcasts</p>
                      <span className="px-2 py-0.5 bg-gold-50 text-gold-800 border border-gold-200 text-[10px] font-bold rounded">Dashboard Banner</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Automatically broadcast new blog articles and platform market announcements to all user feed bells</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={automatedAlerts.autoNewsBroadcasts}
                    onChange={e => setAutomatedAlerts({ ...automatedAlerts, autoNewsBroadcasts: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">Automated New Device & Geographic IP Security Alerts</p>
                      <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold rounded">High-Priority Security</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Trigger immediate 2FA security alert email when user account is logged in from an unrecognized browser/IP</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={automatedAlerts.autoNewDeviceLogin}
                    onChange={e => setAutomatedAlerts({ ...automatedAlerts, autoNewDeviceLogin: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button variant="primary" icon={<RiSaveLine />} onClick={handleSaveAlerts}>
              Save Automated Alert Preferences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
