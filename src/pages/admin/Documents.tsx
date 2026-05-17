import { useEffect, useState } from 'react';
import {
  Download,
  FileBadge,
  FileText,
  Landmark,
  LetterText,
  Loader2,
  Receipt,
} from 'lucide-react';
import companyProfile from '../../lib/companyProfile';
import { fetchBusinessDocuments, fetchCatalogServices, type BusinessDocumentRow } from '../../lib/adminData';
import { type DocumentKind, type BusinessDocument } from '../../lib/documentCenter';
import { generateBusinessDocumentPdf } from '../../lib/pdfMachine';
import { useLanguage } from '../../providers/LanguageProvider';

const templates: Array<{ kind: DocumentKind; icon: typeof FileText }> = [
  { kind: 'invoice', icon: FileText },
  { kind: 'receipt', icon: Receipt },
  { kind: 'purchase-order', icon: Landmark },
  { kind: 'quotation', icon: FileText },
  { kind: 'letterhead', icon: LetterText },
];

const toPdfDocument = (document: BusinessDocumentRow) => ({
  id: document.id,
  number: document.number,
  kind: document.kind,
  status: document.status as 'Draft' | 'Issued' | 'Paid' | 'Pending' | 'Approved' | 'Sent',
  source: document.source as 'manual' | 'pos' | 'billing',
  title: document.title,
  issueDate: document.issue_date,
  dueDate: document.due_date ?? undefined,
  paymentMethod: (document.payment_method as BusinessDocument['paymentMethod']) ?? undefined,
  vatEnabled: document.vat_enabled,
  vatIncluded: document.vat_included,
  vatRate: document.vat_rate,
  party: {
    name: document.party_name,
    taxId: document.party_tax_id ?? undefined,
    email: document.party_email ?? undefined,
    phone: document.party_phone ?? undefined,
    address: document.party_address ?? undefined,
  },
  items: (document.business_document_items ?? []).map((item) => ({
    id: item.id,
    description: item.description,
    details: item.details ?? undefined,
    quantity: item.quantity,
    unitPrice: item.unit_price,
  })),
  notes: document.notes ?? undefined,
  body: document.body ?? undefined,
  createdAt: document.created_at,
});

export default function Documents() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<BusinessDocumentRow[]>([]);
  const [catalogCount, setCatalogCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const [nextDocuments, nextCatalog] = await Promise.all([
          fetchBusinessDocuments(),
          fetchCatalogServices(),
        ]);

        if (!active) {
          return;
        }

        setDocuments(nextDocuments);
        setCatalogCount(nextCatalog.length);
      } catch (error) {
        console.error('Failed to load documents center', error);
        if (active) {
          setErrorMessage(t('admin.documents.error_load'));
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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold font-display">{t('admin.documents.title')}</h1>
          <p className="text-gray-400">
            {t('admin.documents.sub')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label={t('admin.documents.stat_docs')} value={documents.length.toString()} />
          <StatCard label={t('admin.documents.stat_catalog')} value={catalogCount.toString()} />
          <StatCard label={t('admin.documents.stat_vat')} value="16%" />
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-dark p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <FileBadge className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display">{t('admin.documents.templates_title')}</h2>
                <p className="text-sm text-gray-400">
                  {t('admin.documents.templates_sub')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {templates.map((template) => (
                <div key={template.kind} className="rounded-2xl border border-white/10 bg-darker p-4">
                  <template.icon className="mb-3 h-5 w-5 text-primary" />
                  <div className="mb-1 font-semibold text-white">{t(`document.kind.${template.kind}`)}</div>
                  <div className="text-xs leading-relaxed text-gray-400">
                    {t(`document.description.${template.kind}`)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-dark p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <LetterText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display">{t('admin.documents.letterhead_title')}</h2>
                <p className="text-sm text-gray-400">
                  {t('admin.documents.letterhead_sub')}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-darker">
              <div className="bg-primary px-5 py-4">
                <div className="text-sm font-bold uppercase tracking-[0.28em] text-white/80">
                  {companyProfile.tagline}
                </div>
                <div className="mt-1 text-2xl font-bold font-display text-white">
                  {companyProfile.brandName}
                </div>
              </div>
              <div className="space-y-2 p-5 text-sm text-gray-300">
                <div>{companyProfile.legalName}</div>
                <div>NUIT: {companyProfile.nuit}</div>
                <div>
                  {companyProfile.addressLine1}, {companyProfile.addressLine2}
                </div>
                <div>
                  {companyProfile.phone} | {companyProfile.email}
                </div>
                <div>{companyProfile.website}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-dark p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold font-display">{t('admin.documents.recent_title')}</h2>
            <p className="text-sm text-gray-400">
              {t('admin.documents.recent_sub')}
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {documents.slice(0, 10).map((document) => {
                const TemplateIcon =
                  templates.find((item) => item.kind === document.kind)?.icon ?? FileText;

                return (
                  <div
                    key={document.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-darker p-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                        <TemplateIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">{document.number}</div>
                        <div className="truncate text-sm text-gray-300">{document.party_name}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {t(`document.kind.${document.kind}`)} | {document.report_category === 'with_vat' ? t('admin.documents.with_vat') : t('admin.documents.no_vat')} | {document.issue_date}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void generateBusinessDocumentPdf(toPdfDocument(document))}
                      className="shrink-0 rounded-xl bg-white/5 p-3 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                      title={t('admin.documents.download_title')}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              {documents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-gray-500">
                  {t('admin.documents.empty_list')}
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
