import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../logo';
import { fetchSettings, type CompanySettings } from './adminData';
import companyProfile from './companyProfile';
import {
 BusinessDocument,
 calculateDocumentTotals,
 kindLabels,
} from './documentCenter';

let cachedLogoDataUrl: string | null = null;

const loadLogoDataUrl = async (profile: CompanySettings) => {
 if (profile.logoDataUrl) return profile.logoDataUrl;
 if (cachedLogoDataUrl) return cachedLogoDataUrl;

 const response = await fetch(logo);
 const blob = await response.blob();

 cachedLogoDataUrl = await new Promise<string>((resolve, reject) => {
 const reader = new FileReader();
 reader.onloadend = () => resolve(reader.result as string);
 reader.onerror = reject;
 reader.readAsDataURL(blob);
 });

 return cachedLogoDataUrl;
};

const loadCompanyProfile = async () => {
 try {
 const settings = await fetchSettings();
 return settings.company;
 } catch {
 return companyProfile;
 }
};

const hexToRgb = (hex: string): [number, number, number] => {
 const normalized = hex.replace('#', '');
 const parsed = Number.parseInt(normalized.length === 3
 ? normalized.split('').map((part) => part + part).join('')
 : normalized, 16);

 if (!Number.isFinite(parsed)) {
 return [0, 71, 255];
 }

 return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
};

const money = (value: number) =>
 `${new Intl.NumberFormat('pt-PT', {
 minimumFractionDigits: 2,
 maximumFractionDigits: 2,
 }).format(value)} MT`;

