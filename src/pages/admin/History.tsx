import { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Download,
  Filter,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { fetchAuditLogs, type AuditLogRow } from '../../lib/adminData';
import { useLanguage } from '../../providers/LanguageProvider';

export default function History() {
  const { t, language } = useLanguage();
  const [history, setHistory] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const logs = await fetchAuditLogs();
        if (active) {
          setHistory(logs);
        }
      } catch (error) {
        console.error('Failed to load audit logs', error);
        if (active) {
          setErrorMessage(t('admin.history.error_load'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const availableModules = useMemo(() => {
    const modules = Array.from(new Set(history.map((item) => item.module))).sort();
    return ['all', ...modules];
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const haystack = `${item.action} ${item.entity_label ?? ''} ${item.entity_type} ${item.user_name ?? ''}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesType = filterType === 'all' || item.module === filterType;
      const matchesDate = !filterDate || item.created_at.startsWith(filterDate);

      return matchesSearch && matchesType && matchesDate;
    });
  }, [filterDate, filterType, history, search]);

  const handleExport = () => {
    const headers = [
      t('admin.history.th_datetime'),
      t('admin.history.th_action'),
      t('admin.history.th_entity'),
      t('admin.history.th_module'),
      t('admin.history.th_responsible'),
    ];
    const csvContent = [
      headers.join(','),
      ...filteredHistory.map((item) =>
        [
          `"${formatDate(item.created_at)}"`,
          `"${item.action}"`,
          `"${item.entity_label ?? item.entity_type}"`,
          `"${item.module}"`,
          `"${item.user_name ?? t('admin.history.system')}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_mysql_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold font-display">{t('admin.history.title')}</h1>
          <p className="text-gray-400">
            {t('admin.history.sub')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 font-semibold text-white transition-all hover:bg-white/10"
        >
          <Download className="h-5 w-5" />
          {t('admin.history.export')}
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-dark">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-darker/50 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full items-center gap-3 md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder={t('admin.history.search_placeholder')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-dark py-2 pl-9 pr-4 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((value) => !value)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                  showFilters
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-white/10 bg-dark text-gray-400 hover:text-white'
                )}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden md:inline">{t('admin.history.filters')}</span>
              </button>
            </div>

            <div className="relative w-full md:w-56">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="date"
                value={filterDate}
                onChange={(event) => setFilterDate(event.target.value)}
                className="w-full appearance-none rounded-lg border border-white/10 bg-dark py-2 pl-9 pr-8 text-sm text-white focus:border-primary focus:outline-none"
              />
              {filterDate ? (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          </div>

          {showFilters ? (
            <div className="flex flex-wrap gap-2 border-t border-white/5 pt-2">
              {availableModules.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    filterType === type
                      ? 'border-primary bg-primary text-white'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                  )}
                >
                  {type === 'all' ? t('admin.history.filter_all') : type}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-darker/30 text-gray-400">
                  <th className="p-4 font-medium">{t('admin.history.th_datetime')}</th>
                  <th className="p-4 font-medium">{t('admin.history.th_action')}</th>
                  <th className="p-4 font-medium">{t('admin.history.th_entity')}</th>
                  <th className="p-4 font-medium">{t('admin.history.th_module')}</th>
                  <th className="p-4 font-medium">{t('admin.history.th_responsible')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                    <td className="p-4 whitespace-nowrap text-gray-400">{formatDate(item.created_at)}</td>
                    <td className="p-4 font-medium text-white">{item.action}</td>
                    <td className="p-4 text-gray-300">{item.entity_label ?? item.entity_type}</td>
                    <td className="p-4">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-300">
                        {item.module}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{item.user_name ?? t('admin.history.system')}</td>
                  </tr>
                ))}
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      {t('admin.history.empty_list')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
