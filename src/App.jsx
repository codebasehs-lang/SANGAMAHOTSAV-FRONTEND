import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import PublicLayout from '@/layouts/PublicLayout';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

import Home from '@/pages/public/Home';
import Registration from '@/pages/public/Registration';
import Feedback from '@/pages/public/Feedback';
import RegistrantLogin from '@/pages/public/RegistrantLogin';
import RegistrantDashboard from '@/pages/public/RegistrantDashboard';

import Login from '@/pages/admin/Login';
import Dashboard from '@/pages/admin/Dashboard';
import Registrations from '@/pages/admin/Registrations';
import RegistrationDetails from '@/pages/admin/RegistrationDetails';
import Children from '@/pages/admin/Children';
import Accommodation from '@/pages/admin/Accommodation';
import Hotels from '@/pages/admin/Hotels';
import SeminarHall from '@/pages/admin/SeminarHall';
import Donations from '@/pages/admin/Donations';
import SmsCampaigns from '@/pages/admin/SmsCampaigns';
import FeedbackList from '@/pages/admin/FeedbackList';
import Seva from '@/pages/admin/Seva';
import Attendance from '@/pages/admin/Attendance';
import RegistrationSettings from '@/pages/admin/RegistrationSettings';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // Swap the PWA manifest/theme-color so admins install a distinct "Admin Dashboard" app.
  useEffect(() => {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (manifestLink) {
      manifestLink.setAttribute('href', isAdmin ? '/admin-manifest.webmanifest' : '/manifest.webmanifest');
    }
    if (themeMeta) {
      themeMeta.setAttribute('content', isAdmin ? '#312e81' : '#047857');
    }
  }, [isAdmin]);

  return (
    <>
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/registrant/login" element={<RegistrantLogin />} />
        <Route path="/registrant/dashboard" element={<RegistrantDashboard />} />
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
        <Route path="children" element={<Children />} />
        <Route path="registrations/:id" element={<RegistrationDetails />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="accommodation" element={<Accommodation />} />
        <Route path="hotels" element={<Hotels />} />
        <Route path="seminar-hall" element={<SeminarHall />} />
        <Route path="donations" element={<Donations />} />
        <Route path="sms" element={<SmsCampaigns />} />
        <Route path="feedback" element={<FeedbackList />} />
        <Route path="seva" element={<Seva />} />
        <Route path="registration-settings" element={<RegistrationSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <PwaInstallPrompt isAdmin={isAdmin} />
    </>
  );
}
