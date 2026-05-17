# Plano de Implementação: Tradução e Encoding do Doctor 46 Car Wash

Este documento descreve o plano detalhado para corrigir todos os problemas de codificação de caracteres (encoding UTF-8) e reestruturar o sistema de internacionalização (i18n) para uma abordagem declarativa baseada em React Context, eliminando as strings fixas (hardcoded) em toda a aplicação.

---

## 1. Visão Geral (Overview)

A aplicação "The Doctor 46 Car Wash" possui um sistema de tradução híbrido:
1. Um **LanguageProvider** que fornece um método `{ t }` simples para algumas strings básicas.
2. Um sistema dinâmico baseado em **MutationObserver** (`translateDom.ts`) que monitoriza alterações do DOM e substitui strings traduzidas pós-renderização.

**Problemas Atuais:**
- **Encoding Quebrado:** O arquivo `pt.json` possui termos gravados literalmente com o caractere `?` (ex: `Cat?logo`, `Finan?as`), que se propagam para a interface.
- **Inconsistências Visuais:** O `MutationObserver` é frágil, altera os nós do DOM fora do fluxo do React, gerando "flashes" de tradução, dupla tradução, conflitos de renderização que travam componentes dinâmicos e quebras ao navegar entre páginas.
- **Strings Hardcoded:** Páginas importantes (como o POS, Stock, Agenda, Finanças e Faturamento) possuem dezenas de strings diretamente em português, sem mapeamento de tradução.

**Solução:**
1. **Corrigir na Fonte:** Converter os termos corrompidos em `pt.json` para acentuações portuguesas válidas em formato UTF-8 nativo.
2. **Abordagem Declarativa React:** Abandonar o tradutor por `MutationObserver`. Utilizar a função `{ t }` do `useLanguage` em todas as páginas e layouts.
3. **Mapeamento de Hardcoded Strings:** Mapear e mover todas as strings fixas de todos os 13 componentes de administração, do portal do cliente e das páginas públicas para os arquivos `pt.json` e `en.json`.
4. **Estado em Tempo Real:** Manter a troca de idioma instantânea através do estado do Context, salvando e restaurando via `localStorage`.

---

## 2. Tipo de Projeto (Project Type)

- **Tipo:** **WEB** (React 19, TypeScript, Vite, Tailwind CSS v4)
- **Primary Agent:** `frontend-specialist` (Interface e re-renderização)
- **Secondary Agents:** `debugger` (Correções de encoding) e `test-engineer` (Validação e scripts)

---

## 3. Critérios de Sucesso (Success Criteria)

- [ ] **Zero caracteres quebrados (`?`):** Palavras como `Catálogo`, `Finanças`, `Faturação`, `Repositório`, `Histórico` e `Administração` renderizadas com acentuação correta.
- [ ] **Sem MutationObserver:** A tradução deve ocorrer 100% via ciclo de renderização do React (`t("key")`).
- [ ] **Troca de idioma instantânea:** Sem recarregamento de página (no-reload), com persistência no `localStorage`.
- [ ] **Todas as strings mapeadas:** Eliminação de 100% de hardcoded strings nos 13 componentes de administração, páginas de clientes e layouts.
- [ ] **Nenhuma regressão:** Layouts e regras de negócio de checkout (POS), filtros de stock, gráficos de finanças e PDFs mantidos intactos.

---

## 4. Pilha Tecnológica (Tech Stack)

- **Core:** React 19, TypeScript, React Router DOM v7
- **Estilização:** CSS-first Tailwind CSS
- **Tradução:** React Context API nativo (`useLanguage`)
- **Dados:** Integração real com MySQL / API

---

## 5. Estrutura de Arquivos Afetados

Abaixo está o mapeamento dos arquivos que serão criados ou editados:

