import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  updateProfile as apiUpdateProfile,
  changePassword as apiChangePassword,
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  toggle2FA as apiToggle2FA,
  getProfile as apiGetProfile
} from '../api/authApi';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../api/uploadApi';
import {
  RiUser3Line, RiMailLine, RiPhoneLine, RiGlobalLine, RiCalendarLine,
  RiShieldCheckLine, RiEditLine, RiUpload2Line, RiDeleteBin7Line, RiCameraLine,
  RiCheckLine, RiLockPasswordLine, RiEyeLine, RiEyeOffLine, RiAlertLine,
  RiCheckboxCircleFill, RiAwardLine, RiMailSendLine, RiMailCheckLine,
  RiRefreshLine, RiSaveLine, RiKey2Line, RiShieldKeyholeLine
} from 'react-icons/ri';
import PageHeader from '../components/ui/PageHeader';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState('profile'); // 'profile' | 'password'
  const [avatar, setAvatar] = useState(() => user?.avatar || localStorage.getItem('horizon_user_avatar') || '');
  const [toastMsg, setToastMsg] = useState({ show: false, text: '', type: 'success' });
  const fileInputRef = useRef(null);

  // ──────── EDIT PROFILE STATE ────────
  const [form, setForm] = useState({
    fullName: user?.fullName || user?.name || 'William Max',
    email: user?.email || 'william@horizoncap.com',
    phone: user?.phone || '+91 98765 43210',
    country: user?.country || 'India',
    city: user?.city || 'New Delhi',
    address: user?.address || '14 Connaught Place, Block B',
    dob: user?.dob || '1992-06-15',
    timezone: user?.timezone || 'Asia/Kolkata (UTC+05:30)',
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // ──────── EMAIL 2FA STATE ────────
  const [is2FAEnabled, setIs2FAEnabled] = useState(() => !!user?.is2FAEnabled);

  // ──────── CHANGE PASSWORD STATE ────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // Password OTP Sub-step
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState('');
  const [generatedPasswordOtp, setGeneratedPasswordOtp] = useState('');
  const [otpSentTime, setOtpSentTime] = useState('');
  const [countdown, setCountdown] = useState(45);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: user.fullName || user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        country: user.country || prev.country,
        city: user.city || prev.city,
        address: user.address || prev.address,
        dob: user.dob || prev.dob,
        timezone: user.timezone || prev.timezone,
      }));
      setIs2FAEnabled(!!user.is2FAEnabled);
      if (user.avatar) setAvatar(user.avatar);
    }
  }, [user]);

  // Sync Avatar
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

  // Countdown timer for Password OTP
  useEffect(() => {
    let timer;
    if (passwordOtpSent && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [passwordOtpSent, countdown]);

  const triggerToast = (text, type = 'success') => {
    setToastMsg({ show: true, text, type });
    setTimeout(() => setToastMsg({ show: false, text: '', type: 'success' }), 4000);
  };

  // Avatar Upload (Direct Cloudinary upload with old asset auto-cleanup)
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const previewUrl = uploadEvent.target.result;
        setAvatar(previewUrl);
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
          triggerToast('Profile photo updated successfully!');
        }
      } catch (err) {
        console.warn('Avatar upload fallback:', err.message);
      }
    }
  };

  // Avatar Remove (Cleans up from Cloudinary storage)
  const handleRemoveAvatar = async () => {
    const previousAvatar = avatar;
    setAvatar('');
    localStorage.removeItem('horizon_user_avatar');
    window.dispatchEvent(new CustomEvent('user-avatar-change', { detail: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (previousAvatar && previousAvatar.includes('cloudinary.com')) {
      deleteFileFromCloudinary(previousAvatar).catch(() => null);
    }

    try {
      await apiUpdateProfile({ avatar: '' });
      updateUser({ avatar: '' });
    } catch (err) {}
    triggerToast('Profile photo removed.', 'info');
  };

  // Save Profile Form
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiUpdateProfile({
        name: form.fullName,
        phone: form.phone,
        country: form.country,
        city: form.city,
        address: form.address,
        dob: form.dob,
        timezone: form.timezone,
        avatar,
      });

      if (res?.success) {
        updateUser({
          fullName: form.fullName,
          phone: form.phone,
          country: form.country,
          city: form.city,
          address: form.address,
          dob: form.dob,
          timezone: form.timezone,
        });
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
        triggerToast('Personal profile credentials updated successfully!');
      } else {
        triggerToast(res?.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || err.message || 'Profile update failed.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Direct Inline Toggle 2FA
  const handleToggle2FA = async () => {
    const nextState = !is2FAEnabled;
    try {
      const res = await apiToggle2FA(nextState);
      const activeState = res?.is2FAEnabled !== undefined ? res.is2FAEnabled : nextState;
      setIs2FAEnabled(activeState);
      localStorage.setItem('horizon_email_2fa_enabled', String(activeState));
      updateUser({ is2FAEnabled: activeState });
      if (activeState) {
        triggerToast('Email 2FA Activated! A 6-digit OTP will now be required on Login.');
      } else {
        triggerToast('Email 2FA Disabled.', 'warning');
      }
    } catch (err) {
      setIs2FAEnabled(nextState);
      localStorage.setItem('horizon_email_2fa_enabled', String(nextState));
      triggerToast('2FA setting updated locally.', 'info');
    }
  };

  // Send Password Change OTP
  const handleSendPasswordOTP = async (e) => {
    e?.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current account password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      const res = await apiSendOtp({ purpose: 'CHANGE_PASSWORD' });
      if (res?.success) {
        setPasswordOtp('');
        setCountdown(60);
        setOtpSentTime(new Date().toLocaleTimeString());
        setPasswordOtpSent(true);
        triggerToast(`6-Digit Verification OTP sent to ${form.email}`, 'info');
      } else {
        setPasswordError(res?.message || 'Could not send verification OTP.');
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to dispatch verification OTP.');
    }
  };

  // Commit Password Change with OTP Verification
  const handleVerifyPasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordOtp.trim().length !== 6) {
      setPasswordError('Please enter the 6-digit OTP received on your email.');
      return;
    }

    setChangingPass(true);
    try {
      // Change Password with OTP & current password
      const res = await apiChangePassword({
        currentPassword,
        newPassword,
        otp: passwordOtp.trim(),
      });

      if (res?.success) {
        setPasswordSaved(true);
        triggerToast('Account password updated successfully! Keep your credentials safe.');

        setTimeout(() => {
          setPasswordSaved(false);
          setPasswordOtpSent(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordOtp('');
        }, 3000);
      } else {
        setPasswordError(res?.message || 'Password update failed.');
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message || 'Password change failed. Please verify your OTP code.');
    } finally {
      setChangingPass(false);
    }
  };

  // Password Strength Calculation (Super Admin DESIGN.MD)
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const passStrength = getPasswordStrength(newPassword);

  const sections = [
    { key: 'profile', label: 'My Profile & 2FA', icon: RiUser3Line },
    { key: 'password', label: 'Change Password (Email OTP)', icon: RiLockPasswordLine },
  ];

  return (
    <div className="page-enter space-y-6 pb-12 font-poppins">
      {/* ──────── PAGE HEADER ──────── */}
      <PageHeader
        title="Account Settings & Security"
        subtitle="Manage personal profile details, Email 2-Factor Authentication (2FA), and secure password credentials"
        badge="Account Center"
      />

      {/* ──────── FEEDBACK TOAST ──────── */}
      {toastMsg.show && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2.5 animate-slide-up shadow-sm ${
          toastMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : toastMsg.type === 'warning'
            ? 'bg-amber-50 border-amber-300 text-amber-800'
            : toastMsg.type === 'danger'
            ? 'bg-rose-50 border-rose-300 text-rose-800'
            : 'bg-blue-50 border-blue-300 text-blue-800'
        }`}>
          <RiCheckboxCircleFill size={20} className={toastMsg.type === 'success' ? 'text-emerald-600' : 'text-amber-600'} />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ──────── NAVIGATION TABS (MATCHING SUPER ADMIN SETTINGS DESIGN.MD) ──────── */}
      <div className="card p-2">
        <div className="flex gap-2 overflow-x-auto font-poppins">
          {sections.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSection(tab.key)}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gold-400 text-slate-950 font-bold shadow-gold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-slate-950' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ──────────────── TAB 1: PROFILE & 2FA SECURITY (2-COLUMN SUPER ADMIN LAYOUT) ──────────────── */}
      {activeSection === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-poppins">
          {/* Left Column: Investor Profile Summary Card */}
          <div className="card p-6 flex flex-col items-center text-center space-y-4 border border-slate-200 shadow-sm">
            {/* Avatar Circle with Upload Trigger */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center ring-4 ring-gold-200/90 shadow-gold bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-950 font-extrabold text-3xl font-poppins">
                {avatar ? (
                  <img src={avatar} alt={form.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{(form.fullName || 'User').charAt(0)}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/60 rounded-full flex flex-col items-center justify-center text-gold-300 opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-xs font-bold gap-1"
                title="Change Profile Photo"
              >
                <RiCameraLine size={20} />
                <span>Change</span>
              </button>
            </div>

            {/* Photo Action Buttons */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-gold-50 text-slate-700 hover:text-gold-900 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                <RiUpload2Line size={14} className="text-gold-600" />
                <span>Upload</span>
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl border border-rose-200 transition-colors cursor-pointer"
                  title="Remove profile photo"
                >
                  <RiDeleteBin7Line size={14} />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-800">{form.fullName}</h3>
              <p className="text-xs text-gold-700 font-mono font-bold mt-0.5">{user?.id || 'HORIZON-USR-07'}</p>
            </div>

            <div className="flex flex-col gap-1.5 w-full pt-1">
              <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-gold-50 text-gold-900 border border-gold-300 rounded-xl text-xs font-semibold shadow-2xs">
                <RiAwardLine size={14} className="text-gold-600" /> Level 3 Gold Sovereign
              </span>
            </div>

            {/* Quick Metadata */}
            <div className="w-full pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Registered Email:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[140px]">{form.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Direct Sponsor:</span>
                <strong className="text-slate-800">{user?.sponsorId || 'HORIZON-USR-01'}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Country:</span>
                <span className="text-slate-800 font-medium">{form.country}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Form & Clean 2FA Sliding Toggle */}
          <div className="lg:col-span-2 card p-6 space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-poppins">Personal Account & Security Details</h3>
                <p className="text-xs text-slate-400">Update personal identity credentials and manage Email 2FA protection</p>
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
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Registered Email Address *</span>
                    <span className="text-[10px] text-emerald-600 font-bold lowercase">✓ verified</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 outline-none cursor-not-allowed shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile / WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Country of Residence *
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={e => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    City / Province
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={e => setForm({ ...form, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Residential Street Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                />
              </div>

              {/* ──────────────── EMAIL 2FA SLIDING SWITCH (DIRECT INLINE TOGGLE, NO MODAL) ──────────────── */}
              <div className="p-4 bg-gold-50/50 rounded-2xl border border-gold-300/80 shadow-2xs">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <RiMailCheckLine size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-800">Email 2-Factor Authentication (2FA)</h4>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          is2FAEnabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {is2FAEnabled ? 'Enabled (Login Protected)' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {is2FAEnabled
                          ? `Active: A 6-digit OTP will be sent to ${form.email} whenever you sign in.`
                          : `Enable to require a 6-digit OTP sent to ${form.email} upon sign in.`}
                      </p>
                    </div>
                  </div>

                  {/* Clean Sliding Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={is2FAEnabled}
                    onClick={handleToggle2FA}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      is2FAEnabled ? 'bg-gold-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        is2FAEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="btn btn-primary px-6 py-2.5 text-xs font-bold shadow-gold cursor-pointer flex items-center gap-1.5"
                >
                  <RiSaveLine size={16} /> Save Profile Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: CHANGE PASSWORD (WITH EMAIL OTP VERIFICATION) ──────────────── */}
      {activeSection === 'password' && (
        <div className="card p-6 sm:p-8 space-y-6 max-w-2xl border border-slate-200 font-poppins shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <RiLockPasswordLine size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Update Account Password</h3>
                <p className="text-xs text-slate-400">Password change requires 6-digit verification code sent to your registered email</p>
              </div>
            </div>

            {passwordSaved && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl animate-fade-in">
                <RiCheckLine size={14} /> Password Updated Successfully
              </span>
            )}
          </div>

          {passwordError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-slide-up">
              <RiAlertLine size={18} className="text-rose-600 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {!passwordOtpSent ? (
            /* STEP 1: ENTER PASSWORDS & REQUEST OTP */
            <form onSubmit={handleSendPasswordOTP} className="space-y-4 text-xs font-poppins">
              {/* Current Password */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPass ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Password Strength:</span>
                      <span className={`font-bold ${
                        passStrength <= 25 ? 'text-rose-600' : passStrength <= 50 ? 'text-amber-600' : passStrength <= 75 ? 'text-blue-600' : 'text-emerald-600'
                      }`}>
                        {passStrength <= 25 ? 'Weak' : passStrength <= 50 ? 'Fair' : passStrength <= 75 ? 'Good' : 'Strong & Secure'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passStrength <= 25 ? 'bg-rose-500' : passStrength <= 50 ? 'bg-amber-500' : passStrength <= 75 ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${passStrength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="btn btn-primary px-6 py-2.5 text-xs font-bold shadow-gold cursor-pointer flex items-center gap-1.5"
                >
                  <RiMailSendLine size={16} /> Send Verification OTP to {form.email}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: VERIFY 6-DIGIT EMAIL OTP & CONFIRM PASSWORD CHANGE */
            <form onSubmit={handleVerifyPasswordChange} className="space-y-4 animate-fade-in text-xs font-poppins">
              {/* Destination Header */}
              <div className="flex items-center gap-3 p-3.5 bg-gold-50/70 rounded-2xl border border-gold-200">
                <div className="w-9 h-9 rounded-xl bg-white border border-gold-300 flex items-center justify-center text-gold-700 shadow-2xs flex-shrink-0">
                  <RiMailSendLine size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Email Verification Code Sent</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    We sent a 6-digit security OTP to <strong className="text-slate-900">{form.email}</strong> to authorize this password change.
                  </p>
                </div>
              </div>

              {/* Live Email Notification Status */}
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 flex items-center justify-between text-xs text-blue-900">
                <span className="font-semibold flex items-center gap-1.5">
                  <RiMailLine size={16} className="text-blue-600" />
                  Code sent via Gmail SMTP to <strong className="text-blue-950 font-mono">{form.email}</strong>
                </span>
                <span className="text-blue-600 font-mono text-[11px]">{otpSentTime}</span>
              </div>

              {/* OTP Input */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Enter 6-Digit Email OTP *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={passwordOtp}
                  onChange={e => { setPasswordOtp(e.target.value.replace(/[^0-9]/g, '')); setPasswordError(''); }}
                  placeholder="••••••"
                  className="w-full py-3 px-4 text-center font-mono text-2xl font-black tracking-[0.5em] bg-slate-50 rounded-2xl border-2 border-slate-200 outline-none focus:border-gold-400 focus:bg-white shadow-2xs"
                  autoFocus
                  required
                />
              </div>

              {/* Resend & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  {countdown > 0 ? (
                    <span>Resend OTP in <strong className="font-mono text-slate-700">{countdown}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendPasswordOTP}
                      className="text-gold-700 hover:text-gold-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RiRefreshLine size={14} /> Resend OTP Code
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordOtpSent(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-6 py-2.5 text-xs font-bold shadow-gold cursor-pointer flex items-center gap-1.5"
                  >
                    <RiCheckLine size={16} /> Verify & Update Password
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
