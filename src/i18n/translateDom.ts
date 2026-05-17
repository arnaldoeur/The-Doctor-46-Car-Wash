import en from './locales/en.json';
import pt from './locales/pt.json';

export type Language = 'pt' | 'en';

type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = { pt, en };

const extraTranslations: Record<string, string> = {
 'Sessao ativa': 'Active session',
 'Sessão ativa': 'Active session',
 'Portal do cliente': 'Customer portal',
 'Portal do Cliente': 'Customer Portal',
 'Meu Perfil': 'My Profile',
 'Meus Agendamentos': 'My Appointments',
 Historico: 'History',
 Histórico: 'History',
 Fidelidade: 'Loyalty',
 Sair: 'Logout',
 Cliente: 'Customer',
 'Sem agenda': 'No schedule',
 'Ola,': 'Hello,',
 'Olá,': 'Hello,',
 'Veja o resumo rapido da sua conta, os seus pontos e o proximo atendimento.':
 'See a quick summary of your account, your points and your next service.',
 'Pontos atuais': 'Current points',
 'Proximo agendamento': 'Next appointment',
 'Próximo agendamento': 'Next appointment',
 'Servicos concluidos': 'Completed services',
 'Serviços concluídos': 'Completed services',
 'Novo Agendamento': 'New Appointment',
 'Ver agendamentos': 'View appointments',
 'Editar perfil': 'Edit profile',
 'Telefone no perfil': 'Phone in profile',
 'Atualize os seus dados em Meu Perfil.': 'Update your details in My Profile.',
 'Perfil sincronizado': 'Profile synced',
 'Adicione o telefone em Meu Perfil para facilitar os proximos contactos.':
 'Add your phone in My Profile to make future contacts easier.',
 'Nenhum agendamento futuro encontrado.': 'No upcoming appointment found.',
 'A carregar proximo agendamento...': 'Loading next appointment...',
 'A carregar agendamentos...': 'Loading appointments...',
 'Agendamentos futuros': 'Upcoming appointments',
 'Agendamentos anteriores': 'Previous appointments',
 'Total registado': 'Total recorded',
 'Proximos agendamentos': 'Upcoming appointments',
 'Lista completa dos seus pedidos ativos, com estado, data, hora e servico.':
 'Full list of active requests with status, date, time and service.',
 'Nao existem agendamentos futuros neste momento.': 'There are no upcoming appointments right now.',
 'Registos antigos, cancelados ou ja finalizados para consulta rapida.':
 'Old, cancelled or completed records for quick reference.',
 'Ainda nao existem agendamentos anteriores.': 'There are no previous appointments yet.',
 'Gerencie os seus agendamentos futuros e acompanhe os pedidos ja atendidos ou encerrados.':
 'Manage your upcoming appointments and follow requests already served or closed.',
 'Consulte apenas os servicos concluidos, com data, viatura atendida e valor registado.':
 'See completed services only, with date, served vehicle and recorded amount.',
 'Valor total registado': 'Total recorded value',
 'A carregar historico...': 'Loading history...',
 'No history yet.': 'Ainda não existe histórico.',
 'Acompanhe os seus pontos, o nivel atual e o progresso para o proximo patamar.':
 'Track your points, current tier and progress to the next level.',
 'Sem email associado': 'No email linked',
 'Conta recente': 'Recent account',
 'Introduza o seu nome completo antes de guardar.': 'Enter your full name before saving.',
 'Perfil atualizado com sucesso.': 'Profile updated successfully.',
 'Nao foi possivel guardar as alteracoes neste momento.': 'It was not possible to save changes right now.',
 'Adicione e edite os seus detalhes principais para manter o portal do cliente sempre atualizado.':
 'Add and edit your main details to keep the customer portal up to date.',
 'Login Administrativo': 'Admin Login',
 'Acesso restrito': 'Restricted access',
 'Acesso restrito a': 'Restricted access for',
 'staff e super admin': 'staff and super admin',
 'Email administrativo': 'Admin email',
 'Palavra-passe': 'Password',
 'Introduza a sua palavra-passe': 'Enter your password',
 'Entrar na area administrativa': 'Enter admin area',
 'Entrar no portal': 'Enter portal',
 'A entrar...': 'Signing in...',
 'Criar conta': 'Create account',
 'A criar conta...': 'Creating account...',
 'Nome completo': 'Full name',
 'Confirmar palavra-passe': 'Confirm password',
 'Repita a palavra-passe': 'Repeat password',
 'Agendar agora': 'Book now',
 'Entrar': 'Sign in',
 'Email': 'Email',
 'Telefone': 'Phone',
 'Dashboard': 'Dashboard',
 'Agenda': 'Schedule',
 'Fila': 'Queue',
 'Stock': 'Stock',
 'Catálogo': 'Catalog',
 'PDF Machine': 'PDF Machine',
 'Finanças': 'Finance',
 'Faturação': 'Billing',
 'Repositório': 'Repository',
 'Equipa': 'Team',
 'Administração': 'Administration',
 'Definições': 'Settings',
  'Documentos': 'Documents',
  'Clientes': 'Customers',
  'Fluxo de Clientes': 'Customer Flow',
  'Novos Clientes': 'New Customers',
  'Cliente Balcao': 'Walk-in Customer',
  'Cliente Balcão': 'Walk-in Customer',
};

