import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { countries } from '../data/userMockData';
import {
  RiUser3Line, RiMailLine, RiLockPasswordLine,
  RiPhoneLine, RiGlobalLine, RiTeamLine,
  RiArrowRightLine, RiEyeLine, RiEyeOffLine,
  RiShieldCheckLine, RiCheckLine,
} from 'react-icons/ri';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refFromUrl = searchParams.get('ref') || searchParams.get('sponsor') || '';

  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    phone: '', country: 'India', sponsorId: refFromUrl || '',
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

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password || !form.phone) {
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
    setError('');
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res?.success) {
      navigate('/');
    } else {
      setError(res?.message || 'Registration failed. Please try again.');
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
            Horizon Cap Worlds members earn daily profit from real solar power plants across four continents. Login to see your live dashboard.
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
          <p className="text-sm text-slate-500 mb-6 font-poppins">Register to start investing and earning. It takes under a minute.</p>

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
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">Full Name</label>
                <div className="relative">
                  <RiUser3Line size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Ada Lovelace" className="input input-icon-left" />
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
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">Mobile Number</label>
                  <div className="relative">
                    <RiPhoneLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91" className="input input-icon-left" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block font-poppins">Country</label>
                  <div className="relative">
                    <RiGlobalLine size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select name="country" value={form.country} onChange={handleChange} className="input input-icon-left appearance-none cursor-pointer">
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
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
              className="w-full btn btn-primary text-base py-3.5 rounded-xl font-bold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating Account...
                </span>
              ) : (
                <>Register <RiArrowRightLine size={18} /></>
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
            <span>256-bit transport · cold isolated · audited weekly</span>
          </div>
        </div>
      </div>
    </div>
  );
}
