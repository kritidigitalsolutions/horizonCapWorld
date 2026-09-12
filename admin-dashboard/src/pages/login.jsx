import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiMailLine,
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiArrowLeftLine,
  RiKey2Line,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiShieldCheckLine,
  RiLoader4Line
} from 'react-icons/ri';
import API from "../api/api";
import { forgotPasswordSendOtp, forgotPasswordVerifyOtp, forgotPasswordReset } from "../api/authApi";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login Form Data
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  // Resend OTP Countdown Timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { email, password } = formData;
      const response = await API.post('/admin/auth/login', {
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('admin', JSON.stringify(response.data.admin));
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send Forgot Password OTP
  const handleSendForgotOtp = async (e) => {
    e?.preventDefault();
    if (!forgotEmail.trim()) {
      setError('Please enter your administrator email address.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await forgotPasswordSendOtp({ email: forgotEmail.trim() });
      if (res?.success) {
        setSuccess(`A 6-digit recovery code has been sent to ${forgotEmail}.`);
        setForgotStep(2);
        setCountdown(60);
      } else {
        setError(res?.message || 'Failed to dispatch recovery code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error sending recovery email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Recovery OTP
  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setError('Please enter the valid 6-digit code received on your email.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await forgotPasswordVerifyOtp({ email: forgotEmail.trim(), otp: forgotOtp.trim() });
      if (res?.success) {
        setSuccess('Recovery code verified. Choose a secure new password.');
        setForgotStep(3);
      } else {
        setError(res?.message || 'Invalid or expired recovery code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await forgotPasswordReset({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword
      });

      if (res?.success) {
        setSuccess('Password has been reset successfully! You can now log in.');
        setFormData({ email: forgotEmail.trim(), password: '' });
        setTimeout(() => {
          setMode('login');
          setForgotStep(1);
          setForgotEmail('');
          setForgotOtp('');
          setNewPassword('');
          setConfirmPassword('');
        }, 1500);
      } else {
        setError(res?.message || 'Password reset failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] relative overflow-hidden p-4 sm:p-6 font-poppins">
      {/* Decorative Luxury Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[520px] h-[520px] bg-gradient-to-br from-gold-200/25 via-gold-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[520px] h-[520px] bg-gradient-to-tl from-gold-300/15 via-amber-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-card border border-slate-200/80 p-7 sm:p-9 relative overflow-hidden z-10 transition-all hover:shadow-card-hover">
        {/* Luxury Gold Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500" />

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-7 text-center">
          {/* Official Round Logo Emblem with Gold Ring */}
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center mb-3.5 shadow-gold ring-2 ring-[#ffd70d] bg-black select-none transition-transform hover:scale-105">
            <img
              src="/admin/icon.png"
              alt="Horizon Cap Worlds"
              className="w-full h-full object-cover rounded-full scale-105"
            />
          </div>

          {/* Official Brand Name with Gold Gradient (Selection-proof) */}
          <h1 className="text-2xl sm:text-[26px] font-black uppercase font-poppins tracking-tight gold-gradient-title leading-tight">
            HORIZON CAP WORLDS
          </h1>

          {/* Luxury Unified Super Admin Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-gold-50 via-amber-50 to-gold-100 border border-gold-300/90 shadow-2xs mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-gold-950 font-poppins">
              Super Admin
            </span>
            <span className="text-gold-400 font-bold">•</span>
            <span className="text-[11px] font-bold text-slate-700">
              {mode === 'login' ? 'Master Access' : 'Security Recovery'}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-2.5 text-center max-w-xs leading-relaxed">
            {mode === 'login'
              ? 'Enter your administrator credentials to access the master management dashboard'
              : 'Verify your administrative identity to securely reset your console password'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50/90 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2.5 font-medium shadow-2xs animate-fade-in">
            <RiErrorWarningLine size={18} className="text-red-500 flex-shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-5 p-3.5 bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2.5 font-medium shadow-2xs animate-fade-in">
            <RiCheckboxCircleLine size={18} className="text-emerald-600 flex-shrink-0" />
            <span className="leading-snug">{success}</span>
          </div>
        )}

        {/* ──────── MODE 1: LOGIN FORM ──────── */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 ml-1">Administrator Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <RiMailLine size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="username"
                  placeholder="admin@horizoncap.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400 transition-all placeholder:text-slate-400 font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-slate-700">Security Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotStep(1);
                    setError('');
                    setSuccess('');
                    setForgotEmail(formData.email || '');
                  }}
                  className="text-xs font-bold text-gold-600 hover:text-gold-700 hover:underline cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <RiLockPasswordLine size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400 transition-all placeholder:text-slate-400 font-medium text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button (Luxury Gold Gradient matching DESIGN.md) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-gold-400 via-gold-400 to-amber-500 hover:from-gold-300 hover:to-gold-400 text-slate-950 font-bold rounded-xl shadow-md shadow-gold-400/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-5 cursor-pointer"
            >
              {loading ? (
                <>
                  <RiLoader4Line size={19} className="animate-spin text-slate-950" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        ) : (
          /* ──────── MODE 2: FORGOT PASSWORD RECOVERY FLOW ──────── */
          <div className="space-y-4 animate-fade-in">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccess('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-0.5"
            >
              <RiArrowLeftLine size={15} />
              <span>Back to Sign In</span>
            </button>

            {/* Step Indicator with High-Contrast Number Badges */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 select-none">
              {/* Step 1 */}
              <div className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
                forgotStep === 1
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                  : forgotStep > 1
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                  : 'text-slate-500 font-medium'
              }`}>
                <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                  forgotStep === 1
                    ? 'bg-gold-400 text-slate-950 shadow-2xs'
                    : forgotStep > 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-700 font-bold'
                }`}>
                  {forgotStep > 1 ? '✓' : '1'}
                </span>
                <span className="truncate text-[11px]">Email</span>
              </div>

              {/* Step 2 */}
              <div className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
                forgotStep === 2
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                  : forgotStep > 2
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                  : 'text-slate-500 font-medium'
              }`}>
                <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                  forgotStep === 2
                    ? 'bg-gold-400 text-slate-950 shadow-2xs'
                    : forgotStep > 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-700 font-bold'
                }`}>
                  {forgotStep > 2 ? '✓' : '2'}
                </span>
                <span className="truncate text-[11px]">OTP Code</span>
              </div>

              {/* Step 3 */}
              <div className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
                forgotStep === 3
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-500 font-medium'
              }`}>
                <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                  forgotStep === 3
                    ? 'bg-gold-400 text-slate-950 shadow-2xs'
                    : 'bg-slate-300 text-slate-700 font-bold'
                }`}>
                  3
                </span>
                <span className="truncate text-[11px]">Password</span>
              </div>
            </div>

            {/* STEP 1: ENTER EMAIL */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendForgotOtp} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">Registered Super Admin Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <RiMailLine size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@horizoncap.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400 transition-all font-medium text-slate-800"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 ml-1">
                    A 6-digit secure recovery code will be dispatched to this email address.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !forgotEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-gold-400 via-gold-400 to-amber-500 hover:from-gold-300 hover:to-gold-400 text-slate-950 font-bold rounded-xl shadow-md shadow-gold-400/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RiLoader4Line size={19} className="animate-spin text-slate-950" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <span>Send Recovery OTP</span>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: ENTER OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyForgotOtp} className="space-y-3.5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-slate-700">
                      Enter 6-Digit Code
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[180px]">
                      {forgotEmail}
                    </span>
                  </div>

                  {/* High-Contrast Segmented 6-Digit OTP Box Grid */}
                  <div className="relative my-2 select-none">
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                      {[0, 1, 2, 3, 4, 5].map((idx) => {
                        const val = forgotOtp[idx] || '';
                        const isCurrent = forgotOtp.length === idx;
                        return (
                          <div
                            key={idx}
                            className={`w-11 h-13 sm:w-12 sm:h-14 rounded-xl border-2 flex items-center justify-center font-mono text-xl sm:text-2xl font-black transition-all ${
                              val
                                ? 'border-gold-400 bg-gold-50/70 text-slate-950 shadow-2xs'
                                : isCurrent
                                ? 'border-gold-500 bg-white ring-2 ring-gold-400/20 shadow-sm text-gold-600'
                                : 'border-slate-200 bg-slate-50/70 text-slate-300'
                            }`}
                          >
                            {val || (isCurrent ? <span className="w-2.5 h-0.5 bg-gold-600 animate-pulse" /> : '•')}
                          </div>
                        );
                      })}
                    </div>
                    {/* Native hidden input overlay for seamless typing and copy-paste */}
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-transparent selection:bg-transparent"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || forgotOtp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-gold-400 via-gold-400 to-amber-500 hover:from-gold-300 hover:to-gold-400 text-slate-950 font-bold rounded-xl shadow-md shadow-gold-400/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RiLoader4Line size={19} className="animate-spin text-slate-950" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Didn't receive code?</span>
                  {countdown > 0 ? (
                    <span className="font-mono font-semibold text-slate-400">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendForgotOtp}
                      className="text-gold-600 font-bold hover:text-gold-700 hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* STEP 3: CHOOSE NEW PASSWORD */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">New Security Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <RiLockPasswordLine size={18} />
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400 transition-all font-medium text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <RiLockPasswordLine size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400 transition-all font-medium text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-gold-400 via-gold-400 to-amber-500 hover:from-gold-300 hover:to-gold-400 text-slate-950 font-bold rounded-xl shadow-md shadow-gold-400/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RiLoader4Line size={19} className="animate-spin text-slate-950" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Reset Password & Proceed</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer Text */}
      <div className="mt-7 text-center text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5 z-10">
        <RiShieldCheckLine size={16} className="text-gold-500 flex-shrink-0" />
        <span>Secure Admin Portal &bull; &copy; {new Date().getFullYear()} HORIZON CAP WORLDS. All rights reserved.</span>
      </div>
    </div>
  );
}