import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { isStaffProfile } from '../../lib/adminData';
import { cn } from '../../lib/utils';
import { useAuth } from '../../providers/AuthProvider';

type AuthView = 'login' | 'register';

function sanitiseRedirectTarget(candidate: string | null | undefined) {
 if (!candidate || !candidate.startsWith('/')) {
 return '/customer/dashboard';
 }

 return candidate;
}

export default function Login() {
 const navigate = useNavigate();
 const location = useLocation();
 const [searchParams] = useSearchParams();
 const { user, profile, loading, authBusy, signInWithEmail, signUpWithEmail } = useAuth();

 const [view, setView] = useState<AuthView>('login');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [fullName, setFullName] = useState('');
 const [registerEmail, setRegisterEmail] = useState('');
 const [registerPhone, setRegisterPhone] = useState('');
 const [registerPassword, setRegisterPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [errorMessage, setErrorMessage] = useState('');
 const [successMessage, setSuccessMessage] = useState('');

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

 const passwordsMatch =
 registerPassword.trim().length > 0 && registerPassword === confirmPassword;
 const isLoginReady = email.trim().length > 0 && password.trim().length > 0;
 const isRegisterReady =
 fullName.trim().length > 0 &&
 registerEmail.trim().length > 0 &&
 registerPhone.trim().length > 0 &&
 registerPassword.trim().length > 0 &&
 confirmPassword.trim().length > 0 &&
 passwordsMatch;

 useEffect(() => {
 if (!loading && user) {
 navigate(isStaffProfile(profile) ? '/admin/login' : redirectTarget, { replace: true });
 }
 }, [loading, navigate, profile, redirectTarget, user]);

 const clearMessages = () => {
 setErrorMessage('');
 setSuccessMessage('');
 };

 const handleLogin = async () => {
 clearMessages();

 const result = await signInWithEmail({
 email,
 password,
 });

 if (!result.success) {
 setErrorMessage(result.message ?? 'Nao foi possivel entrar no portal.');
 return;
 }

 navigate(isStaffProfile(profile) ? '/admin/login' : redirectTarget, { replace: true });
 };

 const handleRegister = async () => {
 clearMessages();

 if (!passwordsMatch) {
 setErrorMessage('As palavras-passe precisam de coincidir.');
 return;
 }

 const result = await signUpWithEmail({
 fullName,
 email: registerEmail,
 phone: registerPhone,
 password: registerPassword,
 emailRedirectTo: `${window.location.origin}/login?redirect=${encodeURIComponent(redirectTarget)}`,
 });

 if (!result.success) {
 setErrorMessage(result.message ?? 'Nao foi possivel criar a conta agora.');
 return;
 }

 if (result.requiresEmailConfirmation) {
 setView('login');
 setSuccessMessage(
 result.message ??
 'Conta criada com sucesso. Verifique o seu email e depois entre no portal.'
 );
 setEmail(registerEmail);
 setPassword('');
 return;
 }

 navigate(redirectTarget, { replace: true });
 };

 return (
 <div className="min-h-screen bg-darker">
 <section className="relative overflow-hidden border-b border-white/10 py-24">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,71,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_28%)]" />
 <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_520px] lg:px-8">
 <motion.div
 initial={{ opacity: 0, y: 18 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="max-w-2xl self-center"
 >
 <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
 <ShieldCheck className="h-4 w-4" />
 Portal do Cliente
 </div>
 <h1 className="mb-6 font-display text-5xl font-bold leading-tight md:text-6xl">
 {view === 'login' ? (
 <>
 Entre com{' '}
 <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
 email
 </span>{' '}
 e acompanhe os seus servicos
 </>
 ) : (
 <>
 Crie a sua{' '}
 <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
 conta
 </span>{' '}
 no portal
 </>
 )}
 </h1>
 <p className="max-w-xl text-lg leading-relaxed text-gray-400">
 {view === 'login'
 ? 'A autenticacao do portal agora usa MySQL na Hostinger para sessoes reais, perfil do cliente e historico de agendamentos.'
 : 'Registe-se para guardar os seus dados, acompanhar agendamentos e consultar o historico da sua viatura.'}
 </p>
 <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-400">
 <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
 Agendamentos reais
 </span>
 <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
 Historico persistido
 </span>
 <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
 Sessao segura
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
 <button
 type="button"
 onClick={() => {
 clearMessages();
 setView('login');
 }}
 className={cn(
 'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
 view === 'login'
 ? 'bg-primary text-white shadow-[0_0_16px_rgba(0,71,255,0.25)]'
 : 'text-gray-400 hover:text-white'
 )}
 >
 <Mail className="h-4 w-4" />
 Entrar
 </button>
 <button
 type="button"
 onClick={() => {
 clearMessages();
 setView('register');
 }}
 className={cn(
 'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
 view === 'register'
 ? 'bg-primary text-white shadow-[0_0_16px_rgba(0,71,255,0.25)]'
 : 'text-gray-400 hover:text-white'
 )}
 >
 <UserPlus className="h-4 w-4" />
 Criar conta
 </button>
 </div>

 {errorMessage ? (
 <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
 {errorMessage}
 </div>
 ) : null}

 {successMessage ? (
 <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
 {successMessage}
 </div>
 ) : null}

 {view === 'login' ? (
 <div className="space-y-5">
 <div className="space-y-2">
 <label className="text-sm font-medium text-gray-300">Email</label>
 <input
 type="email"
 value={email}
 onChange={(event) => setEmail(event.target.value)}
 placeholder="o.seu@email.com"
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
 onClick={handleLogin}
 disabled={!isLoginReady || authBusy}
 className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
 >
 {authBusy ? 'A entrar...' : 'Entrar no portal'}
 <ArrowRight className="h-5 w-5" />
 </button>
 <p className="text-sm leading-relaxed text-gray-400">
 Nesta primeira integracao, o login real usa email e palavra-passe. O telefone
 continua guardado no perfil do cliente e nos agendamentos.
 </p>
 </div>
 ) : (
 <div className="space-y-5">
 <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4 text-sm text-gray-300">
 O telefone sera guardado no seu perfil e usado para contacto nos agendamentos.
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium text-gray-300">Nome completo</label>
 <input
 type="text"
 value={fullName}
 onChange={(event) => setFullName(event.target.value)}
 placeholder="O seu nome"
 className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
 />
 </div>
 <div className="grid gap-5 md:grid-cols-2">
 <div className="space-y-2">
 <label className="text-sm font-medium text-gray-300">Email</label>
 <input
 type="email"
 value={registerEmail}
 onChange={(event) => setRegisterEmail(event.target.value)}
 placeholder="o.seu@email.com"
 className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium text-gray-300">Telefone</label>
 <input
 type="tel"
 value={registerPhone}
 onChange={(event) => setRegisterPhone(event.target.value)}
 placeholder="+258 8X XX XX"
 className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
 />
 </div>
 </div>
 <div className="grid gap-5 md:grid-cols-2">
 <div className="space-y-2">
 <label className="text-sm font-medium text-gray-300">Palavra-passe</label>
 <input
 type="password"
 value={registerPassword}
 onChange={(event) => setRegisterPassword(event.target.value)}
 placeholder="Crie a sua palavra-passe"
 className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium text-gray-300">
 Confirmar palavra-passe
 </label>
 <input
 type="password"
 value={confirmPassword}
 onChange={(event) => setConfirmPassword(event.target.value)}
 placeholder="Repita a palavra-passe"
 className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
 />
 </div>
 </div>
 {confirmPassword.trim().length > 0 && !passwordsMatch ? (
 <p className="text-sm text-red-400">As palavras-passe precisam de coincidir.</p>
 ) : null}
 <button
 type="button"
 onClick={handleRegister}
 disabled={!isRegisterReady || authBusy}
 className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
 >
 {authBusy ? 'A criar conta...' : 'Criar conta'}
 <ArrowRight className="h-5 w-5" />
 </button>
 </div>
 )}

 <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-gray-400">
 O portal passa a usar sessao real via API PHP + MySQL da Hostinger, sem expor a base
 de dados no frontend.
 </div>

 <div className="mt-6 text-center text-sm text-gray-400">
 {view === 'login' ? 'Ainda nao tem conta? ' : 'Ja tem conta? '}
 <button
 type="button"
 onClick={() => {
 clearMessages();
 setView(view === 'login' ? 'register' : 'login');
 }}
 className="font-semibold text-primary transition-colors hover:text-white"
 >
 {view === 'login' ? 'Criar conta' : 'Entrar'}
 </button>
 </div>

 <div className="mt-4 text-center text-sm text-gray-400">
 Quer marcar um servico primeiro?{' '}
 <Link
 to="/booking"
 className="font-semibold text-primary transition-colors hover:text-white"
 >
 Agendar agora
 </Link>
 </div>
 </motion.div>
 </div>
 </section>
 </div>
 );
}
