import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import UserLayout from './components/layout/UserLayout';

// Auth pages
import Register from './pages/Register';
import Login from './pages/Login';

// Dashboard pages
import UserDashboard from './pages/UserDashboard';
import Plans from './pages/Plans';
import MyInvestments from './pages/MyInvestments';
import Transactions from './pages/Transactions';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Referrals from './pages/Referrals';
import ReferralPlans from './pages/ReferralPlans';
import Ranks from './pages/Ranks';
import Profile from './pages/Profile';
import Support from './pages/Support';
import NewsMedia from './pages/NewsMedia';
import NewsDetail from './pages/NewsDetail';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <UserLayout>{children}</UserLayout>;
}

function PublicRoute({ children }) {
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Protected dashboard routes */}
      <Route path="/" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
      <Route path="/investments" element={<ProtectedRoute><MyInvestments /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
      <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
      <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
      <Route path="/referral-plans" element={<ProtectedRoute><ReferralPlans /></ProtectedRoute>} />
      <Route path="/ranks" element={<ProtectedRoute><Ranks /></ProtectedRoute>} />
      <Route path="/news" element={<ProtectedRoute><NewsMedia /></ProtectedRoute>} />
      <Route path="/news/:id" element={<ProtectedRoute><NewsDetail /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
