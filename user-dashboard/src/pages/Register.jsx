import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendRegisterOtp } from '../api/authApi';
import {
  RiUser3Line, RiMailLine, RiLockPasswordLine,
  RiPhoneLine, RiGlobalLine, RiTeamLine,
  RiArrowRightLine, RiEyeLine, RiEyeOffLine,
  RiShieldCheckLine, RiCheckLine, RiMailSendLine,
  RiRefreshLine, RiArrowLeftLine, RiCloseLine
} from 'react-icons/ri';

import PhoneInput, { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';

// Complete dynamic country list with ISO codes and dial codes from react-phone-number-input
const countryList = getCountries()
  .map(code => ({
    code,
    name: en[code] || code,
    callingCode: getCountryCallingCode(code),
  }))
  .filter(c => c.name && c.callingCode)
  .sort((a, b) => a.name.localeCompare(b.name));

// Aliases for common shortcuts/abbreviations
const COUNTRY_ALIASES = {
  usa: 'US',
  us: 'US',
  america: 'US',
  uk: 'GB',
  britain: 'GB',
  england: 'GB',
  uae: 'AE',
  dubai: 'AE',
  emirates: 'AE',
  russia: 'RU',
  korea: 'KR',
};

const findCountryMatch = (text) => {
  if (!text) return null;
  const q = text.trim().toLowerCase();
  if (!q) return null;

  // 1. Check aliases
  if (COUNTRY_ALIASES[q]) {
    const aliasCode = COUNTRY_ALIASES[q];
    return countryList.find(c => c.code === aliasCode);
  }

  // 2. Exact match on country name
  const exactName = countryList.find(c => c.name.toLowerCase() === q);
  if (exactName) return exactName;

  // 3. Exact match on country 2-letter ISO code
  const exactCode = countryList.find(c => c.code.toLowerCase() === q);
  if (exactCode) return exactCode;

  // 4. Prefix match on country name if at least 3 characters
  if (q.length >= 3) {
    const prefixMatch = countryList.find(c => c.name.toLowerCase().startsWith(q));
    if (prefixMatch) return prefixMatch;
  }

  return null;
};

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refFromUrl = searchParams.get('ref') || searchParams.get('sponsor') || '';

  const { register } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [form, setForm] = useState({
    userName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: `+${getCountryCallingCode('IN')}`,
    country: 'India',
    countryCode: 'IN',
    sponsorId: refFromUrl || '',
  });

  useEffect(() => {
    if (refFromUrl) {
      setForm(p => ({ ...p, sponsorId: refFromUrl }));
    }
  }, [refFromUrl]);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA Email OTP Verification State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Helper to update phone field country code and flag
  const updatePhoneForCountry = (countryObj) => {
    setSelectedCountry(countryObj.code);
    const newCallingCode = `+${countryObj.callingCode}`;
    setForm(p => {
      let updatedPhone = p.phone || '';
      const prevCode = p.countryCode ? `+${getCountryCallingCode(p.countryCode)}` : '';
      if (!updatedPhone || updatedPhone.trim() === '' || updatedPhone === prevCode) {
        updatedPhone = newCallingCode;
      } else if (prevCode && updatedPhone.startsWith(prevCode)) {
        updatedPhone = updatedPhone.replace(prevCode, newCallingCode);
      } else if (!updatedPhone.startsWith('+')) {
        updatedPhone = `${newCallingCode}${updatedPhone}`;
      } else {
        updatedPhone = newCallingCode;
      }
      return {
        ...p,
        countryCode: countryObj.code,
        phone: updatedPhone.slice(0, 16),
      };
    });
    setError('');
  };

  // Normal typeable Country field change handler - automatically changes phone field country code
  const handleCountryChange = (e) => {
    const val = e.target.value;
    setForm(p => ({ ...p, country: val }));

    const matched = findCountryMatch(val);
    if (matched) {
      updatePhoneForCountry(matched);
    }
  };

  // Sync Country text input when user selects country flag in PhoneInput
  const handlePhoneCountryChange = (countryCode) => {
    if (countryCode) {
      setSelectedCountry(countryCode);
      const found = countryList.find(c => c.code === countryCode);
      if (found) {
        setForm(p => ({
          ...p,
          country: found.name,
          countryCode,
        }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({
      ...p,
      [name]: value,
      ...(name === 'userName' ? { fullName: value } : {}),
      ...(name === 'fullName' ? { userName: value } : {}),
    }));
    setError('');
  };

  // Step 1: Submit Details & Request 2FA Email OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    const uname = (form.userName || form.fullName || '').trim();
    if (!uname || !form.email || !form.password || !form.phone) {
      setError('Please fill all required fields');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const digitsOnly = form.phone.replace(/[^\d]/g, '');
    if (digitsOnly.length < 7) {
      setError('Please enter a valid mobile number with country code (min 7 digits).');
      return;
    }
    if (digitsOnly.length > 15) {
      setError('Phone number cannot exceed 15 digits according to international standard.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await sendRegisterOtp({
        name: uname,
        fullName: uname,
        userName: uname,
        email: form.email.trim(),
        phone: form.phone.trim().slice(0, 16),
        password: form.password,
        country: form.country,
        sponsorId: form.sponsorId,
      });

      if (res?.success) {
        setShowOtpModal(true);
        setCountdown(60);
        setOtp('');
        setOtpError('');
        setOtpSuccess(`A 6-digit verification code has been dispatched to ${form.email}.`);
      } else {
        setError(res?.message || 'Failed to dispatch verification code. Please check your email.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 2FA Registration OTP & Finalize Account Creation
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setOtpError('Please enter the 6-digit code received on your email.');
      return;
    }

    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);

    const uname = (form.userName || form.fullName || '').trim();
    const res = await register({
      ...form,
      name: uname,
      fullName: uname,
      userName: uname,
      otp: otp.trim(),
    });

    setOtpLoading(false);
    if (res?.success) {
      navigate('/');
    } else {
      setOtpError(res?.message || 'Invalid or expired 6-digit code. Please try again.');
    }
  };

  // Resend Registration 2FA OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);

    try {
      const uname = (form.userName || form.fullName || '').trim();
      const res = await sendRegisterOtp({
        name: uname,
        fullName: uname,
        userName: uname,
        email: form.email.trim(),
        phone: form.phone.trim().slice(0, 16),
        password: form.password,
        country: form.country,
        sponsorId: form.sponsorId,
      });

      if (res?.success) {
        setCountdown(60);
        setOtpSuccess(`A fresh verification code has been sent to ${form.email}.`);
      } else {
        setOtpError(res?.message || 'Failed to resend verification code.');
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || err.message || 'Error resending code.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-center px-16 relative overflow-hidden bg-gradient-to-br from-gold-50/70 via-white to-gold-100/30 border-r border-slate-100">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-full overflow-hidden shadow-gold ring-2 ring-[#ffd70d] bg-black flex-shrink-0">
              <img src="/admin/icon.png" alt="Logo" className="w-full h-full object-cover scale-105" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase font-poppins tracking-tight bg-gradient-to-r from-[#B8860B] via-[#D49800] to-[#8C6200] bg-clip-text text-transparent">
                HORIZON CAP WORLDS
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 font-poppins">
                Investor Portal
              </p>
            </div>
          </div>

          <h2 className="text-4xl font-bold font-display text-slate-900 leading-tight mb-4">
            Welcome to<br />
            <span className="text-gradient-gold">Horizon Cap Worlds.</span>
          </h2>
          <p className="text-slate-600 text-base leading-relaxed max-w-md font-poppins">
            Horizon Cap Worlds members earn daily profit from real solar power plants across four continents. Register and complete 2-step verification to access your live dashboard.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-10">
            <div className="px-5 py-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 font-poppins">Daily Profit</p>
              <p className="text-lg font-bold text-emerald-600 font-display tabular-nums">+1.62%</p>
            </div>
            <div className="px-5 py-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 font-poppins">Uptime</p>
              <p className="text-lg font-bold text-blue-600 font-display tabular-nums">99.94%</p>
            </div>
            <div className="px-5 py-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 font-poppins">Members</p>
              <p className="text-lg font-bold text-gold-600 font-display tabular-nums">12.4k</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-card">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-gold ring-2 ring-[#ffd70d] bg-black flex-shrink-0">
              <img src="/admin/icon.png" alt="Logo" className="w-full h-full object-cover scale-105" />
            </div>
            <h1 className="text-base font-black uppercase font-poppins tracking-tight text-gradient-gold">
              HORIZON CAP WORLDS
            </h1>
          </div>

          <h2 className="text-2xl font-bold font-display text-slate-900 mb-1">Create your account</h2>
          <p className="text-sm text-slate-500 mb-6 font-poppins">Register to start investing and earning. A 6-digit email OTP will verify your account.</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-poppins">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identity section */}
            <fieldset className="space-y-3">
              <legend className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 font-poppins mb-1">Identity</legend>
              
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">User Name</label>
                <div className="relative">
                  <RiUser3Line size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    name="userName"
                    value={form.userName}
                    onChange={handleChange}
                    placeholder="User Name"
                    className="input input-icon-left"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">Email</label>
                <div className="relative">
                  <RiMailLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="yourname@email.com" className="input input-icon-left" />
                </div>
              </div>
            </fieldset>

            {/* Password section */}
            <fieldset className="space-y-3">
              <legend className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 font-poppins mb-1">Password</legend>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">Password</label>
                  <div className="relative">
                    <RiLockPasswordLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="••••••••" className="input input-icon-both" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPass ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">Confirm Password</label>
                  <div className="relative">
                    <RiLockPasswordLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" className="input input-icon-both" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showConfirm ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Contact section */}
            <fieldset className="space-y-3">
              <legend className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 font-poppins mb-1">Contact</legend>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">
                    Mobile Number <span className="text-[10px] text-slate-400">(Max 15 digits)</span>
                  </label>
                  <div className="relative">
                    <PhoneInput
                      international
                      country={selectedCountry}
                      value={form.phone}
                      onChange={(val) => {
                        // Max 16 characters (+ dial code and up to 15 digits ITU-T standard)
                        const cleanVal = (val || '').slice(0, 16);
                        setForm(p => ({ ...p, phone: cleanVal }));
                        setError('');
                      }}
                      onCountryChange={handlePhoneCountryChange}
                      placeholder="+91"
                      className="custom-phone-input font-poppins"
                      limitMaxLength={true}
                      maxLength={16}
                      numberInputProps={{
                        maxLength: 16,
                        className: "font-poppins text-sm",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">Country</label>
                  <div className="relative">
                    <RiGlobalLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      name="country"
                      value={form.country}
                      onChange={handleCountryChange}
                      placeholder="Country"
                      className="input input-icon-left text-slate-800 text-sm font-poppins"
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Sponsor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 font-poppins">
                  Sponsor / Referral ID <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                {refFromUrl && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 font-poppins">
                    <RiCheckLine size={12} /> Verified Sponsor Link
                  </span>
                )}
              </div>
              <div className="relative">
                <RiTeamLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  name="sponsorId"
                  value={form.sponsorId}
                  onChange={handleChange}
                  placeholder="HORIZON-USR-01"
                  className={`input input-icon-left font-mono ${refFromUrl ? 'border-emerald-300 bg-emerald-50/20' : ''}`}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary text-base py-3.5 rounded-xl font-bold cursor-pointer transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Sending Verification OTP...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account <RiArrowRightLine size={18} />
                </span>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-slate-500 mt-5 font-poppins">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-600 font-semibold hover:underline">Login</Link>
          </p>

          {/* Security footer */}
          <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-400 font-poppins">
            <RiShieldCheckLine size={14} className="text-emerald-500" />
            <span>256-bit SSL encrypted · Gmail 2FA protected</span>
          </div>
        </div>
      </div>

      {/* ──────── 2FA OTP MODAL ──────── */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <RiCloseLine size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <RiMailSendLine size={28} />
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900">
                Verify Your Email
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-poppins">
                We sent a 6-digit verification code to
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 font-poppins">
                {form.email}
              </p>
            </div>

            {otpSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-poppins">
                {otpSuccess}
              </div>
            )}

            {otpError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-poppins">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block font-poppins text-center">
                  Enter 6-Digit Passcode
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(clean);
                    setOtpError('');
                  }}
                  placeholder="000000"
                  autoFocus
                  className="w-full text-center text-3xl font-mono font-bold tracking-[0.4em] py-3 px-4 rounded-xl border-2 border-slate-200 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/10 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading || otp.length !== 6}
                className="w-full btn btn-primary text-base py-3.5 rounded-xl font-bold disabled:opacity-50 cursor-pointer transition-all"
              >
                {otpLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Verifying & Creating Account...
                  </span>
                ) : (
                  <span>Verify & Complete Registration</span>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-poppins"
                >
                  <RiArrowLeftLine size={14} /> Back to details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || otpLoading}
                  className={`text-xs font-semibold font-poppins flex items-center gap-1 ${
                    countdown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-gold-600 hover:text-gold-700 cursor-pointer'
                  }`}
                >
                  <RiRefreshLine size={14} className={otpLoading ? 'animate-spin' : ''} />
                  {countdown > 0 ? `Resend Code in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
