import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from '../pages/Dashboard';
import InvestmentPlans from '../pages/InvestmentPlans';
import Users from '../pages/Users';
import Transactions from '../pages/Transactions';
import NewsMedia from '../pages/NewsMedia';
import Settings from '../pages/Settings';
import PaymentSettings from '../pages/PaymentSettings';
import Ranks from '../pages/Ranks';
import Referrals from '../pages/Referrals';
import SupportTickets from '../pages/SupportTickets';
import SupportChannels from '../pages/SupportChannels';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Layout from '../components/layout/Layout';


const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                 <Route index element={<Dashboard />} />
                 <Route path="investment-plans" element={<InvestmentPlans />} />
                 <Route path="users" element={<Users />} />
                 <Route path="ranks" element={<Ranks />} />
                 <Route path="referrals" element={<Referrals />} />
                 <Route path="transactions" element={<Transactions />} />
                 <Route path="support-tickets" element={<SupportTickets />} />
                 <Route path="support-channels" element={<SupportChannels />} />
                 <Route path="news-media" element={<NewsMedia />} />
                 <Route path="payment-settings" element={<PaymentSettings />} />
                 <Route path="settings" element={<Settings />} />
                 <Route path="*" element={<Navigate to="/admin" replace />} />

            </Route>
        </Routes>
    );
};

export default AdminRoutes;
