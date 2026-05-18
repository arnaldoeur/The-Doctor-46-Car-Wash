import React, { useEffect, useState, type ReactNode } from 'react';
import { Mail, Phone, Shield, UserCog, X, Edit2, Loader2, Trash2 } from 'lucide-react';
import {
  createStaffProfile,
  fetchStaffProfiles,
  getProfileDisplayName,
  isSuperAdminProfile,
  saveStaffProfile,
  deleteStaffProfile,
} from '../../lib/adminData';
import type { ProfileRow } from '../../lib/customerPortal';
import { useAuth } from '../../providers/AuthProvider';
import { useLanguage } from '../../providers/LanguageProvider';

type StaffDraft = {
  id: string;
  full_name: string;
  role: string;
  job_title: string;
  phone: string;
  email: string;
  status: ProfileRow['status'];
};

export default function Team() {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const [creator, setCreator] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'admin',
    jobTitle: '',
  });
  const [team, setTeam] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffDraft | null>(null);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const loadTeam = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const nextTeam = await fetchStaffProfiles();
      setTeam(nextTeam);
    } catch (error) {
      console.error('Failed to load staff profiles', error);
      setErrorMessage(t('admin.team.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTeam();
  }, []);

  const activeMembers = team.filter((member) => member.status === 'active').length;
  const isViewerSuperAdmin = isSuperAdminProfile(profile);

  const openEditor = (member: ProfileRow) => {
    setEditingMember({
      id: member.id,
      full_name: member.full_name ?? '',
      role: member.role,
      job_title: member.job_title ?? '',
      phone: member.phone ?? '',
      email: member.email ?? '',
      status: member.status,
    });
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o membro da equipe "${name}"?`)) {
      return;
    }
    try {
      setSaving(true);
      setMessage('');
      setErrorMessage('');
      await deleteStaffProfile(id);
      await loadTeam();
      setMessage(`Membro "${name}" removido com sucesso.`);
    } catch (err) {
      console.error('Failed to delete staff member', err);
      setErrorMessage('Erro ao remover membro da equipe.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!editingMember?.full_name.trim()) errors.full_name = t('validation.required');
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!editingMember) {
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      setErrorMessage('');

      await saveStaffProfile({
        id: editingMember.id,
        full_name: editingMember.full_name.trim(),
        role: editingMember.role.trim(),
        job_title: editingMember.job_title.trim() || null,
        phone: editingMember.phone.trim() || null,
        status: editingMember.status,
      });

      await loadTeam();
      setEditingMember(null);
      setMessage(t('admin.team.success_save'));
    } catch (error) {
      console.error('Failed to update staff profile', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('admin.team.error_save')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!creator.fullName.trim()) errors.fullName = t('validation.required');
    if (!creator.email.trim()) errors.email = t('validation.required');
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(creator.email)) errors.email = t('validation.email');
    if (!creator.password) errors.password = t('validation.required');
    else if (creator.password.length < 6) errors.password = t('validation.password_min');
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSaving(true);
      setMessage('');
      setErrorMessage('');

      await createStaffProfile({
        email: creator.email.trim(),
        password: creator.password,
        fullName: creator.fullName.trim(),
        role: creator.role,
        jobTitle: creator.jobTitle.trim(),
        phone: '',
      });

      setCreator({
        fullName: '',
        email: '',
        password: '',
        role: 'admin',
        jobTitle: '',
      });
      await loadTeam();
      setMessage(t('admin.team.success_create'));
    } catch (error) {
      console.error('Failed to create admin user', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t('admin.team.error_create')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold font-display">{t('admin.team.title')}</h1>
          <p className="text-gray-400">
            {t('admin.team.sub')}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {activeMembers} {t('admin.team.badge_active')}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-gray-300">
        {t('admin.team.notice')}
      </div>

      {isViewerSuperAdmin ? (
        <div className="rounded-3xl border border-primary/20 bg-primary/10 p-6">
          <h2 className="mb-2 text-xl font-bold font-display text-white">{t('admin.team.create_title')}</h2>
          <p className="mb-5 text-sm text-gray-300">
            {t('admin.team.create_sub')}
          </p>
          <form onSubmit={handleCreateAdmin} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t('admin.team.field_name')} error={createErrors.fullName}>
              <input
                value={creator.fullName}
                onChange={(event) => { setCreator((c) => ({ ...c, fullName: event.target.value })); setCreateErrors((e) => ({ ...e, fullName: '' })); }}
                className={`w-full rounded-xl border bg-dark px-4 py-3 text-white focus:outline-none focus:border-primary ${createErrors.fullName ? 'border-red-500' : 'border-white/10'}`}
              />
            </Field>
            <Field label={t('admin.team.field_email')} error={createErrors.email}>
              <input
                type="email"
                value={creator.email}
                onChange={(event) => { setCreator((c) => ({ ...c, email: event.target.value })); setCreateErrors((e) => ({ ...e, email: '' })); }}
                className={`w-full rounded-xl border bg-dark px-4 py-3 text-white focus:outline-none focus:border-primary ${createErrors.email ? 'border-red-500' : 'border-white/10'}`}
              />
            </Field>
            <Field label={t('admin.team.field_password')} error={createErrors.password}>
              <input
                type="password"
                value={creator.password}
                onChange={(event) => { setCreator((c) => ({ ...c, password: event.target.value })); setCreateErrors((e) => ({ ...e, password: '' })); }}
                className={`w-full rounded-xl border bg-dark px-4 py-3 text-white focus:outline-none focus:border-primary ${createErrors.password ? 'border-red-500' : 'border-white/10'}`}
              />
            </Field>
            <Field label={t('admin.team.field_access')}>
              <select
                value={creator.role}
                onChange={(event) => setCreator((current) => ({ ...current, role: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
              >
                <option value="admin">{t('role.admin')}</option>
                <option value="manager">{t('role.manager')}</option>
                <option value="reception">{t('role.reception')}</option>
                <option value="operational">{t('role.operational')}</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label={t('admin.team.field_job')}>
                <input
                  value={creator.jobTitle}
                  onChange={(event) => setCreator((current) => ({ ...current, jobTitle: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-primary px-5 py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? t('admin.team.btn_creating') : t('admin.team.btn_create')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          {t('admin.team.super_admin_only')}
        </div>
      )}

      {message ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {team.map((member) => (
            <div
              key={member.id}
              className="group relative rounded-3xl border border-white/10 bg-dark p-6 transition-colors hover:border-primary/30"
            >
              {isViewerSuperAdmin ? (
                <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 z-10">
                  <button
                    type="button"
                    onClick={() => openEditor(member)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    title={t('admin.team.edit_title')}
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteMember(member.id, member.full_name ?? member.email ?? '')}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    title={t('admin.team.delete_title', 'Remover Membro')}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ) : null}

              <div className="mb-6 flex flex-col items-center text-center">
                <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-darker bg-primary/10 text-2xl font-bold text-primary shadow-lg">
                  {getProfileDisplayName(member)
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? '')
                    .join('')}
                  <div
                    className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-dark ${
                      member.status === 'active'
                        ? 'bg-emerald-500'
                        : member.status === 'vacation'
                        ? 'bg-amber-500'
                        : 'bg-gray-500'
                    }`}
                  />
                </div>
                <h3 className="text-xl font-bold font-display text-white">{getProfileDisplayName(member)}</h3>
                <p className="text-sm font-medium text-primary">{member.job_title ?? t('admin.team.field_job_empty')}</p>
                <div className="mt-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-300">
                    {t(`role.${member.role}`, member.role)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {member.phone || t('admin.team.field_phone_empty')}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Mail className="h-4 w-4 text-gray-500" />
                  {member.email || t('admin.team.field_email_empty')}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Shield className="h-4 w-4 text-primary" />
                  {t('admin.team.field_status')}: {t(`status.${member.status}`, member.status)}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <UserCog className="h-4 w-4 text-gray-500" />
                  {t('admin.team.field_last_login')}: {member.last_login_at ? new Date(member.last_login_at).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US') : t('admin.team.field_last_login_empty')}
                </div>
              </div>
            </div>
          ))}

          {team.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-10 text-center text-gray-500">
              {t('admin.team.empty_list')}
            </div>
          ) : null}
        </div>
      )}

      {editingMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-darker p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setEditingMember(null)}
              className="absolute right-6 top-6 text-gray-400 transition-colors hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="mb-6 text-2xl font-bold font-display">{t('admin.team.edit_title')}</h2>

            <form onSubmit={handleSave} noValidate className="space-y-4">
              <Field label={t('admin.team.field_name')} error={editErrors.full_name}>
                <input
                  value={editingMember.full_name}
                  onChange={(event) => {
                    setEditingMember((current) => current ? { ...current, full_name: event.target.value } : current);
                    setEditErrors((e) => ({ ...e, full_name: '' }));
                  }}
                  className={`w-full rounded-xl border bg-dark px-4 py-3 text-white focus:outline-none focus:border-primary ${editErrors.full_name ? 'border-red-500' : 'border-white/10'}`}
                />
              </Field>
              <Field label={t('admin.team.field_job')}>
                <input
                  value={editingMember.job_title}
                  onChange={(event) =>
                    setEditingMember((current) =>
                      current ? { ...current, job_title: event.target.value } : current
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label={t('admin.team.field_access')}>
                <select
                  value={editingMember.role}
                  onChange={(event) =>
                    setEditingMember((current) =>
                      current ? { ...current, role: event.target.value } : current
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
                >
                  <option value="admin">{t('role.admin')}</option>
                  <option value="manager">{t('role.manager')}</option>
                  <option value="reception">{t('role.reception')}</option>
                  <option value="operational">{t('role.operational')}</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('admin.team.field_phone')}>
                  <input
                    value={editingMember.phone}
                    onChange={(event) =>
                      setEditingMember((current) =>
                        current ? { ...current, phone: event.target.value } : current
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
                  />
                </Field>
                <Field label={t('admin.team.field_status')}>
                  <select
                    value={editingMember.status}
                    onChange={(event) =>
                      setEditingMember((current) =>
                        current
                          ? {
                              ...current,
                              status: event.target.value as ProfileRow['status'],
                            }
                          : current
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-white focus:border-primary focus:outline-none"
                  >
                    <option value="active">{t('status.active')}</option>
                    <option value="vacation">{t('status.vacation')}</option>
                    <option value="inactive">{t('status.inactive')}</option>
                  </select>
                </Field>
              </div>
              <Field label={t('admin.team.field_email')}>
                <input
                  value={editingMember.email}
                  disabled
                  className="w-full rounded-xl border border-white/10 bg-dark px-4 py-3 text-gray-500 focus:outline-none"
                />
              </Field>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? t('admin.team.btn_saving') : t('admin.team.btn_save')}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-400">{label}</span>
      {children}
      {error ? <span className="block text-xs text-red-400 mt-1">{error}</span> : null}
    </label>
  );
}
