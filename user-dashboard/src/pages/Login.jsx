import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  sendLogin2FAOtp,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset
} from '../api/authApi';
import {
  RiMailLine, RiLockPasswordLine,
  RiArrowRightLine, RiEyeLine, RiEyeOffLine,
  RiShieldCheckLine, RiMailSendLine, RiRefreshLine,
  RiArrowLeftLine, RiCheckboxCircleFill, RiKey2Line, RiAlertLine
} from 'react-icons/ri';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Basic Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Step Management: 'credentials' | '2fa' | 'forgot-email' | 'forgot-otp' | 'forgot-reset'
  const [step, setStep] = useState('credentials');

  // 2FA State
  const [loginOtp, setLoginOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // ──────── 1. SUBMIT CREDENTIALS / CHECK 2FA ────────
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res?.require2FA) {
      setStep('2fa');
      setCountdown(60);
      setSuccess(`A 6-digit 2FA verification code has been dispatched to ${email}.`);
      return;
    }

    if (res?.success) {
      setSuccess('Login successful! Redirecting to your dashboard...');
      setTimeout(() => navigate('/'), 600);
    } else {
      setError(res?.message || 'Invalid email or password.');
    }
  };

  // ──────── 2. SUBMIT 2FA OTP ────────
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (loginOtp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code received on your email.');
      return;
    }

    setError('');
    setLoading(true);
    const res = await login(email, password, loginOtp.trim());
    setLoading(false);

    if (res?.success) {
      setSuccess('2FA verification successful! Accessing your account...');
      setTimeout(() => navigate('/'), 600);
    } else {
      setError(res?.message || 'Invalid or expired 2FA code.');
    }
  };

  // Resend 2FA OTP
  const handleResend2FAOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await sendLogin2FAOtp({ email, password });
      if (res?.success) {
        setCountdown(60);
        setSuccess(`A fresh 6-digit code has been dispatched to ${email}.`);
      } else {
        setError(res?.message || 'Failed to resend 2FA OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error resending 2FA code.');
    } finally {
      setLoading(false);
    }
  };

  // ──────── 3. FORGOT PASSWORD FLOW ────────
  // Step 3A: Request Forgot Password OTP
  const handleSendForgotOtp = async (e) => {
    e?.preventDefault();
    if (!forgotEmail.trim()) {
      setError('Please provide your registered account email.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await forgotPasswordSendOtp({ email: forgotEmail.trim() });
      if (res?.success) {
        setSuccess(`Password recovery code sent to ${forgotEmail}.`);
        setStep('forgot-otp');
        setCountdown(60);
      } else {
        setError(res?.message || 'Failed to send recovery OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send recovery email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3B: Verify Forgot Password OTP
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
        setSuccess('OTP verified. Please choose your new password.');
        setStep('forgot-reset');
      } else {
        setError(res?.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3C: Reset Password & Confirm
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
        setSuccess('Password updated successfully! You can now sign in.');
        setEmail(forgotEmail.trim());
        setPassword('');
        setTimeout(() => {
          setStep('credentials');
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
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-center px-16 relative overflow-hidden bg-gradient-to-br from-gold-50/70 via-white to-gold-100/30 border-r border-slate-100">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl"></div>

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
            Welcome back to<br />
            <span className="text-gradient-gold">Your Dashboard.</span>
          </h2>
          <p className="text-slate-600 text-base leading-relaxed max-w-md font-poppins">
            Sign in to access your live investment dashboard, track real-time earnings, and manage your portfolio.
          </p>

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

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-card font-poppins">
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-gold ring-2 ring-[#ffd70d] bg-black flex-shrink-0">
              <img src="/admin/icon.png" alt="Logo" className="w-full h-full object-cover scale-105" />
            </div>
            <h1 className="text-base font-black uppercase font-poppins tracking-tight text-gradient-gold">
              HORIZON CAP WORLDS
            </h1>
          </div>

          {/* Feedback alerts */}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-poppins font-semibold flex items-center gap-2 animate-fade-in">
              <RiCheckboxCircleFill size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-poppins font-semibold flex items-center gap-2 animate-fade-in">
              <RiAlertLine size={16} className="text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ──────── 1. CREDENTIALS SIGN IN ──────── */}
          {step === 'credentials' && (
            <>
              <h2 className="text-2xl font-bold font-display text-slate-900 mb-1">Sign in</h2>
              <p className="text-sm text-slate-500 mb-6 font-poppins">Enter your credentials to access your dashboard.</p>

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">Email</label>
                  <div className="relative">
                    <RiMailLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="yourname@email.com"
                      className="input input-icon-left"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 font-poppins">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('forgot-email');
                        setForgotEmail(email || '');
                        setError('');
                        setSuccess('');
                      }}
                      className="text-xs font-semibold text-gold-700 hover:text-gold-900 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <RiLockPasswordLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="••••••••"
                      className="input input-icon-both"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPass ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary text-base py-3.5 rounded-xl font-bold cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Signing in...
                    </span>
                  ) : (
                    <>Sign In <RiArrowRightLine size={18} /></>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-5 font-poppins">
                Don't have an account?{' '}
                <Link to="/register" className="text-gold-600 font-semibold hover:underline">Register</Link>
              </p>
            </>
          )}

          {/* ──────── 2. 2FA EMAIL OTP VERIFICATION SCREEN ──────── */}
          {step === '2fa' && (
            <div className="space-y-5 animate-fade-in font-poppins">
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setError(''); setSuccess(''); }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-3 cursor-pointer"
                >
                  <RiArrowLeftLine size={14} /> Back to Sign In
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 border border-gold-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <RiMailSendLine size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-slate-900 leading-tight">
                      2-Step Email Verification
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Security code sent to <strong className="text-slate-800">{email}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handle2FASubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                    Enter 6-Digit Email OTP *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={loginOtp}
                    onChange={e => { setLoginOtp(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
                    placeholder="••••••"
                    className="w-full py-3.5 px-4 text-center font-mono text-2xl font-black tracking-[0.6em] bg-slate-50 rounded-2xl border-2 border-slate-200 outline-none focus:border-gold-400 focus:bg-white shadow-2xs"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || loginOtp.length !== 6}
                  className="w-full btn btn-primary text-base py-3.5 rounded-xl font-bold cursor-pointer shadow-gold"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Verifying code...
                    </span>
                  ) : (
                    <>Verify & Access Dashboard <RiArrowRightLine size={18} /></>
                  )}
                </button>
              </form>

              {/* Resend Timer */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Didn't receive the email?</span>
                {countdown > 0 ? (
                  <span className="font-mono font-semibold text-slate-400">
                    Resend in {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend2FAOtp}
                    disabled={loading}
                    className="text-gold-700 hover:text-gold-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RiRefreshLine size={14} /> Resend Security OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ──────── 3A. FORGOT PASSWORD: ENTER EMAIL ──────── */}
          {step === 'forgot-email' && (
            <div className="space-y-5 animate-fade-in font-poppins">
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setError(''); setSuccess(''); }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-3 cursor-pointer"
                >
                  <RiArrowLeftLine size={14} /> Back to Sign In
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 border border-gold-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <RiKey2Line size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-slate-900 leading-tight">
                      Password Recovery
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter your account email to receive a recovery code
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSendForgotOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <RiMailLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => { setForgotEmail(e.target.value); setError(''); }}
                      placeholder="yourname@email.com"
                      className="input input-icon-left"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !forgotEmail.trim()}
                  className="w-full btn btn-primary text-base py-3.5 rounded-xl font-bold cursor-pointer shadow-gold"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Sending OTP...
                    </span>
                  ) : (
                    <>Send Recovery Code <RiArrowRightLine size={18} /></>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ──────── 3B. FORGOT PASSWORD: ENTER OTP ──────── */}
          {step === 'forgot-otp' && (
            <div className="space-y-5 animate-fade-in font-poppins">
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('forgot-email'); setError(''); setSuccess(''); }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-3 cursor-pointer"
                >
                  <RiArrowLeftLine size={14} /> Back
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 border border-gold-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <RiMailSendLine size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-slate-900 leading-tight">
                      Enter Recovery OTP
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      6-digit code dispatched to <strong className="text-slate-800">{forgotEmail}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                    6-Digit Email Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={e => { setForgotOtp(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
                    placeholder="••••••"
                    className="w-full py-3.5 px-4 text-center font-mono text-2xl font-black tracking-[0.6em] bg-slate-50 rounded-2xl border-2 border-slate-200 outline-none focus:border-gold-400 focus:bg-white shadow-2xs"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || forgotOtp.length !== 6}
                  className="w-full btn btn-primary text-base py-3.5 rounded-xl font-bold cursor-pointer shadow-gold"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Verifying code...
                    </span>
                  ) : (
                    <>Verify Code <RiArrowRightLine size={18} /></>
                  )}
                </button>
              </form>

              {/* Resend Timer */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Didn't receive code?</span>
                {countdown > 0 ? (
                  <span className="font-mono font-semibold text-slate-400">
                    Resend in {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendForgotOtp}
                    disabled={loading}
                    className="text-gold-700 hover:text-gold-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RiRefreshLine size={14} /> Resend Recovery Code
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ──────── 3C. FORGOT PASSWORD: CHOOSE NEW PASSWORD ──────── */}
          {step === 'forgot-reset' && (
            <div className="space-y-5 animate-fade-in font-poppins">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 border border-gold-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <RiShieldCheckLine size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-slate-900 leading-tight">
                      Set New Password
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Create a strong, secure password for your account
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">
                    New Password *
                  </label>
                  <div className="relative">
                    <RiLockPasswordLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="At least 6 characters"
                      className="input input-icon-both"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showNewPass ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <RiLockPasswordLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Repeat new password"
                      className="input input-icon-both"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPass ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full btn btn-primary text-base py-3.5 rounded-xl font-bold cursor-pointer shadow-gold"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Updating password...
                    </span>
                  ) : (
                    <>Save Password & Sign In <RiArrowRightLine size={18} /></>
                  )}
                </button>
              </form>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mt-6 text-[11px] text-slate-400 font-poppins">
            <RiShieldCheckLine size={14} className="text-emerald-500" />
            <span>256-bit transport · cold isolated · audited weekly</span>
          </div>
        </div>
      </div>
    </div>
  );
}
