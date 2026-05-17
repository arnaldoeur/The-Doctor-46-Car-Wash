import { Link } from 'react-router-dom';

type DashboardActionsProps = {
 phone: string | null | undefined;
};

export default function DashboardActions({ phone }: DashboardActionsProps) {
 return (
 <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-dark p-6">
 <Link
 to="/booking"
 className="w-full rounded-xl bg-primary py-4 text-center font-bold text-white transition-all shadow-[0_0_20px_rgba(0,71,255,0.2)] hover:bg-primary-hover"
 >
 Novo Agendamento
 </Link>

 <Link
 to="/customer/appointments"
 className="w-full rounded-xl border border-white/10 bg-white/5 py-4 text-center font-semibold text-white transition-all hover:bg-white/10"
 >
 Ver agendamentos
 </Link>

 <Link
 to="/customer/profile"
 className="w-full rounded-xl border border-white/10 bg-white/5 py-4 text-center font-semibold text-white transition-all hover:bg-white/10"
 >
 Editar perfil
 </Link>

 <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-gray-400">
 {phone ? (
 <>
 <p className="font-semibold text-white">Telefone no perfil</p>
 <p className="mt-1">{phone}</p>
 <p className="mt-2 text-xs text-gray-500">Atualize os seus dados em Meu Perfil.</p>
 </>
 ) : (
 <>
 <p className="font-semibold text-white">Perfil sincronizado</p>
 <p className="mt-1">
 Adicione o telefone em Meu Perfil para facilitar os proximos contactos.
 </p>
 </>
 )}
 </div>
 </div>
 );
}
