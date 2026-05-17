import { format } from 'date-fns';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import ProfileDetailsForm from '../../components/profile/ProfileDetailsForm';
import ProfileOverviewCard from '../../components/profile/ProfileOverviewCard';
import ProfileSupportCard from '../../components/profile/ProfileSupportCard';
import type { AuthUserRecord, ProfileRow } from '../../lib/customerPortal';
import { useAuth } from '../../providers/AuthProvider';

function getInitialName(profile: ProfileRow | null, user: AuthUserRecord | null) {
 const profileName = profile?.full_name?.trim();

 if (profileName) {
 return profileName;
 }

 const metadataName =
 typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';

 if (metadataName) {
 return metadataName;
 }

 return user?.email?.split('@')[0] ?? '';
}

function getInitialPhone(profile: ProfileRow | null, user: AuthUserRecord | null) {
 const profilePhone = profile?.phone?.trim();

 if (profilePhone) {
 return profilePhone;
 }

 return typeof user?.user_metadata?.phone === 'string' ? user.user_metadata.phone.trim() : '';
}

export default function CustomerProfilePage() {
 const { user, profile, loading, saveProfile } = useAuth();
 const [fullName, setFullName] = useState('');
 const [phone, setPhone] = useState('');
 const [saving, setSaving] = useState(false);
 const [errorMessage, setErrorMessage] = useState('');
 const [successMessage, setSuccessMessage] = useState('');

 const initialName = useMemo(() => getInitialName(profile, user), [profile, user]);
 const initialPhone = useMemo(() => getInitialPhone(profile, user), [profile, user]);
 const accountEmail = user?.email?.trim() || profile?.email?.trim() || 'Sem email associado';
 const memberSince = profile?.created_at
 ? format(new Date(profile.created_at), 'dd MM yy')
 : 'Conta recente';

 useEffect(() => {
 setFullName(initialName);
 setPhone(initialPhone);
 }, [initialName, initialPhone]);

 const completionPercent = useMemo(() => {
 const filledFields = [fullName.trim(), accountEmail.trim(), phone.trim()].filter(Boolean).length;
 return Math.round((filledFields / 3) * 100);
 }, [accountEmail, fullName, phone]);

 const hasChanges = fullName.trim() !== initialName || phone.trim() !== initialPhone;

 const clearMessages = () => {
 setErrorMessage('');
 setSuccessMessage('');
 };

 const handleReset = () => {
 setFullName(initialName);
 setPhone(initialPhone);
 clearMessages();
 };

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 clearMessages();

 if (!user) {
 setErrorMessage('Nao foi possivel identificar a sua sessao. Entre novamente no portal.');
 return;
 }

 const nextFullName = fullName.trim();

 if (!nextFullName) {
 setErrorMessage('Introduza o seu nome completo antes de guardar.');
 return;
 }

 setSaving(true);

 try {
 const nextProfile = await saveProfile({
 fullName: nextFullName,
 email: user.email ?? undefined,
 phone: phone.trim(),
 });

 if (!nextProfile) {
 setErrorMessage('Nao foi possivel atualizar o seu perfil agora.');
 return;
 }

 setSuccessMessage('Perfil atualizado com sucesso.');
 } catch (error) {
 console.error('Failed to save customer profile', error);
 setErrorMessage('Nao foi possivel guardar as alteracoes neste momento.');
 } finally {
 setSaving(false);
 }
 };

 return (
 <div className="space-y-8">
 <div>
 <h1 className="mb-2 font-display text-3xl font-bold">Meu Perfil</h1>
 <p className="text-gray-400">
 Adicione e edite os seus detalhes principais para manter o portal do cliente sempre atualizado.
 </p>
 </div>

 <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.15fr]">
 <ProfileOverviewCard
 displayName={fullName.trim() || initialName || 'Cliente'}
 email={accountEmail}
 phone={phone.trim() || null}
 memberSince={memberSince}
 completionPercent={completionPercent}
 />

 <ProfileDetailsForm
 fullName={fullName}
 email={accountEmail}
 phone={phone}
 loading={loading}
 saving={saving}
 hasChanges={hasChanges}
 errorMessage={errorMessage}
 successMessage={successMessage}
 onFullNameChange={(value) => {
 clearMessages();
 setFullName(value);
 }}
 onPhoneChange={(value) => {
 clearMessages();
 setPhone(value);
 }}
 onReset={handleReset}
 onSubmit={handleSubmit}
 />
 </div>

 <ProfileSupportCard
 hasFullName={fullName.trim().length > 0}
 hasPhone={phone.trim().length > 0}
 />
 </div>
 );
}
