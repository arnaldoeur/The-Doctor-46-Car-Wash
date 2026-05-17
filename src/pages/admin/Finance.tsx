import { useEffect, useState } from 'react';
import {
  DollarSign,
  Download,
  FileText,
  Filter,
  Loader2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { fetchFinanceSnapshot } from '../../lib/adminData';
import { useLanguage } from '../../providers/LanguageProvider';

type FinanceSnapshot = Awaited<ReturnType<typeof fetchFinanceSnapshot>>;
type FinanceRow = FinanceSnapshot['rows'][number];

export default function Finance() {
  const { t } = useLanguage();
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<FinanceRow | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const nextSnapshot = await fetchFinanceSnapshot();
        if (active) {
          setSnapshot(nextSnapshot);
        }
      } catch (error) {
        console.error('Failed to load finance snapshot', error);
        if (active) {
          setErrorMessage(t('admin.finance.error_load'));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold font-display">{t('admin.finance.title')}</h1>
          <p className="text-gray-400">
            {t('admin.finance.sub')}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-medium text-white transition-colors hover:bg-white/10">
          <Download className="h-5 w-5" />
          {t('admin.finance.export')}
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {loading || !snapshot ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <KpiCard
              label={t('admin.finance.kpi_income')}
              value={snapshot.formatMoney(snapshot.totalIncome)}
              icon={TrendingUp}
              iconClassName="text-emerald-400"
              panelClassName="bg-emerald-500/10"
            />
            <KpiCard
              label={t('admin.finance.kpi_expense')}
              value={snapshot.formatMoney(snapshot.totalExpense)}
              icon={TrendingDown}
              iconClassName="text-red-400"
              panelClassName="bg-red-500/10"
            />
            <KpiCard
              label={t('admin.finance.kpi_net')}
              value={snapshot.formatMoney(snapshot.netProfit)}
              icon={DollarSign}
              iconClassName="text-primary"
              panelClassName="bg-primary/10"
            />
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-dark">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 className="text-xl font-bold font-display">{t('admin.finance.recent_title')}</h2>
                <p className="text-sm text-gray-400">{snapshot.rows.length} {t('admin.finance.recent_sub')}</p>
              </div>
              <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                <Filter className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-darker/50 text-gray-400">
                    <th className="p-4 font-medium">{t('admin.finance.th_id')}</th>
                    <th className="p-4 font-medium">{t('admin.finance.th_description')}</th>
                    <th className="p-4 font-medium">{t('admin.finance.th_party')}</th>
                    <th className="p-4 font-medium">{t('admin.finance.th_date')}</th>
                    <th className="p-4 font-medium">{t('admin.finance.th_status')}</th>
                    <th className="p-4 font-medium text-right">{t('admin.finance.th_value')}</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedTransaction(row)}
                      className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5"
                    >
                      <td className="p-4 font-mono text-gray-400">{row.id}</td>
                      <td className="p-4 font-medium text-gray-200">{row.description}</td>
                      <td className="p-4 text-gray-400">{row.party}</td>
                      <td className="p-4 text-gray-400">{row.date}</td>
                      <td className="p-4">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-gray-300">
                          {row.status}
                        </span>
                      </td>
                      <td
                        className={`p-4 text-right font-bold ${
                          row.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {row.type === 'income' ? '+' : '-'}
                        {snapshot.formatMoney(row.amount)}
                      </td>
                    </tr>
                  ))}
                  {snapshot.rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        {t('admin.finance.empty_list')}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedTransaction && snapshot ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-darker p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedTransaction(null)}
              className="absolute right-6 top-6 text-gray-400 transition-colors hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mb-6 flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  selectedTransaction.type === 'income'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {selectedTransaction.type === 'income' ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <TrendingDown className="h-6 w-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-white">{t('admin.finance.modal_title')}</h2>
                <p className="font-mono text-sm text-gray-400">{selectedTransaction.id}</p>
              </div>
            </div>

            <div className="space-y-4">
              <Detail label={t('admin.finance.th_description')} value={selectedTransaction.description} />
              <div className="grid grid-cols-2 gap-4">
                <Detail label={t('admin.finance.th_date')} value={selectedTransaction.date} />
                <Detail label={t('admin.finance.th_status')} value={selectedTransaction.status} />
              </div>
              <Detail label={t('admin.finance.th_party')} value={selectedTransaction.party} />
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-dark p-4">
                <p className="text-sm text-gray-400">{t('admin.finance.modal_value_label')}</p>
                <p
                  className={`text-2xl font-bold font-display ${
                    selectedTransaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {selectedTransaction.type === 'income' ? '+' : '-'}
                  {snapshot.formatMoney(selectedTransaction.amount)}
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="flex-1 rounded-xl bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10"
              >
                {t('admin.finance.modal_close')}
              </button>
              <button className="flex-1 rounded-xl bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover">
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('admin.finance.modal_view_doc')}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  panelClassName,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  iconClassName: string;
  panelClassName: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-dark p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${panelClassName}`}>
          <Icon className={`h-6 w-6 ${iconClassName}`} />
        </div>
      </div>
      <h3 className="mb-1 font-medium text-gray-400">{label}</h3>
      <p className="text-3xl font-bold font-display text-white">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-dark p-4">
      <p className="mb-1 text-sm text-gray-400">{label}</p>
      <p className="font-medium text-white">{value}</p>
    </div>
  );
}
