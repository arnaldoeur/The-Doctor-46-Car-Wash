import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

type ProfileSupportCardProps = {
 hasPhone: boolean;
 hasFullName: boolean;
};

export default function ProfileSupportCard({
 hasPhone,
 hasFullName,
}: ProfileSupportCardProps) {
 return (
 <div className="rounded-3xl border border-white/10 bg-dark p-8">
 <div className="flex items-start gap-4">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
 <ShieldCheck className="h-5 w-5" />
 </div>
 <div>
 <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
 Perfil bem gerido
 </p>
 <h3 className="mt-2 font-display text-2xl font-bold text-white">
 Mantenha os seus dados prontos
 </h3>
 <p className="mt-2 max-w-2xl text-sm text-gray-400">
 Nome e telefone corretos ajudam a confirmar mais rapido cada servico e evitam falhas no contacto.
 </p>
 </div>
 </div>

 <div className="mt-6 grid gap-4 md:grid-cols-3">
 <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
 <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Nome</p>
 <p className="mt-2 text-sm font-medium text-white">
 {hasFullName ? 'Detalhe preenchido' : 'Adicione o seu nome completo'}
 </p>
 </div>
 <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
 <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Telefone</p>
 <p className="mt-2 text-sm font-medium text-white">
 {hasPhone ? 'Pronto para contacto' : 'Adicione um numero principal'}
 </p>
 </div>
 <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
 <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Proximo passo</p>
 <p className="mt-2 text-sm font-medium text-white">
 Perfil atualizado e pronto para novo agendamento
 </p>
 </div>
 </div>

 <div className="mt-6 flex flex-col gap-3 sm:flex-row">
 <Link
 to="/booking"
 className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-4 font-bold text-white transition-all hover:bg-primary-hover"
 >
 Novo agendamento
 </Link>
 <Link
 to="/customer/appointments"
 className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition-all hover:bg-white/10"
 >
 Ver agendamentos
 </Link>
 </div>
 </div>
 );
}
