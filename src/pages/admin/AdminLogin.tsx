import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { isStaffProfile } from '../../lib/adminData';
import { cn } from '../../lib/utils';
import { useAuth } from '../../providers/AuthProvider';

function sanitiseRedirectTarget(candidate: string | null | undefined) {
  if (!candidate || !candidate.startsWith('/admin')) {
    return '/admin/dashboard';
  }

  return candidate;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, profile, loading, authBusy, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const redirectTarget = useMemo(() => {
    const queryTarget = searchParams.get('redirect');
    const stateTarget =
      typeof location.state === 'object' &&
      location.state !== null &&
      'from' in location.state &&
      typeof (location.state as { from?: { pathname?: string; search?: string } }).from?.pathname ===
        'string'
        ? `${(location.state as { from: { pathname: string; search?: string } }).from.pathname}${
            (location.state as { from: { pathname: string; search?: string } }).from.search ?? ''
          }`
        : null;

    return sanitiseRedirectTarget(queryTarget ?? stateTarget);
  }, [location.state, searchParams]);

  useEffect(() => {
    if (!loading && user && profile) {
      if (isStaffProfile(profile)) {
        navigate(redirectTarget, { replace: true });
        return;
      }

      navigate('/customer/dashboard', { replace: true });
    }
  }, [loading, navigate, profile, redirectTarget, user]);

  const isReady = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    setErrorMessage('');

    const result = await signInWithEmail({
      email,
      password,
    });

    if (!result.success) {
      setErrorMessage(result.message ?? 'Nao foi possivel entrar na area administrativa.');
    }
  };

  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('senhaSegura123!');
  };

  return (
    <div className="min-h-screen bg-darker">
      <section className="relative overflow-hidden border-b border-white/10 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,71,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_520px] lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl self-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              Login Administrativo
            </div>
            <h1 className="mb-6 font-display text-5xl font-bold leading-tight md:text-6xl">
              Acesso restrito a{' '}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                staff e super admin
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-gray-400">
              Esta area nao tem registo publico. Contas administrativas so podem ser preparadas pelo
              super admin.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Portal separado do cliente
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Acesso restrito
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Criacao de admins so pelo super admin
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="rounded-[2rem] border border-white/10 bg-dark p-8 shadow-2xl md:p-10"
          >
            <div className="mb-6 flex rounded-2xl border border-white/10 bg-darker p-1.5">
              <div
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold',
                  'bg-primary text-white shadow-[0_0_16px_rgba(0,71,255,0.25)]'
                )}
              >
                <LockKeyhole className="h-4 w-4" />
                Staff Login
              </div>
            </div>

            {/* Dicas de Demonstração / Dev Local */}
            <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 backdrop-blur-sm shadow-inner">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-4 w-4" />
                <span>Preenchimento Rápido (Demonstração)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('geral@carwash46.com')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-darker/80 px-3 py-2.5 text-xs font-semibold text-gray-200 transition-all hover:bg-white/10 hover:border-primary/50"
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@carwash46.com')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-darker/80 px-3 py-2.5 text-xs font-semibold text-gray-200 transition-all hover:bg-white/10 hover:border-primary/50"
                >
                  Staff Admin
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email administrativo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@empresa.com"
                  className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Palavra-passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Introduza a sua palavra-passe"
                  className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleLogin()}
                disabled={!isReady || authBusy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {authBusy ? 'A entrar...' : 'Entrar na area administrativa'}
                <ArrowRight className="h-5 w-5" />
              </button>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-gray-400">
                Se esta conta nao for de staff, o acesso ao admin nao sera concedido.
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-400">
              E cliente?{' '}
              <Link to="/login" className="font-semibold text-primary transition-colors hover:text-white">
                Entrar no portal do cliente
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
