import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  Bell,
  Building2,
  Download,
  History as HistoryIcon,
  Image as ImageIcon,
  Loader2,
  Save,
  Shield,
  Upload,
} from 'lucide-react';
import companyProfile from '../../lib/companyProfile';
import {
  fetchSettings,
  saveSettings,
  type AuditLogRow,
  type CompanySettings,
} from '../../lib/adminData';
import { useLanguage } from '../../providers/LanguageProvider';

type TabId = 'general' | 'billing' | 'logs' | 'security';

export default function Settings() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [company, setCompany] = useState<CompanySettings>(companyProfile);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = useMemo<Array<{ id: TabId; label: string; icon: typeof Building2 }>>(() => [
    { id: 'general', label: t('admin.settings.tab_company'), icon: Building2 },
    { id: 'billing', label: t('admin.settings.tab_billing'), icon: Bell },
    { id: 'logs', label: t('admin.settings.tab_logs'), icon: HistoryIcon },
    { id: 'security', label: t('admin.settings.tab_security'), icon: Shield },
  ], [t]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await fetchSettings();
      setCompany(data.company);
      setAuditLogs(data.audit_logs);
    } catch (error) {
      console.error('Failed to load settings', error);
      setErrorMessage(t('admin.settings.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const updateCompany = <K extends keyof CompanySettings>(field: K, value: CompanySettings[K]) => {
    setCompany((current) => ({ ...current, [field]: value }));
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 700_000) {
      setErrorMessage(t('admin.settings.error_logo_size'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      updateCompany('logoDataUrl', reader.result as string);
      setMessage(t('admin.settings.success_logo_loaded'));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setErrorMessage('');
      const saved = await saveSettings(company);
      setCompany(saved);
      await loadSettings();
      setMessage(t('admin.settings.success_save'));
    } catch (error) {
      console.error('Failed to save settings', error);
      setErrorMessage(
        error instanceof Error ? error.message : t('admin.settings.error_save')
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold font-display">{t('admin.settings.title')}</h1>
        <p className="text-gray-400">
          {t('admin.settings.sub')}
        </p>
      </div>

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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </aside>

        <section className="rounded-3xl border border-white/10 bg-dark p-6 md:p-8">
          {activeTab === 'general' ? (
            <form noValidate onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col gap-6 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-darker">
                    {company.logoDataUrl ? (
                      <img src={company.logoDataUrl} alt="Logo" className="h-full w-full object-contain p-3" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 rounded-xl bg-primary p-2 text-white shadow-lg transition-colors hover:bg-primary-hover"
                    title={t('admin.settings.btn_change_logo')}
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-white">{t('admin.settings.logo_title')}</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {t('admin.settings.logo_sub')}
                  </p>
                  {company.logoDataUrl ? (
                    <button
                      type="button"
                      onClick={() => updateCompany('logoDataUrl', null)}
                      className="mt-3 text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
                    >
                      {t('admin.settings.logo_remove')}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label={t('admin.settings.field_legal_name')}>
                  <input value={company.legalName} onChange={(event) => updateCompany('legalName', event.target.value)} className="form-input" />
                </Field>
                <Field label={t('admin.settings.field_brand_name')}>
                  <input value={company.brandName} onChange={(event) => updateCompany('brandName', event.target.value)} className="form-input" />
                </Field>
                <Field label={t('admin.settings.field_slogan')}>
                  <input value={company.tagline} onChange={(event) => updateCompany('tagline', event.target.value)} className="form-input" />
                </Field>
                <Field label={t('admin.settings.field_nuit')}>
                  <input value={company.nuit} onChange={(event) => updateCompany('nuit', event.target.value)} className="form-input" />
                </Field>
                <Field label={t('admin.settings.field_phone')}>
                  <input value={company.phone} onChange={(event) => updateCompany('phone', event.target.value)} className="form-input" />
                </Field>
                <Field label={t('admin.settings.field_email')}>
                  <input type="email" value={company.email} onChange={(event) => updateCompany('email', event.target.value)} className="form-input" />
                </Field>
                <Field label={t('admin.settings.field_website')}>
                  <input value={company.website} onChange={(event) => updateCompany('website', event.target.value)} className="form-input" />
                </Field>
                <Field label={t('admin.settings.field_country')}>
                  <input value={company.country} onChange={(event) => updateCompany('country', event.target.value)} className="form-input" />
                </Field>
                <Field label={t('admin.settings.field_address1')}>
                  <input value={company.addressLine1} onChange={(event) => updateCompany('addressLine1', event.target.value)} className="form-input" />
                </Field>
                <Field label={t('admin.settings.field_address2')}>
                  <input value={company.addressLine2} onChange={(event) => updateCompany('addressLine2', event.target.value)} className="form-input" />
                </Field>
                <div className="md:col-span-2">
                  <Field label={t('admin.settings.field_bank')}>
                    <input value={company.bankDetails} onChange={(event) => updateCompany('bankDetails', event.target.value)} className="form-input" />
                  </Field>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60">
                  <Save className="h-5 w-5" />
                  {saving ? t('admin.settings.btn_saving') : t('admin.settings.btn_save_mysql')}
                </button>
              </div>
            </form>
          ) : null}

          {activeTab === 'billing' ? (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div>
                <h2 className="text-xl font-bold font-display text-white">{t('admin.settings.billing_title')}</h2>
                <p className="mt-1 text-sm text-gray-400">
                  {t('admin.settings.billing_sub')}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Field label={t('admin.settings.field_default_vat')}>
                  <input type="number" min="0" step="0.01" value={company.defaultVatRate} onChange={(event) => updateCompany('defaultVatRate', Number(event.target.value))} className="form-input" />
                </Field>
                <Field label={t('admin.settings.field_accent_color')}>
                  <input type="color" value={company.accentColor} onChange={(event) => updateCompany('accentColor', event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-darker p-1" />
                </Field>
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-darker p-4 text-sm text-gray-300">
                  <input type="checkbox" checked={company.defaultVatIncluded} onChange={(event) => updateCompany('defaultVatIncluded', event.target.checked)} className="h-4 w-4 rounded border-white/10 bg-dark text-primary focus:ring-primary" />
                  {t('admin.settings.field_default_vat_included')}
                </label>
              </div>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60">
                <Save className="h-5 w-5" />
                {t('admin.settings.btn_save_billing')}
              </button>
            </form>
          ) : null}

          {activeTab === 'logs' ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold font-display text-white">{t('admin.settings.logs_title')}</h2>
                  <p className="mt-1 text-sm text-gray-400">{t('admin.settings.logs_sub')}</p>
                </div>
                <button type="button" onClick={() => void loadSettings()} className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                  <Download className="h-4 w-4" />
                  {t('admin.settings.btn_refresh')}
                </button>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-darker text-gray-400">
                    <tr>
                      <th className="p-4 font-medium">{t('admin.settings.th_date')}</th>
                      <th className="p-4 font-medium">{t('admin.settings.th_module')}</th>
                      <th className="p-4 font-medium">{t('admin.settings.th_action')}</th>
                      <th className="p-4 font-medium">{t('admin.settings.th_entity')}</th>
                      <th className="p-4 font-medium">{t('admin.settings.th_user')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.slice(0, 60).map((log) => (
                      <tr key={log.id} className="border-t border-white/5">
                        <td className="p-4 text-gray-400">{new Date(log.created_at).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US')}</td>
                        <td className="p-4 text-primary">{log.module}</td>
                        <td className="p-4 text-white">{log.action}</td>
                        <td className="p-4 text-gray-300">{log.entity_label || log.entity_type}</td>
                        <td className="p-4 text-gray-300">{log.user_name || t('admin.settings.system')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTab === 'security' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-display text-white">{t('admin.settings.security_title')}</h2>
              <div className="rounded-2xl border border-white/10 bg-darker p-5 text-sm text-gray-300">
                {t('admin.settings.security_notice')}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      {children}
    </label>
  );
}
