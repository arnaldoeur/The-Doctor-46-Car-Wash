import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isStaffProfile } from '../lib/adminData';
import { useAuth } from '../providers/AuthProvider';

export default function AdminProtectedRoute({ children }: { children: ReactNode }) {
 const { loading, user, profile } = useAuth();
 const location = useLocation();

 if (loading) {
 return (
 <div className="flex min-h-screen items-center justify-center bg-darker px-6">
 <div className="rounded-3xl border border-white/10 bg-dark px-8 py-6 text-center shadow-2xl">
 <p className="text-sm uppercase tracking-[0.24em] text-primary">Area administrativa</p>
 <h1 className="mt-3 font-display text-2xl font-bold text-white">
 A validar o acesso...
 </h1>
 </div>
 </div>
 );
 }

 if (!user) {
 const redirectTarget = encodeURIComponent(`${location.pathname}${location.search}`);
 return <Navigate to={`/admin/login?redirect=${redirectTarget}`} replace state={{ from: location }} />;
 }

 if (!isStaffProfile(profile)) {
 return <Navigate to="/customer/dashboard" replace />;
 }

 return <>{children}</>;
}
