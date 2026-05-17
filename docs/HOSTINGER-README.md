# Hostinger Deploy

Este projeto esta preparado para publicacao na Hostinger usando o dominio `carwash46.com`.

## O Que Ja Esta Pronto

- build estatico com Vite;
- roteamento SPA com `.htaccess`;
- backend PHP em `api/index.php`;
- schema MySQL e instalador inicial em `api/setup_db.php`;
- `robots.txt`, `sitemap.xml` e `site.webmanifest`;
- metadados basicos para SEO e partilha social.

## Estrutura Recomendada Na Hostinger

Publique o conteudo de `dist/` dentro de `public_html`.

Como esta aplicacao usa frontend estatico com backend PHP:

- nao precisa de Node.js no servidor;
- precisa de PHP com PDO MySQL ativo;
- precisa da base de dados MySQL criada no hPanel;
- os ficheiros `api/config.local.php` e `api/setup_db.php` fazem a ligacao e a instalacao inicial.

## Configuracao MySQL

1. No hPanel, abra `Databases > Remote MySQL`.
2. Adicione o IP que vai aceder ao MySQL. Para testar a partir de qualquer origem, escolha `Any Host`; depois restrinja para os IPs reais.
3. Copie `public/api/config.local.example.php` para `public/api/config.local.php`.
4. Preencha a password da base de dados, uma password forte do super admin e um token longo em `setup.token`.
5. Rode `npm run build`.
6. Publique o conteudo de `dist/` em `public_html`.
7. Abra `https://carwash46.com/api/setup_db.php?token=SEU_TOKEN` uma unica vez para criar/atualizar as tabelas.
8. Depois de confirmar sucesso, remova `api/setup_db.php` do servidor ou mude o token.

## Verificacoes Apos Publicar

Teste estas rotas diretamente no navegador:

- `/`
- `/about`
- `/processo`
- `/services`
- `/booking`
- `/contactos`
- `/admin/dashboard`
- `/admin/catalog`
- `/admin/documents`
- `/admin/pos`

Tambem confirme:

- `https://carwash46.com/robots.txt`
- `https://carwash46.com/sitemap.xml`
- `https://carwash46.com/api/index.php?action=public.service_catalog`

## Nota Importante

Nao publique passwords em repositorios ou chats. O ficheiro `config.local.php` fica ignorado localmente e deve ser tratado como segredo.
