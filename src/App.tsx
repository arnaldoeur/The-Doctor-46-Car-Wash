/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import ProtectedRoute from './components/ProtectedRoute';
import Seo from './lib/Seo';
import ScrollToTop from './lib/ScrollToTop';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Booking from './pages/public/Booking';
import Contact from './pages/public/Contact';
import Process from './pages/public/Process';
import Login from './pages/public/Login';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import POS from './pages/admin/POS';
import Queue from './pages/admin/Queue';
import Inventory from './pages/admin/Inventory';
import Agenda from './pages/admin/Agenda';
import Finance from './pages/admin/Finance';
import Billing from './pages/admin/Billing';
import Team from './pages/admin/Team';
import Settings from './pages/admin/Settings';
import History from './pages/admin/History';
import Repository from './pages/admin/Repository';
import Catalog from './pages/admin/Catalog';
import Documents from './pages/admin/Documents';
import AdminLogin from './pages/admin/AdminLogin';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerAppointmentsPage from './pages/customer/Appointments';
import CustomerHistoryPage from './pages/customer/History';
import CustomerLoyaltyPage from './pages/customer/Loyalty';
import CustomerProfilePage from './pages/customer/Profile';

export default function App() {
 useEffect(() => {
 if (typeof window === 'undefined') return;

 [
 'doctor46.business-documents.v1',
 'doctor46.catalog.services.v1',
 'doctor46.catalog.clients.v1',
 ].forEach((key) => window.localStorage.removeItem(key));
 }, []);

 return (
 <Router>
 <Seo />
 <ScrollToTop />
 <Routes>
 {/* Public Website */}
 <Route path="/" element={<PublicLayout />}>
 <Route index element={<Home />} />
 <Route path="about" element={<About />} />
 <Route path="processo" element={<Process />} />
 <Route path="services" element={<Services />} />
 <Route path="booking" element={<Booking />} />
 <Route path="contactos" element={<Contact />} />
 <Route path="login" element={<Login />} />
 </Route>

 {/* Admin / ERP */}
 <Route path="/admin/login" element={<AdminLogin />} />
 <Route
 path="/admin"
 element={
 <AdminProtectedRoute>
 <AdminLayout />
 </AdminProtectedRoute>
 }
 >
 <Route index element={<Navigate to="/admin/dashboard" replace />} />
 <Route path="dashboard" element={<Dashboard />} />
 <Route path="pos" element={<POS />} />
 <Route path="queue" element={<Queue />} />
 <Route path="inventory" element={<Inventory />} />
 <Route path="agenda" element={<Agenda />} />
 <Route path="finance" element={<Finance />} />
 <Route path="billing" element={<Billing />} />
 <Route path="catalog" element={<Catalog />} />
 <Route path="documents" element={<Documents />} />
 <Route path="team" element={<Team />} />
 <Route path="settings" element={<Settings />} />
 <Route path="history" element={<History />} />
 <Route path="repository" element={<Repository />} />
 </Route>

 {/* Customer Portal */}
 <Route
 path="/customer"
 element={
 <ProtectedRoute>
 <CustomerLayout />
 </ProtectedRoute>
 }
 >
 <Route index element={<Navigate to="/customer/dashboard" replace />} />
 <Route path="dashboard" element={<CustomerDashboard />} />
 <Route path="profile" element={<CustomerProfilePage />} />
 <Route path="appointments" element={<CustomerAppointmentsPage />} />
 <Route path="history" element={<CustomerHistoryPage />} />
 <Route path="loyalty" element={<CustomerLoyaltyPage />} />
 </Route>

 {/* Catch All */}
 <Route path="*" element={<Navigate to="/" replace />} />
 </Routes>
 </Router>
 );
}
