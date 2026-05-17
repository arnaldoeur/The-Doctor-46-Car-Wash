import companyProfile from './companyProfile';

const whatsappNumber = companyProfile.phone.replace(/\D/g, '');

export const buildWhatsAppLink = (message: string) =>
 `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

export const buildServiceWhatsAppLink = (serviceName: string) =>
 buildWhatsAppLink(`Ola, gostaria de solicitar o servico ${serviceName}. Podem ajudar-me com disponibilidade e preco?`);