```
src/
├── i18n/
│   ├── locales/
│   │   ├── pt.json           <-- CORRIGIR termos acentuados com "?" e ADICIONAR novas chaves
│   │   └── en.json           <-- ADICIONAR novas chaves equivalentes em Inglês
│   └── translateDom.ts       <-- LIMPAR/DEPRECAR MutationObserver e dinâmicos (manter utilitários necessários)
├── providers/
│   └── LanguageProvider.tsx  <-- REMOVER MutationObserver, manter React Context puro e de alta performance
├── layouts/
│   ├── AdminLayout.tsx       <-- Validar e corrigir chamadas i18n
│   ├── PublicLayout.tsx      <-- Validar e corrigir chamadas i18n
│   └── CustomerLayout.tsx    <-- Validar e corrigir chamadas i18n
└── pages/
    ├── admin/                <-- REMOVER hardcoded strings e INTEGRAR useLanguage em todos os 14 arquivos:
    │   ├── Dashboard.tsx
    │   ├── POS.tsx
    │   ├── Queue.tsx
    │   ├── Inventory.tsx
    │   ├── Agenda.tsx
    │   ├── Catalog.tsx
    │   ├── Documents.tsx
    │   ├── Finance.tsx
    │   ├── Billing.tsx
    │   ├── Repository.tsx
    │   ├── History.tsx
    │   ├── Team.tsx
    │   ├── Settings.tsx
    │   └── AdminLogin.tsx
    ├── customer/             <-- INTEGRAR useLanguage em todos os 5 arquivos:
    │   ├── Dashboard.tsx
    │   ├── Profile.tsx
    │   ├── Appointments.tsx
    │   ├── History.tsx
    │   └── Loyalty.tsx
    └── public/               <-- INTEGRAR useLanguage nas páginas públicas principais:
        ├── Home.tsx
        ├── About.tsx
        ├── Services.tsx
        ├── Booking.tsx
        ├── Contact.tsx
        ├── Process.tsx
        └── Login.tsx
```

---

## 6. Cronograma e Divisão de Tarefas (Task Breakdown)

### Fase 1: Análise e Fundação (Encoding & Limpeza)

#### Tarefa 1.1: Correção de Encoding em `pt.json`
- **Agente:** `debugger`
- **Skills:** `clean-code`
- **Prioridade:** P0
- **Dependências:** Nenhuma
- **Descrição:** Corrigir os termos acentuados no dicionário de Português e garantir que esteja em UTF-8 nativo.
- **INPUT:** Arquivo `src/i18n/locales/pt.json` com termos corrompidos.
- **OUTPUT:** Arquivo `src/i18n/locales/pt.json` totalmente corrigido com acentuação correta (`Catálogo`, `Finanças`, etc.).
- **VERIFICAÇÃO:** Fazer leitura do arquivo via `view_file` e certificar que não restam caracteres `?`.

#### Tarefa 1.2: Refatoração do `LanguageProvider` e `translateDom`
- **Agente:** `frontend-specialist`
- **Skills:** `clean-code`, `react-best-practices`
- **Prioridade:** P0
- **Dependências:** Tarefa 1.1
- **Descrição:** Remover o `MutationObserver` e as manipulações diretas do DOM de `LanguageProvider.tsx`. Manter o provider puramente reativo com base no Context API e atualizar `translateDom.ts` se necessário para funções de correspondência direta (se houver fallbacks de tradução).
- **INPUT:** `src/providers/LanguageProvider.tsx` and `src/i18n/translateDom.ts`
- **OUTPUT:** `LanguageProvider` limpo, sem hooks de MutationObserver, gerindo apenas o estado reativo `{ language, setLanguage, t, translate }`.
- **VERIFICAÇÃO:** Garantir que o TypeScript compila sem erros.

---

### Fase 2: Mapeamento de Tradução (Admin ERP)

#### Tarefa 2.1: Mapeamento de Telas Críticas (POS, Stock, Agenda, Dashboard)
- **Agente:** `frontend-specialist`
- **Skills:** `clean-code`, `react-best-practices`
- **Prioridade:** P1
- **Dependências:** Tarefa 1.2
- **Descrição:** Extrair todas as strings de UI fixas nos arquivos `POS.tsx`, `Inventory.tsx`, `Agenda.tsx` e `Dashboard.tsx` para `pt.json` e `en.json`, substituindo-as por `{t("key")}` usando o hook `useLanguage()`.
- **INPUT:** Páginas críticas no ERP administrativo.
- **OUTPUT:** Páginas utilizando `{t("key")}` e dicionários atualizados com chaves coerentes como `admin.pos.*`, `admin.inventory.*`, etc.
- **VERIFICAÇÃO:** O build deve continuar funcionando e o console limpo.

