# The Doctor 46 Car Wash

Sistema web para gestao de car wash com website publico, portal do cliente, painel administrativo, POS, faturacao, stock e backend PHP/MySQL para Hostinger.

## Desenvolvimento

1. Instale as dependencias:
 ```bash
 npm install
 ```
2. Inicie o servidor local:
 ```bash
 npm run dev
 ```
3. Abra `http://localhost:3000`.

## Build

```bash
npm run build
```

Publique o conteudo de `dist/` em `public_html` na Hostinger.

## Backend

O backend fica em `public/api` e usa MySQL via PHP PDO. Configure `public/api/config.local.php` no servidor com as credenciais reais da base de dados.

Para usar o OpenRouter, adicione a chave em `public/api/config.local.php` ou em variaveis de ambiente:

- `OPENROUTER_API_KEY`
- `OPENROUTER_API_ENDPOINT` (opcional, o valor padrao e `https://api.openrouter.ai/v1/chat/completions`)

Nunca grave chaves reais, palavras-passe ou tokens no repositorio. Use `public/api/config.local.php` no servidor, ou variaveis de ambiente, e mantenha esse arquivo fora do controlo de versao.

## Estrutura

- `src/components`: componentes reutilizaveis do React.
- `src/pages`: paginas publicas, do cliente e administrativas.
- `src/hooks`: hooks de estado e dados.
- `src/lib`: clientes de API, utilitarios, catalogos e regras de negocio.
- `src/layouts`: layouts principais por area da aplicacao.
- `public/api`: backend PHP publicado junto com o build para Hostinger.
- `database/schema.sql`: schema MySQL canonico para desenvolvimento e scripts.
- `public/api/schema.sql`: copia usada pelo setup no ambiente publicado.
