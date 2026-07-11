import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from '@/layouts/PublicLayout';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

import Home from '@/pages/public/Home';
import Registration from '@/pages/public/Registration';
import Feedback from '@/pages/public/Feedback';

import Login from '@/pages/admin/Login';
import Dashboard from '@/pages/admin/Dashboard';
import Registrations from '@/pages/admin/Registrations';
import RegistrationDetails from '@/pages/admin/RegistrationDetails';
import Accommodation from '@/pages/admin/Accommodation';
import Hotels from '@/pages/admin/Hotels';
import SeminarHall from '@/pages/admin/SeminarHall';
import SmsCampaigns from '@/pages/admin/SmsCampaigns';
import FeedbackList from '@/pages/admin/FeedbackList';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/feedback" element={<Feedback />} />
      </Route>

      {/* Admin auth */}
      <Route path="/admin/login" element={<Login />} />

      {/* Admin protected */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="registrations/:id" element={<RegistrationDetails />} />
        <Route path="accommodation" element={<Accommodation />} />
        <Route path="hotels" element={<Hotels />} />
        <Route path="seminar-hall" element={<SeminarHall />} />
        <Route path="sms" element={<SmsCampaigns />} />
        <Route path="feedback" element={<FeedbackList />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
