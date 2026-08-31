import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  RiMailLine, RiLockPasswordLine,
  RiArrowRightLine, RiEyeLine, RiEyeOffLine,
  RiShieldCheckLine, RiMailSendLine, RiRefreshLine,
  RiArrowLeftLine, RiCheckboxCircleFill
} from 'react-icons/ri';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ──────── 2FA STEP STATE ────────
  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
  const [loginOtp, setLoginOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('849201');
  const [countdown, setCountdown] = useState(45);
  const [otpSentTime, setOtpSentTime] = useState('');

  useEffect(() => {
    let timer;
    if (step === '2fa' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const send2FAOtp = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomCode);
    setLoginOtp('');
    setCountdown(45);
    setOtpSentTime(new Date().toLocaleTimeString());
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');
    setLoading(true);

    const is2FA = localStorage.getItem('horizon_email_2fa_enabled') === 'true';

    if (is2FA) {
      send2FAOtp();
      setStep('2fa');
      setLoading(false);
      return;
    }

    const res = await login(email, password);
    setLoading(false);
    if (res?.success) {
      setSuccess(true);
      setTimeout(() => navigate('/'), 600);
    } else {
      setError(res?.message || 'Invalid email or password.');
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (loginOtp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP received on your email');
      return;
    }

    if (loginOtp.trim() !== generatedOtp) {
      setError('Invalid OTP code. Please check your email inbox and try again.');
      return;
    }

    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res?.success) {
      setSuccess(true);
      setTimeout(() => navigate('/'), 600);
    } else {
      setError(res?.message || 'Login failed. Please check credentials.');
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

          {step === 'credentials' ? (
            <>
              <h2 className="text-2xl font-bold font-display text-slate-900 mb-1">Sign in</h2>
              <p className="text-sm text-slate-500 mb-6 font-poppins">Enter your credentials to access your dashboard.</p>

              {success && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-poppins flex items-center gap-2">
                  <RiShieldCheckLine size={16} /> Login successful. Redirecting...
                </div>
              )}

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-poppins">
                  {error}
                </div>
              )}

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
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">Password</label>
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
                      Checking credentials...
                    </span>
                  ) : (
                    <>Sign In <RiArrowRightLine size={18} /></>
                  )}
                </button>
              </form>

              {/* Demo Account Quick-Fill Card */}
              <div className="mt-5 p-3.5 rounded-xl bg-gold-50/80 border border-gold-200 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gold-700 font-poppins">Demo Credentials</p>
                  <p className="text-xs text-slate-700 font-poppins font-medium mt-0.5">
                    <span className="text-slate-500">Email:</span> william@horizoncap.com <br />
                    <span className="text-slate-500">Pass:</span> horizon123
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('william@horizoncap.com');
                    setPassword('horizon123');
                    setError('');
                  }}
                  className="btn btn-outline-gold text-xs px-3 py-1.5 rounded-lg flex-shrink-0 cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>

              <p className="text-center text-sm text-slate-500 mt-5 font-poppins">
                Don't have an account?{' '}
                <Link to="/register" className="text-gold-600 font-semibold hover:underline">Register</Link>
              </p>
            </>
          ) : (
            /* ──────── 2FA EMAIL OTP VERIFICATION SCREEN ──────── */
            <div className="space-y-5 animate-fade-in font-poppins">
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setError(''); }}
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
                      Code sent to <strong className="text-slate-800">{email}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {success && (
                <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-poppins flex items-center gap-2">
                  <RiShieldCheckLine size={16} /> 2FA Code Verified! Redirecting...
                </div>
              )}

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Simulated Email Notification Card for Testing */}
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-blue-900 flex items-center gap-1">
                    <RiMailLine size={14} className="text-blue-600" /> Incoming Login Security OTP:
                  </span>
                  <span className="text-blue-700 font-mono text-[10px]">{otpSentTime}</span>
                </div>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-blue-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Your 6-Digit Login Code</span>
                    <span className="text-lg font-black text-slate-900 font-mono tracking-widest">{generatedOtp}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLoginOtp(generatedOtp); setError(''); }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs cursor-pointer transition-colors"
                  >
                    Auto-Fill Code
                  </button>
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
                  disabled={loading}
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
                    onClick={send2FAOtp}
                    className="text-gold-700 hover:text-gold-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RiRefreshLine size={14} /> Resend Security OTP
                  </button>
                )}
              </div>
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
