import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getMe, updateProfile } from '../api/authApi';
import { getDashboardOverview } from '../api/dashboardApi';

const AuthContext = createContext(null);

export function getReferralLink(userId) {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://horizoncapworlds.com';
  return `${origin}/register?ref=${userId || ''}`;
}

const formatApiUser = (rawUser, overviewData = null) => {
  if (!rawUser) return null;
  const customId = rawUser.customId || rawUser.id || '';
  
  return {
    _id: rawUser._id || rawUser.id,
    id: customId,
    customId,
    fullName: rawUser.name || rawUser.fullName || 'Investor',
    name: rawUser.name || rawUser.fullName || 'Investor',
    email: rawUser.email,
    phone: rawUser.phone || '',
    country: rawUser.country || 'United States',
    city: rawUser.city || '',
    address: rawUser.address || '',
    dob: rawUser.dob || '',
    timezone: rawUser.timezone || '',
    avatar: rawUser.avatar || '',
    sponsorId: rawUser.sponsorId || 'HORIZON-HQ',
    rank: {
      level: rawUser.rankLevel || rawUser.rank?.level || 1,
      name: rawUser.currentRank || rawUser.rank?.name || 'Bronze Explorer',
    },
    joinDate: rawUser.createdAt ? rawUser.createdAt.split('T')[0] : (rawUser.joinDate || new Date().toISOString().split('T')[0]),
    depositWallet: Number(rawUser.depositWallet || overviewData?.wallets?.depositWallet || 0),
    earningWallet: Number(rawUser.earningWallet || overviewData?.wallets?.earningWallet || 0),
    totalInvested: Number(rawUser.totalInvested || overviewData?.wallets?.totalInvested || 0),
    totalEarned: Number(rawUser.totalProfit || rawUser.totalEarned || overviewData?.wallets?.totalProfit || overviewData?.wallets?.totalEarned || 0),
    totalWithdrawn: Number(rawUser.totalWithdrawn || overviewData?.wallets?.totalWithdrawn || 0),
    activeInvestments: Number(overviewData?.portfolioSummary?.activeContracts || rawUser.activeInvestments || 0),
    totalReferrals: Number(rawUser.totalReferrals || overviewData?.network?.totalReferrals || 0),
    directReferrals: Number(rawUser.directReferrals || overviewData?.network?.directReferrals || 0),
    dailyEarning: Number(rawUser.dailyEarning || overviewData?.streaming?.dailyEarning || 0),
    perSecondRate: Number(rawUser.perSecondRate || overviewData?.streaming?.perSecondRate || 0),
    referralLink: getReferralLink(customId),
    is2FAEnabled: !!rawUser.is2FAEnabled,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('horizon_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) return parsed;
      } catch (e) {}
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('horizon_user_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('horizon_user_token'));
  const [loading, setLoading] = useState(true);

  // Synchronize user from backend when token is present
  const refreshUser = useCallback(async () => {
    const activeToken = localStorage.getItem('horizon_user_token');
    if (!activeToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await getDashboardOverview();
      if (res?.success && res.data) {
        const formatted = formatApiUser(res.data.user, res.data);
        setUser(formatted);
        localStorage.setItem('horizon_user', JSON.stringify(formatted));
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.warn('API refresh offline, using cached state:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    try {
      const res = await loginUser({ email, password });
      if (res?.success && res.token) {
        localStorage.setItem('horizon_user_token', res.token);
        setToken(res.token);
        const formatted = formatApiUser(res.user);
        setUser(formatted);
        localStorage.setItem('horizon_user', JSON.stringify(formatted));
        setIsAuthenticated(true);
        // Refresh with latest streaming stats
        await refreshUser();
        return { success: true, user: formatted };
      }
      return { success: false, message: res?.message || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Login failed. Please check credentials.',
      };
    }
  };

  const register = async (formData) => {
    try {
      const payload = {
        name: formData.fullName || formData.name,
        email: formData.email,
        phone: formData.phone || '',
        password: formData.password,
        country: formData.country || 'United States',
        sponsorId: formData.sponsorId || 'HORIZON-HQ',
      };
      const res = await registerUser(payload);
      if (res?.success && res.token) {
        localStorage.setItem('horizon_user_token', res.token);
        setToken(res.token);
        const formatted = formatApiUser(res.user);
        setUser(formatted);
        localStorage.setItem('horizon_user', JSON.stringify(formatted));
        setIsAuthenticated(true);
        return { success: true, user: formatted };
      }
      return { success: false, message: res?.message || 'Registration failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Registration failed.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken('');
    setIsAuthenticated(false);
    localStorage.removeItem('horizon_user');
    localStorage.removeItem('horizon_user_token');
    localStorage.removeItem('horizon_user_avatar');
    localStorage.removeItem('horizon_transactions');
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('horizon_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
