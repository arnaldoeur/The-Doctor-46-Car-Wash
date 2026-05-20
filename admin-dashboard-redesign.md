# 🚀 Plano de Refatoração Premium do Admin Dashboard (The Doctor 46)

## Visão Geral
Transformar o painel administrativo em uma interface SaaS *production-grade*, inspirada em padrões premium como Stripe, Linear e Apple UI. O objetivo é criar uma experiência *mobile-first*, fluida, elegante e consistente.

## 🛠️ Fases de Implementação

### Fase 1: Fundação & Layout (AdminLayout.tsx)
- Melhorar a **Sidebar**: Torná-la mais elegante, com melhor contraste, *hover states* sutis e colapsável de forma nativa/responsiva.
- Padronizar o **Grid System & Spacing**: Garantir que as margens e paddings sejam consistentes (ex: `p-4` mobile, `p-8` desktop).
- Melhorar o Header: Avatar e *breadcumbs* ou títulos mais polidos.
- Ajustar os efeitos de *Glow/Glassmorphism* para que não pareçam amadores (evitar excessos, focar na sutileza).

### Fase 2: Dashboard Principal (Dashboard.tsx)
- Refatorar KPI Cards: Melhorar a hierarquia visual dos números e contrastes.
- Melhorar Gráficos: Alinhamento, *tooltips* mais limpos.
- Listas de Atividade Recente: Espaçamento profissional e badges de status refinados.

### Fase 3: Ponto de Venda (POS.tsx)
- Refatorar Grid de Serviços: Cards mais clicáveis, com foco claro.
- Melhorar Carrinho/Checkout: Fixar corretamente no Desktop sem overflow, experiência responsiva impecável no mobile.
- Refinar Seleção de Pagamento: Feedbacks visuais premium e de alto contraste.

### Fase 4: Fila de Espera (Queue.tsx)
- Refatorar layout Kanban/Lista: Organização clara dos status (Em Espera, Lavando, Pronto).
- Melhorar botões de ação e *touch targets* no mobile.

### Fase 5: Inventário (Inventory.tsx)
- Refatorar Tabela: Remover scrollbars feias, garantir responsividade da tabela.
- Refinar cabeçalho e filtros.

## 🎨 Princípios de Design a Aplicar
1. **Contraste & Hierarquia:** Usar tons de cinza escuro de forma inteligente (`bg-[#0A0A0A]` para o fundo principal, `bg-[#141414]` para cards com borda sutil `border-white/5`).
2. **Tipografia Premium:** Usar fontes com pesos consistentes, `tracking-tight` para títulos.
3. **Animações (Framer Motion):** Transições suaves (`duration-300 ease-out`), micro-interações em botões.
4. **Cores:** Remover cores inconsistentes, manter um "Primary" bem definido (provavelmente azul Stripe/Vercel) e paleta de *status* clara (Verde, Amarelo, Vermelho sutis).