#### Tarefa 2.2: Mapeamento das Telas de Gestão (Catálogo, Queue, Equipa, Finanças, Faturação)
- **Agente:** `frontend-specialist`
- **Skills:** `clean-code`
- **Prioridade:** P1
- **Dependências:** Tarefa 2.1
- **Descrição:** Extrair as strings fixas de `Catalog.tsx`, `Queue.tsx`, `Team.tsx`, `Finance.tsx`, `Billing.tsx` e `Documents.tsx`.
- **INPUT:** Ficheiros TSX administrativos secundários.
- **OUTPUT:** Páginas atualizadas com chaves estruturadas `admin.catalog.*`, `admin.queue.*`, etc.
- **VERIFICAÇÃO:** Código limpo e sem strings hardcoded legíveis diretamente.

#### Tarefa 2.3: Mapeamento de Configurações e Repositório (Settings, Repository, History, AdminLogin)
- **Agente:** `frontend-specialist`
- **Skills:** `clean-code`
- **Prioridade:** P2
- **Dependências:** Tarefa 2.2
- **Descrição:** Traduzir `Settings.tsx`, `Repository.tsx`, `History.tsx` e `AdminLogin.tsx`.
- **INPUT:** Páginas administrativas finais.
- **OUTPUT:** Páginas totalmente internacionalizadas.
- **VERIFICAÇÃO:** Validação de tipos com tsc.

---

### Fase 3: Portal do Cliente e Website Público

#### Tarefa 3.1: Internacionalização do Portal do Cliente
- **Agente:** `frontend-specialist`
- **Skills:** `clean-code`
- **Prioridade:** P1
- **Dependências:** Tarefa 1.2
- **Descrição:** Substituir strings fixas e garantir internacionalização no diretório `src/pages/customer/` (Dashboard, Profile, Appointments, History, Loyalty) utilizando o hook `useLanguage()`.
- **INPUT:** Ficheiros TSX da pasta `customer/`.
- **OUTPUT:** Portal do cliente dinamicamente traduzido.
- **VERIFICAÇÃO:** Tipos e navegação validados.

#### Tarefa 3.2: Validação de Páginas Públicas e Formulários
- **Agente:** `frontend-specialist`
- **Skills:** `clean-code`
- **Prioridade:** P2
- **Dependências:** Tarefa 1.2
- **Descrição:** Verificar se as páginas públicas (`Home.tsx`, `About.tsx`, `Services.tsx`, `Booking.tsx`, `Contact.tsx`, `Process.tsx`, `Login.tsx`) possuem alguma string em falta e mapear se necessário. Garantir que os alertas, placeholders e botões de agendamento respondam instantaneamente ao switch de idioma.
- **INPUT:** Pasta `src/pages/public/`.
- **OUTPUT:** Dicionários com traduções consistentes.
- **VERIFICAÇÃO:** Comportamento visual.

---

## 7. Fase X: Verificação Final (MANDATORY SCRIPT EXECUTION)

> [!IMPORTANT]
> **A tarefa não é dada como finalizada antes de passarem todos os testes do pipeline de auditoria.**

Para validar de forma rigorosa que nada foi quebrado no layout ou na lógica do negócio:

```powershell
# 1. Validar tipos e sintaxe do TypeScript
npm run lint

# 2. Executar script de segurança (OWASP e dependências)
python .agent/skills/vulnerability-scanner/scripts/security_scan.py .

# 3. Executar o build de produção do Vite para testar se tudo compila perfeitamente
npm run build

# 4. Iniciar servidor local para testes em runtime
# O translate global deve persistir no localStorage e alterar sem fazer page reload
```

---

## 8. Estratégia de Recuperação (Rollback)

Se qualquer componente quebrar devido a chaves em falta ou erros de compilação:
1. Usar controle de versão do git para isolar alterações em blocos de arquivos.
2. Manter fallbacks automáticos nas chamadas `{t("key")}` de forma que se uma tradução não existir no JSON, o próprio texto da chave seja exibido de forma inteligível em vez de crashar a aplicação. Exemplo: `t("admin.pos.cart_empty", "Carrinho vazio")` ou fallback nativo configurado no provider.

---

## ✅ FASE X STATUS BOARD
- Lint e TypeScript: ⏳ Waiting
- Tradução Instantânea sem Reload: ⏳ Waiting
- Correção UTF-8 em JSON/TSX: ⏳ Waiting
- Cobertura de Componentes Admin (13/13): ⏳ Waiting
- Cobertura de Componentes Cliente (5/5): ⏳ Waiting
- Cobertura de Páginas Públicas (7/7): ⏳ Waiting
