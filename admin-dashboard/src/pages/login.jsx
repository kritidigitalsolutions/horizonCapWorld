import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldLock, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import API from "../api/api";
import { forgotPasswordSendOtp, forgotPasswordVerifyOtp, forgotPasswordReset } from "../api/authApi";

const Login = () => {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-muted)] p-4">
      {/* Login / Forgot Password Card */}
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 sm:p-10 relative overflow-hidden">

        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-brand"></div>

        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
            {mode === 'login' ? (
              <ShieldLock size={32} strokeWidth={2.5} />
            ) : (
              <KeyRound size={32} strokeWidth={2.5} />
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            HORIZON<span className="text-brand"> CAP WORLDS</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            {mode === 'login'
              ? 'Enter your credentials to access the dashboard'
              : 'Super Admin Password Recovery Portal'}
          </p>
        </div>

        {/* Error and Success alerts */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-semibold">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl text-center font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ──────── MODE 1: LOGIN FORM ──────── */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="username"
                  placeholder="admin@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-muted)] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50 transition-all placeholder:text-slate-400 font-medium text-slate-700"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotStep(1);
                    setError('');
                    setSuccess('');
                    setForgotEmail(formData.email || '');
                  }}
                  className="text-xs font-bold text-brand hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-[var(--bg-muted)] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50 transition-all placeholder:text-slate-400 font-medium text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 bg-brand hover:bg-brand-dark text-gray-900 font-bold rounded-xl shadow-md shadow-brand/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-6 cursor-pointer"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        ) : (
          /* ──────── MODE 2: FORGOT PASSWORD RECOVERY FLOW ──────── */
          <div className="space-y-5 animate-fade-in">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccess('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-1"
            >
              <ArrowLeft size={15} /> Back to Sign In
            </button>

            {/* Step Indicator */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-500">
              <span className={forgotStep >= 1 ? "text-brand" : ""}>1. Email</span>
              <span>&rarr;</span>
              <span className={forgotStep >= 2 ? "text-brand" : ""}>2. 6-Digit OTP</span>
              <span>&rarr;</span>
              <span className={forgotStep >= 3 ? "text-brand" : ""}>3. New Password</span>
            </div>

            {/* STEP 1: ENTER EMAIL */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendForgotOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1">Registered Super Admin Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@horizoncap.com"
                      className="w-full pl-11 pr-4 py-3 bg-[var(--bg-muted)] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50 transition-all font-medium text-slate-700"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 ml-1">
                    A 6-digit recovery code will be dispatched to this address via Gmail SMTP.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !forgotEmail.trim()}
                  className="w-full flex items-center justify-center py-3.5 px-4 bg-brand hover:bg-brand-dark text-gray-900 font-bold rounded-xl shadow-md transition-all disabled:opacity-70 cursor-pointer"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Send Recovery OTP'}
                </button>
              </form>
            )}

            {/* STEP 2: ENTER OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    Enter 6-Digit Code Sent to {forgotEmail}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••••"
                    className="w-full py-3 px-4 text-center font-mono text-2xl font-black tracking-[0.5em] bg-[var(--bg-muted)] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50 transition-all text-slate-800"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || forgotOtp.length !== 6}
                  className="w-full flex items-center justify-center py-3.5 px-4 bg-brand hover:bg-brand-dark text-gray-900 font-bold rounded-xl shadow-md transition-all disabled:opacity-70 cursor-pointer"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Verify Code'}
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Didn't receive code?</span>
                  {countdown > 0 ? (
                    <span className="font-mono font-semibold text-slate-400">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendForgotOtp}
                      className="text-brand font-bold hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* STEP 3: CHOOSE NEW PASSWORD */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-11 pr-12 py-3 bg-[var(--bg-muted)] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50 transition-all font-medium text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-11 pr-12 py-3 bg-[var(--bg-muted)] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50 transition-all font-medium text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full flex items-center justify-center py-3.5 px-4 bg-brand hover:bg-brand-dark text-gray-900 font-bold rounded-xl shadow-md transition-all disabled:opacity-70 cursor-pointer"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Reset Password & Proceed'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer Text */}
      <p className="text-xs font-medium text-slate-400 mt-8">
        Secure Admin Portal &copy; {new Date().getFullYear()} HORIZON CAP WORLDS. All rights reserved.
      </p>
    </div>
  );
};

export default Login;