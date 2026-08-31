import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldLock, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import API from "../api/api";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Sirf ek loading state rakhi hai
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

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

      // Note: Make sure yeh route aapke backend route se exact match karta ho
      const response = await API.post('/admin/auth/login', {
        email,
        password
      });

      // FIX 1: Check for token instead of success
      if (response.data.token) {
        // Save token to localStorage
        localStorage.setItem('adminToken', response.data.token);

        // Save admin info
        localStorage.setItem('admin', JSON.stringify(response.data.admin));
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin));

        // Redirect to dashboard
        navigate('/admin');
      }
    } catch (err) {
      // Backend se aane wala error set hoga
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-muted)] p-4">
      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 sm:p-10 relative overflow-hidden">

        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-brand"></div>

        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
            <ShieldLock size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">HORIZON<span className="text-brand"> CAP WORLDS</span></h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Enter your credentials to access the dashboard</p>
        </div>

        {/* FIX 2: Error aur Success messages yahan show honge */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center font-medium">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-xl text-center font-medium">
            {success}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">

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
              <a href="#" className="text-xs font-bold text-brand hover:underline">Forgot password?</a>
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
          {/* FIX 3: Button mein ek hi 'loading' state use ki hai */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 bg-brand hover:bg-brand-dark text-gray-800 font-bold rounded-xl shadow-md shadow-brand/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-8"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>
      </div>

      {/* Footer Text */}
      <p className="text-xs font-medium text-slate-400 mt-8">
        Secure Admin Portal &copy; {new Date().getFullYear()} HORIZON CAP WORLDS. All rights reserved.
      </p>
    </div>
  );
};

export default Login;