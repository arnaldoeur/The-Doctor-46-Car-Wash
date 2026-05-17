import type { FormEvent } from 'react';

type ProfileDetailsFormProps = {
 fullName: string;
 email: string;
 phone: string;
 loading: boolean;
 saving: boolean;
 hasChanges: boolean;
 errorMessage: string;
 successMessage: string;
 onFullNameChange: (value: string) => void;
 onPhoneChange: (value: string) => void;
 onReset: () => void;
 onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ProfileDetailsForm({
 fullName,
 email,
 phone,
 loading,
 saving,
 hasChanges,
 errorMessage,
 successMessage,
 onFullNameChange,
 onPhoneChange,
 onReset,
 onSubmit,
}: ProfileDetailsFormProps) {
 return (
 <form
 onSubmit={onSubmit}
 className="rounded-3xl border border-white/10 bg-dark p-8"
 >
 <div className="flex flex-col gap-2">
 <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
 Editar detalhes
 </p>
 <h2 className="font-display text-3xl font-bold text-white">Os seus dados</h2>
 <p className="text-sm text-gray-400">
 Atualize as informacoes principais usadas no portal e nos proximos contactos.
 </p>
 </div>

 {errorMessage ? (
 <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
 {errorMessage}
 </div>
 ) : null}

 {successMessage ? (
 <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
 {successMessage}
 </div>
 ) : null}

 <div className="mt-6 space-y-5">
 <div className="space-y-2">
 <label htmlFor="profile-full-name" className="text-sm font-medium text-gray-300">
 Nome completo
 </label>
 <input
 id="profile-full-name"
 type="text"
 value={fullName}
 onChange={(event) => onFullNameChange(event.target.value)}
 placeholder="O seu nome completo"
 className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
 />
 </div>

 <div className="space-y-2">
 <label htmlFor="profile-email" className="text-sm font-medium text-gray-300">
 Email de acesso
 </label>
 <input
 id="profile-email"
 type="email"
 value={email}
 readOnly
 disabled
 className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-gray-400"
 />
 <p className="text-xs text-gray-500">
 Este email identifica a sua conta no portal nesta versao.
 </p>
 </div>

 <div className="space-y-2">
 <label htmlFor="profile-phone" className="text-sm font-medium text-gray-300">
 Telefone
 </label>
 <input
 id="profile-phone"
 type="tel"
 value={phone}
 onChange={(event) => onPhoneChange(event.target.value)}
 placeholder="+258 8X XX XX"
 className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white transition-colors focus:border-primary focus:outline-none"
 />
 <p className="text-xs text-gray-500">
 Use o numero principal para confirmacoes de agendamento e acompanhamento.
 </p>
 </div>
 </div>

 <div className="mt-8 flex flex-col gap-3 sm:flex-row">
 <button
 type="submit"
 disabled={loading || saving || !hasChanges}
 className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-4 font-bold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
 >
 {saving ? 'A guardar...' : 'Guardar alteracoes'}
 </button>

 <button
 type="button"
 onClick={onReset}
 disabled={loading || saving || !hasChanges}
 className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
 >
 Repor dados
 </button>
 </div>
 </form>
 );
}
