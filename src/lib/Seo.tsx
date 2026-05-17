import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type SeoMeta = {
 title: string;
 description: string;
 keywords?: string;
};

const SITE_URL = 'https://carwash46.com';
const DEFAULT_IMAGE = `${SITE_URL}/46-logo-icon.png`;
const DEFAULT_KEYWORDS =
 'car wash Lichinga, lavagem automovel Lichinga, detalhamento automovel, polimento automovel, higienizacao interior, carwash46, lavagem de carros Mozambique';

const publicMeta: Record<string, SeoMeta> = {
 '/': {
 title: 'The Doctor 46 Car Wash | Lavagem Automovel em Lichinga',
 description:
 'Lavagem automovel, polimento, higienizacao interior e agendamento online em Lichinga para viaturas particulares e frotas.',
 keywords: DEFAULT_KEYWORDS,
 },
 '/about': {
 title: 'Sobre Nos | The Doctor 46 Car Wash',
 description:
 'Conheca a equipa, a abordagem e o compromisso de qualidade do The Doctor 46 Car Wash em Lichinga.',
 },
 '/processo': {
 title: 'Nosso Processo | The Doctor 46 Car Wash',
 description:
 'Veja como funciona o nosso processo de lavagem, detalhe automovel, acabamento e controlo de qualidade.',
 },
 '/services': {
 title: 'Servicos | The Doctor 46 Car Wash',
 description:
 'Explore servicos de lavagem automovel, polimento tecnico, higienizacao interior e cuidados para frotas em Lichinga.',
 },
 '/booking': {
 title: 'Agendamento Online | The Doctor 46 Car Wash',
 description:
 'Marque a lavagem da sua viatura online com rapidez e receba atendimento organizado no The Doctor 46 Car Wash.',
 },
 '/contactos': {
 title: 'Contactos | The Doctor 46 Car Wash',
 description:
 'Fale com o The Doctor 46 Car Wash por telefone ou email e encontre a nossa localizacao em Lichinga, Niassa.',
 },
 '/login': {
 title: 'Portal de Acesso | The Doctor 46 Car Wash',
 description: 'Acesso ao portal do The Doctor 46 Car Wash.',
 },
};

function upsertMeta(selector: string, attributes: Record<string, string>, content: string) {
 let tag = document.head.querySelector(selector) as HTMLMetaElement | null;

 if (!tag) {
 tag = document.createElement('meta');
 Object.entries(attributes).forEach(([key, value]) => {
 tag?.setAttribute(key, value);
 });
 document.head.appendChild(tag);
 }

 tag.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
 let tag = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;

 if (!tag) {
 tag = document.createElement('link');
 tag.setAttribute('rel', rel);
 document.head.appendChild(tag);
 }

 tag.setAttribute('href', href);
}

export default function Seo() {
 const { pathname } = useLocation();

 useEffect(() => {
 const normalizedPath = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
 const isAdmin = normalizedPath.startsWith('/admin');
 const isCustomer = normalizedPath.startsWith('/customer');
 const isLogin = normalizedPath === '/login';
 const isPublicIndexable = !isAdmin && !isCustomer && !isLogin;

 const meta =
 publicMeta[normalizedPath] ??
 (isAdmin
 ? {
 title: 'Admin | The Doctor 46 Car Wash',
 description: 'Area administrativa do The Doctor 46 Car Wash.',
 }
 : isCustomer
 ? {
 title: 'Portal do Cliente | The Doctor 46 Car Wash',
 description: 'Portal do cliente do The Doctor 46 Car Wash.',
 }
 : publicMeta['/']);

 const canonicalUrl = `${SITE_URL}${normalizedPath === '/' ? '/' : normalizedPath}`;
 const robots = isPublicIndexable
 ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
 : 'noindex, nofollow';

 document.title = meta.title;
 document.documentElement.lang = 'pt';

 upsertMeta('meta[name="description"]', { name: 'description' }, meta.description);
 upsertMeta('meta[name="keywords"]', { name: 'keywords' }, meta.keywords ?? DEFAULT_KEYWORDS);
 upsertMeta('meta[name="robots"]', { name: 'robots' }, robots);
 upsertMeta('meta[property="og:title"]', { property: 'og:title' }, meta.title);
 upsertMeta('meta[property="og:description"]', { property: 'og:description' }, meta.description);
 upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
 upsertMeta('meta[property="og:image"]', { property: 'og:image' }, DEFAULT_IMAGE);
 upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, meta.title);
 upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, meta.description);
 upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, DEFAULT_IMAGE);
 upsertLink('canonical', canonicalUrl);
 }, [pathname]);

 return null;
}