const reverseExtraTranslations = Object.fromEntries(
 Object.entries(extraTranslations).map(([ptValue, enValue]) => [enValue, ptValue]),
);

function normalizeText(value: string) {
  return value
    .replace(/Client[eE]{2,}s/gi, (match) => (match[0] === 'c' ? 'clientes' : 'Clientes'))
    .replace(/Document[oO]{3,}s/g, 'Documentos')
    .replace(/([A-Za-zÀ-ÿ])\1{2,}/g, '$1')
    .replace(/[ \t]{2,}/g, ' ');
}

const localePairs = Object.keys(pt)
 .map((key) => [dictionaries.pt[key], dictionaries.en[key]] as [string, string])
 .filter(([ptValue, enValue]) => ptValue && enValue && ptValue !== enValue);

const extraPairs = Object.entries(extraTranslations);

function translateWithPairs(value: string, pairs: Array<[string, string]>) {
 return pairs
 .filter(([from]) => from.trim().length > 1)
 .sort((left, right) => right[0].length - left[0].length)
 .reduce((next, [from, to]) => next.split(from).join(to), value);
}

export function getDictionary(language: Language) {
 return dictionaries[language];
}

export function translateText(value: string, language: Language) {
 const normalized = normalizeText(value);
 const pairs =
 language === 'en'
 ? [...localePairs, ...extraPairs]
 : [...localePairs.map(([ptValue, enValue]) => [enValue, ptValue] as [string, string]), ...Object.entries(reverseExtraTranslations)];

 return normalizeText(translateWithPairs(normalized, pairs));
}

export function translateDom(root: ParentNode, language: Language) {
 const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
 const nodes: Text[] = [];

 while (walker.nextNode()) {
 nodes.push(walker.currentNode as Text);
 }

 nodes.forEach((node) => {
 const parent = node.parentElement;
 if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) {
 return;
 }

 const current = node.nodeValue ?? '';
 const next = translateText(current, language);
 if (next !== current) {
 node.nodeValue = next;
 }
 });

 root.querySelectorAll?.('input, textarea, button, [title], [aria-label]').forEach((element) => {
 ['placeholder', 'title', 'aria-label'].forEach((attribute) => {
 const current = element.getAttribute(attribute);
 if (!current) {
 return;
 }

 const next = translateText(current, language);
 if (next !== current) {
 element.setAttribute(attribute, next);
 }
 });
 });
}
