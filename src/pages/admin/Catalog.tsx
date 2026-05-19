import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { BookOpen, Loader2, Pencil, Plus, Save, Tag, Trash2 } from 'lucide-react';
import {
  deleteCatalogService,
  fetchCatalogServices,
  saveCatalogService,
  type ServiceCatalogRow,
} from '../../lib/adminData';
import { useAuth } from '../../providers/AuthProvider';
import { useLanguage } from '../../providers/LanguageProvider';

type CatalogDraft = {
  id: string | null;
  code: string;
  name: string;
  category: string;
  description: string;
  base_price: number;
  promotional_price: number;
  is_promotional: boolean;
  promo_start_date: string;
  promo_end_date: string;
  vat_enabled: boolean;
  vat_included: boolean;
  vat_rate: number;
  duration_minutes: number;
  is_active: boolean;
};

const emptyDraft: CatalogDraft = {
  id: null,
  code: '',
  name: '',
  category: 'Lavagem',
  description: '',
  base_price: 0,
  promotional_price: 0,
  is_promotional: false,
  promo_start_date: '',
  promo_end_date: '',
  vat_enabled: true,
  vat_included: false,
  vat_rate: 16,
  duration_minutes: 45,
  is_active: true,
};

const formatMoney = (value: number) =>
  `${new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} MT`;

const computeDisplayPrice = (service: Pick<ServiceCatalogRow, 'base_price' | 'promotional_price' | 'is_promotional'>) =>
  service.is_promotional && service.promotional_price
    ? service.promotional_price
    : service.base_price;

