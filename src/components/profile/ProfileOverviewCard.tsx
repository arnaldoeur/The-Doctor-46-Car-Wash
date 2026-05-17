import { Calendar, Mail, Phone, User } from 'lucide-react';

type ProfileOverviewCardProps = {
 displayName: string;
 email: string;
 phone: string | null;
 memberSince: string;
 completionPercent: number;
};

type DetailItem = {
 label: string;
 value: string;
 icon: typeof User;
};

export default function ProfileOverviewCard({
 displayName,
 email,
 phone,
 memberSince,
 completionPercent,
}: ProfileOverviewCardProps) {
 const details: DetailItem[] = [
 {
 label: 'Nome do cliente',
 value: displayName,
 icon: User,
 },
 {
 label: 'Email de acesso',
 value: email,
 icon: Mail,
 },
 {
 label: 'Telefone',
 value: phone || 'Ainda nao adicionado',
 icon: Phone,
 },
 {
 label: 'Cliente desde',
 value: memberSince,
 icon: Calendar,
 },
 ];

 return (
 <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 to-dark p-8">
 <div className="flex flex-col gap-6">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
 Perfil do Cliente
 </p>
 <h2 className="mt-3 font-display text-3xl font-bold text-white">{displayName}</h2>
 <p className="mt-2 max-w-md text-sm text-gray-400">
 Mantenha os seus dados atualizados para acelerar agendamentos e facilitar o contacto.
 </p>
 </div>

 <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
 <p className="text-3xl font-bold text-white">{completionPercent}%</p>
 <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
 Perfil completo
 </p>
 </div>
 </div>

 <div>
 <div className="mb-2 flex items-center justify-between text-sm text-gray-400">
 <span>Detalhes preenchidos</span>
 <span>{completionPercent}%</span>
 </div>
 <div className="h-2 w-full overflow-hidden rounded-full border border-white/5 bg-darker">
 <div
 className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400"
 style={{ width: `${completionPercent}%` }}
 />
 </div>
 </div>

 <div className="grid gap-4 sm:grid-cols-2">
 {details.map((detail) => (
 <div
 key={detail.label}
 className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
 >
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
 <detail.icon className="h-4 w-4" />
 </div>
 <div>
 <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{detail.label}</p>
 <p className="mt-1 text-sm font-medium text-white">{detail.value}</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
