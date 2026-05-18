# Plano de Implementação: Correção do Painel Admin & UI/UX do Carrinho de Vendas (POS)

## Objetivo
Corrigir a falha de autenticação e acesso ao painel administrativo (login admin) em ambientes locais/demo e reformular totalmente a experiência UI/UX do sistema de pagamento e carrinho de vendas (`POS.tsx`), otimizando espaçamentos, ícones das carteiras móveis (M-Pesa, e-Mola, Mkesh) e a responsividade em dispositivos móveis, tablets e desktops.

## Tarefas

- [ ] **Tarefa 1: Correção do Sistema de Autenticação e Login Admin** (`src/lib/apiClient.ts`, `src/pages/admin/AdminLogin.tsx`, `src/providers/AuthProvider.tsx`)
  - **Ação:** Implementar em `apiClient.ts` um fallback de mock robusto baseado em `localStorage` (`doctor46_session`) para interceptar `auth.login`, `auth.me` e `auth.logout`. Em dev local ou modo demonstração, ao autenticar com e.g. `geral@carwash46.com`, gerar um perfil `staff`/`super_admin` válido e persistente.
  - **Ação:** Em `AdminLogin.tsx`, adicionar botões de preenchimento rápido para credenciais de demonstração (Super Admin e Staff), permitindo login em 1 clique sem fricção.
  - **Verificação:** Acessar `/admin/login`, clicar no botão de preenchimento de Super Admin, clicar em Entrar e verificar o redirecionamento imediato para `/admin/dashboard` sem erros.

- [ ] **Tarefa 2: Reformulação UI/UX do Carrinho de Vendas (POS)** (`src/pages/admin/POS.tsx`)
  - **Ação:** Corrigir a altura e layout do container principal (`flex-col lg:flex-row min-h-[calc(100vh-6rem)]`) para impedir cortes de informação no carrinho.
  - **Ação:** Otimizar o estado de carrinho vazio com um visual moderno e limpo.
  - **Ação:** Refinar os itens do carrinho com formatação premium de valores e botões de incremento/decremento com feedback tátil e visual.
  - **Ação:** Melhorar os métodos de pagamento ("Dinheiro" vs "Carteira Móvel") com cartões interativos, bordas luminosas (glow) e transições suaves com Framer Motion.
  - **Ação:** No seletor de "Carteira Móvel" (M-Pesa, E-Mola, Mkesh), aumentar o tamanho dos ícones (`w-14 h-14`), ajustar os espaçamentos e destacar visualmente a operadora ativa.
  - **Verificação:** Adicionar itens ao carrinho, alternar entre métodos de pagamento e verificar a clareza, alinhamento e beleza da interface.

- [ ] **Tarefa 3: Otimização Responsiva (Mobile, Tablet, Desktop)** (`src/pages/admin/POS.tsx`)
  - **Ação:** Garantir que em telas mobile e tablet o layout se adapte verticalmente de forma harmônica, mantendo o botão de checkout sempre acessível e visível.
  - **Verificação:** Simular resoluções de smartphone (375px/430px), tablet (768px) e desktop (1440px) no navegador para confirmar a fluidez da interface.

## Critérios de Conclusão (Done When)
- [ ] O painel administrativo abre e realiza login com sucesso em modo de desenvolvimento local e demonstração.
- [ ] O carrinho de vendas no POS exibe todas as informações perfeitamente, com espaçamentos precisos, ícones das operadoras bem dimensionados e sem cortes.
- [ ] O fluxo de vendas e emissão de documento (recibo/fatura) funciona com perfeição.
- [ ] A interface comporta-se de forma fluida e responsiva em todas as resoluções (mobile, tablet, desktop).