export default function Catalog() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [services, setServices] = useState<ServiceCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<CatalogDraft>(emptyDraft);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadServices = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const nextServices = await fetchCatalogServices();
      setServices(nextServices);
    } catch (error) {
      console.error('Failed to load catalog services', error);
      setErrorMessage(t('admin.catalog.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const haystack = `${service.code} ${service.name} ${service.category} ${service.description ?? ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [search, services]);

  const activeServices = services.filter((service) => service.is_active).length;
  const promotionalServices = services.filter((service) => service.is_promotional).length;
  const vatIncludedServices = services.filter((service) => service.vat_included).length;
  const averagePrice =
    services.length > 0
      ? services.reduce((sum, service) => sum + computeDisplayPrice(service), 0) / services.length
      : 0;

  const updateDraft = <K extends keyof CatalogDraft>(field: K, value: CatalogDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const resetDraft = () => {
    setDraft(emptyDraft);
    setMessage('');
    setErrorMessage('');
  };

  const handleEdit = (service: ServiceCatalogRow) => {
    setDraft({
      id: service.id,
      code: service.code,
      name: service.name,
      category: service.category,
      description: service.description ?? '',
      base_price: service.base_price,
      promotional_price: service.promotional_price ?? 0,
      is_promotional: service.is_promotional,
      promo_start_date: service.promo_start_date ?? '',
      promo_end_date: service.promo_end_date ?? '',
      vat_enabled: service.vat_enabled,
      vat_included: service.vat_included,
      vat_rate: service.vat_rate,
      duration_minutes: service.duration_minutes ?? 45,
      is_active: service.is_active,
    });
  };

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm(t('admin.catalog.confirm_delete'))) {
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      setErrorMessage('');
      await deleteCatalogService(serviceId);

      setServices((current) => current.filter((service) => service.id !== serviceId));
      if (draft.id === serviceId) {
        resetDraft();
      }
      setMessage(t('admin.catalog.success_delete'));
    } catch (error) {
      console.error('Failed to delete catalog service', error);
      setErrorMessage(
        error instanceof Error ? error.message : t('admin.catalog.error_delete')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setErrorMessage('');

      const payload = {
        id: draft.id ?? undefined,
        code: draft.code.trim().toUpperCase(),
        name: draft.name.trim(),
        category: draft.category.trim(),
        description: draft.description.trim() || null,
        base_price: draft.base_price,
        promotional_price: draft.is_promotional ? draft.promotional_price : null,
        is_promotional: draft.is_promotional,
        promo_start_date: draft.is_promotional ? draft.promo_start_date || null : null,
        promo_end_date: draft.is_promotional ? draft.promo_end_date || null : null,
        vat_enabled: draft.vat_enabled,
        vat_included: draft.vat_included,
        vat_rate: draft.vat_enabled ? draft.vat_rate : 0,
        duration_minutes: draft.duration_minutes,
        is_active: draft.is_active,
        updated_by: profile?.id ?? null,
        created_by: draft.id ? undefined : profile?.id ?? null,
      };

      await saveCatalogService(payload);

      await loadServices();
      setMessage(
        draft.id
          ? t('admin.catalog.success_update')
          : t('admin.catalog.success_create')
      );
      resetDraft();
    } catch (error) {
      console.error('Failed to save catalog service', error);
      setErrorMessage(
        error instanceof Error ? error.message : t('admin.catalog.error_save')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold font-display">{t('admin.catalog.title')}</h1>
          <p className="text-gray-400">
            {t('admin.catalog.sub')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label={t('admin.catalog.stat_active')} value={activeServices.toString()} />
          <StatCard label={t('admin.catalog.stat_promotional')} value={promotionalServices.toString()} />
          <StatCard label={t('admin.catalog.stat_vat_included')} value={vatIncludedServices.toString()} />
          <StatCard label={t('admin.catalog.stat_avg_price')} value={formatMoney(averagePrice)} />
        </div>
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

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[0.95fr_1.35fr]">
        <div className="rounded-3xl border border-white/10 bg-dark p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">
                {draft.id ? t('admin.catalog.edit_title') : t('admin.catalog.new_title')}
              </h2>
              <p className="text-sm text-gray-400">
                {t('admin.catalog.form_sub')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={t('admin.catalog.field_code')}>
                <input
                  value={draft.code}
                  onChange={(event) => updateDraft('code', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white focus:border-primary focus:outline-none"
                  placeholder={t('admin.catalog.field_code_placeholder')}
                />
              </Field>
              <Field label={t('admin.catalog.field_category')}>
                <select
                  value={draft.category}
                  onChange={(event) => updateDraft('category', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white focus:border-primary focus:outline-none"
                >
                  <option>Lavagem</option>
                  <option>Detalhe</option>
                  <option>Interior</option>
                  <option>Protecao</option>
                  <option>Motor</option>
                  <option>Pacote</option>
                  <option>Promocao</option>
                </select>
              </Field>
              <Field label={t('admin.catalog.field_name')}>
                <input
                  value={draft.name}
                  onChange={(event) => updateDraft('name', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white focus:border-primary focus:outline-none md:col-span-2"
                  placeholder={t('admin.catalog.field_name_placeholder')}
                />
              </Field>
              <Field label={t('admin.catalog.field_duration')}>
                <input
                  type="number"
                  min="0"
                  value={draft.duration_minutes}
                  onChange={(event) => updateDraft('duration_minutes', Number(event.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white focus:border-primary focus:outline-none"
                />
              </Field>
              <Field label={t('admin.catalog.field_price')}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.base_price}
                  onChange={(event) => updateDraft('base_price', Number(event.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white focus:border-primary focus:outline-none"
                />
              </Field>
            </div>

            <Field label={t('admin.catalog.field_description')}>
              <textarea
                value={draft.description}
                onChange={(event) => updateDraft('description', event.target.value)}
                className="min-h-28 w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white focus:border-primary focus:outline-none"
                placeholder={t('admin.catalog.field_description_placeholder')}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-darker p-4 md:grid-cols-2">
              <Toggle
                label={t('admin.catalog.toggle_promotional')}
                helper={t('admin.catalog.toggle_promotional_helper')}
                checked={draft.is_promotional}
                onChange={(checked) => updateDraft('is_promotional', checked)}
              />
              <Toggle
                label={t('admin.catalog.toggle_active')}
                helper={t('admin.catalog.toggle_active_helper')}
                checked={draft.is_active}
                onChange={(checked) => updateDraft('is_active', checked)}
              />
              <Toggle
                label={t('admin.catalog.toggle_vat_enabled')}
                helper={t('admin.catalog.toggle_vat_enabled_helper')}
                checked={draft.vat_enabled}
                onChange={(checked) => updateDraft('vat_enabled', checked)}
              />
              <Toggle
                label={t('admin.catalog.toggle_vat_included')}
                helper={t('admin.catalog.toggle_vat_included_helper')}
                checked={draft.vat_included}
                onChange={(checked) => updateDraft('vat_included', checked)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={t('admin.catalog.field_vat_rate')}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.vat_rate}
                  disabled={!draft.vat_enabled}
                  onChange={(event) => updateDraft('vat_rate', Number(event.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white focus:border-primary focus:outline-none disabled:opacity-50"
                />
              </Field>
              <Field label={t('admin.catalog.field_promotional_price')}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.promotional_price}
                  disabled={!draft.is_promotional}
                  onChange={(event) => updateDraft('promotional_price', Number(event.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white focus:border-primary focus:outline-none disabled:opacity-50"
                />
              </Field>
            </div>

            {draft.is_promotional && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Início da Promoção">
                  <input
                    type="date"
                    value={draft.promo_start_date}
                    onChange={(event) => updateDraft('promo_start_date', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white focus:border-primary focus:outline-none text-sm"
                  />
                </Field>
                <Field label="Fim da Promoção">
                  <input
                    type="date"
                    value={draft.promo_end_date}
                    onChange={(event) => updateDraft('promo_end_date', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white focus:border-primary focus:outline-none text-sm"
                  />
                </Field>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <PriceCard label={t('admin.catalog.card_base_price')} value={formatMoney(draft.base_price)} />
              <PriceCard
                label={t('admin.catalog.card_vat')}
                value={draft.vat_enabled ? `${draft.vat_rate}%` : t('admin.catalog.badge_no_vat')}
              />
              <PriceCard
                label={t('admin.catalog.card_final_price')}
                value={formatMoney(draft.is_promotional ? draft.promotional_price || draft.base_price : draft.base_price)}
                accent
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover disabled:opacity-60"
              >
                {draft.id ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {saving ? t('admin.catalog.form_saving') : draft.id ? t('admin.catalog.form_save_changes') : t('admin.catalog.form_create_service')}
              </button>
              <button
                type="button"
                onClick={resetDraft}
                className="rounded-xl bg-white/5 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t('admin.catalog.form_clear')}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-3xl border border-white/10 bg-dark p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold font-display">{t('admin.catalog.list_title')}</h2>
              <p className="text-sm text-gray-400">
                {services.length} {t('admin.catalog.list_loaded_count')}
              </p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('admin.catalog.search_placeholder')}
              className="w-full rounded-xl border border-white/10 bg-darker px-4 py-3 text-white focus:border-primary focus:outline-none lg:w-80"
            />
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <div key={service.id} className="rounded-2xl border border-white/10 bg-darker/70 p-5">
                  <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                          {service.category}
                        </span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-gray-300">
                          {service.code}
                        </span>
                        {service.is_promotional ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                            <Tag className="h-3.5 w-3.5" />
                            {t('admin.catalog.badge_promotional')}
                            {service.promo_start_date && service.promo_end_date && (
                              <span className="text-[10px] text-amber-400 font-medium">
                                ({service.promo_start_date} a {service.promo_end_date})
                              </span>
                            )}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                          {service.vat_enabled ? (service.vat_included ? t('admin.catalog.badge_vat_included') : t('admin.catalog.badge_with_vat')) : t('admin.catalog.badge_no_vat')}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold font-display text-white">{service.name}</h3>
                      <p className="mt-2 max-w-2xl text-sm text-gray-400">
                        {service.description || t('admin.catalog.no_description')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(service)}
                        className="rounded-xl bg-white/5 p-3 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                        title="Editar servico"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(service.id)}
                        className="rounded-xl bg-white/5 p-3 text-gray-300 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        title="Apagar servico"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <PriceCard label={t('admin.catalog.card_base_price')} value={formatMoney(service.base_price)} />
                    <PriceCard
                      label={t('admin.catalog.badge_promotional')}
                      value={
                        service.is_promotional && service.promotional_price
                          ? formatMoney(service.promotional_price)
                          : t('admin.catalog.no_promotion')
                      }
                    />
                    <PriceCard
                      label={t('admin.catalog.card_vat')}
                      value={service.vat_enabled ? `${service.vat_rate}%` : '0%'}
                    />
                    <PriceCard
                      label={t('admin.catalog.card_in_use')}
                      value={formatMoney(computeDisplayPrice(service))}
                      accent
                    />
                  </div>
                </div>
              ))}

              {filteredServices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-gray-500">
                  {t('admin.catalog.empty_list')}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-dark px-5 py-4">
      <div className="mb-1 text-sm text-gray-400">{label}</div>
      <div className="text-2xl font-bold font-display text-white">{value}</div>
    </div>
  );
}

function PriceCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent ? 'border-primary/20 bg-primary/10' : 'border-white/10 bg-black/20'
      }`}
    >
      <div className={`mb-1 text-xs uppercase tracking-wider ${accent ? 'text-primary/80' : 'text-gray-500'}`}>
        {label}
      </div>
      <div className="font-bold text-white">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  helper,
  checked,
  onChange,
}: {
  label: string;
  helper: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-white/10 bg-dark text-primary focus:ring-primary"
      />
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="block text-sm text-gray-400">{helper}</span>
      </span>
    </label>
  );
}
