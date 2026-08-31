import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import AdminRoutes from './routes/adminRoutes';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />

          {/* ADMIN */}
          <Route path="/admin/*" element={<AdminRoutes />} />

          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
    </BrowserRouter>
  );
}