export const generateBusinessDocumentPdf = async (document: BusinessDocument) => {
 const profile = await loadCompanyProfile();
 const accent = hexToRgb(profile.accentColor);
 const logoDataUrl = await loadLogoDataUrl(profile);
 const totals = calculateDocumentTotals(document);
 const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
 const pageWidth = pdf.internal.pageSize.getWidth();
 const pageHeight = pdf.internal.pageSize.getHeight();

 pdf.setFillColor(...accent);
 pdf.rect(0, 0, pageWidth, 34, 'F');
 pdf.setFillColor(255, 255, 255);
 pdf.roundedRect(14, 8, 18, 18, 5, 5, 'F');
 pdf.addImage(logoDataUrl, 'PNG', 15.2, 9.2, 15.6, 15.6);

 pdf.setTextColor(255, 255, 255);
 pdf.setFont('helvetica', 'bold');
 pdf.setFontSize(18);
 pdf.text(profile.brandName, 38, 15);
 pdf.setFontSize(9);
 pdf.setFont('helvetica', 'normal');
 pdf.text(profile.tagline, 38, 21);
 pdf.text(`${profile.phone} | ${profile.email} | ${profile.website}`, 38, 26);

 pdf.setTextColor(20, 24, 35);
 pdf.setFont('helvetica', 'bold');
 pdf.setFontSize(24);
 pdf.text(kindLabels[document.kind], 14, 49);
 pdf.setFontSize(11);
 pdf.setFont('helvetica', 'normal');
 pdf.text(document.title, 14, 56);

 pdf.setDrawColor(230, 234, 240);
 pdf.roundedRect(14, 63, 84, 39, 4, 4);
 pdf.roundedRect(104, 63, 92, 39, 4, 4);

 pdf.setFont('helvetica', 'bold');
 pdf.setFontSize(10);
 pdf.text('Emitente', 18, 72);
 pdf.text('Destinatario', 108, 72);

 pdf.setFont('helvetica', 'normal');
 pdf.setFontSize(9.5);
 pdf.text(profile.legalName, 18, 79);
 pdf.text(`NUIT: ${profile.nuit}`, 18, 85);
 pdf.text(`${profile.addressLine1}, ${profile.addressLine2}`, 18, 91);
 pdf.text(profile.country, 18, 97);

 [
 document.party.name,
 document.party.taxId ? `NUIT/NIF: ${document.party.taxId}` : '',
 document.party.address ?? '',
 document.party.phone ?? document.party.email ?? '',
 ].filter(Boolean).forEach((line, index) => {
 pdf.text(line, 108, 79 + index * 6);
 });

 pdf.roundedRect(14, 108, 182, 23, 4, 4);
 pdf.setFont('helvetica', 'bold');
 pdf.text('Dados do Documento', 18, 117);
 pdf.setFont('helvetica', 'normal');
 pdf.text(`Numero: ${document.number}`, 18, 124);
 pdf.text(`Emissao: ${document.issueDate}`, 74, 124);
 pdf.text(`Status: ${document.status}`, 126, 124);
 if (document.dueDate) pdf.text(`Vencimento: ${document.dueDate}`, 18, 129);
 	if (document.paymentMethod) {
		const paymentLabels: Record<string, string> = {
			cash: 'Dinheiro',
			mpesa: 'M-Pesa',
			emola: 'E-Mola',
			mkesh: 'Mkesh',
			card: 'Cartão / Multicaixa',
			qr: 'M-Pesa / QR Code',
			'bank-transfer': 'Transferência Bancária',
			mobile_money: 'Carteira Móvel',
		};
		const paymentLabel = paymentLabels[document.paymentMethod] || document.paymentMethod;
		pdf.text(`Pagamento: ${paymentLabel}`, 74, 129);
	}
 const vatLabel = document.vatEnabled
 ? `${document.vatRate}%${document.vatIncluded ? ' incluso' : ''}`
 : 'Nao aplicado';
 pdf.text(`IVA: ${vatLabel}`, 126, 129);

 let cursorY = 138;

 if (document.kind !== 'letterhead') {
 autoTable(pdf, {
 startY: cursorY,
 head: [['Descricao', 'Qtd', 'Preco Unit.', 'Total']],
 body: document.items.map((item) => [
 `${item.description}${item.details ? `\n${item.details}` : ''}`,
 item.quantity.toFixed(0),
 money(item.unitPrice),
 money(item.quantity * item.unitPrice),
 ]),
 theme: 'grid',
 styles: {
 fontSize: 9,
 cellPadding: 3.5,
 lineColor: [230, 234, 240],
 lineWidth: 0.2,
 },
 headStyles: {
 fillColor: accent,
 textColor: 255,
 fontStyle: 'bold',
 },
 alternateRowStyles: {
 fillColor: [248, 250, 252],
 },
 margin: { left: 14, right: 14 },
 columnStyles: {
 1: { halign: 'center', cellWidth: 18 },
 2: { halign: 'right', cellWidth: 32 },
 3: { halign: 'right', cellWidth: 32 },
 },
 });

 cursorY = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY;

 pdf.setDrawColor(226, 232, 240);
 pdf.roundedRect(122, cursorY + 8, 74, 33, 4, 4);
 pdf.setFont('helvetica', 'normal');
 pdf.setFontSize(9.5);
 pdf.text('Subtotal', 128, cursorY + 17);
 pdf.text(money(totals.subtotal), 188, cursorY + 17, { align: 'right' });
 pdf.text('IVA', 128, cursorY + 24);
 pdf.text(money(totals.vatAmount), 188, cursorY + 24, { align: 'right' });
 pdf.setFont('helvetica', 'bold');
 pdf.setFontSize(12);
 pdf.text('Total', 128, cursorY + 33);
 pdf.text(money(totals.total), 188, cursorY + 33, { align: 'right' });
 cursorY += 49;
 } else {
 pdf.setFont('helvetica', 'normal');
 pdf.setFontSize(11);
 const bodyLines = pdf.splitTextToSize(
 document.body ||
 'Documento institucional pronto para oficios, comunicados e correspondencia oficial da empresa.',
 182
 );
 pdf.text(bodyLines, 14, cursorY);
 cursorY += bodyLines.length * 6 + 10;
 }

 if (document.notes) {
 pdf.setFillColor(247, 249, 252);
 pdf.roundedRect(14, cursorY, 182, 22, 4, 4, 'F');
 pdf.setFont('helvetica', 'bold');
 pdf.setFontSize(10);
 pdf.text('Notas', 18, cursorY + 7);
 pdf.setFont('helvetica', 'normal');
 pdf.setFontSize(9.5);
 const noteLines = pdf.splitTextToSize(document.notes, 174);
 pdf.text(noteLines, 18, cursorY + 13);
 }

 pdf.setDrawColor(226, 232, 240);
 pdf.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
 pdf.setFont('helvetica', 'normal');
 pdf.setFontSize(8.5);
 pdf.setTextColor(100, 116, 139);
 pdf.text(
 `${profile.legalName} | ${profile.addressLine1}, ${profile.addressLine2} | ${profile.country}`,
 14,
 pageHeight - 12
 );
 pdf.text('Gerado pelo PDF Machine Doctor 46', pageWidth - 14, pageHeight - 12, {
 align: 'right',
 });

 pdf.save(`${document.number}.pdf`);
};
