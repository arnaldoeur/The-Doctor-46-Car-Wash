# Plano de Orquestração: Sistema de Administração Totalmente Funcional & Operacional

Este documento estabelece a arquitetura interna e o cronograma de execução para transformar todo o painel de administração da plataforma em um sistema 100% funcional, interativo e integrado, garantindo a **preservação absoluta da interface de usuário (UI), layout, cores, espaçamento, tipografia e barra de navegação atuais**.

---

## 🎯 Objetivos de Orquestração

1. **Unificação do Fluxo Operacional (Ponta a Ponta):**
   ```
   [ POS Venda ] ──┬──> [ Fila de Espera (Queue) ] ──> (Em Espera -> Em Lavagem -> Concluído)
                   ├──> [ Central PDF / Faturamento ] ──> Geração de Recibo / Fatura PDF
                   ├──> [ Estoque / Inventário ] ──> Dedução Automática de Insumos (Químicos/Shampoos)
                   ├──> [ Finanças (Finance) ] ──> Registro Imediato de Receita (+ Valor)
                   └──> [ Histórico de Auditoria ] ──> Log detalhado da operação e operador
   ```

2. **Persistência Robusta e Offline-Safe (`apiClient.ts`):**
   Implementar ou refinar todos os interceptores locais para que nenhuma informação (Serviços, Inventário, Membros da Equipe, Fila de Espera ou Configurações) seja perdida após recarregar a página ou navegar entre os módulos.

3. **Interatividade Completa sem Alteração Visual:**
   Ativar todos os botões, modais de visualização de detalhes (Central PDF, Finanças, Faturamento) e fluxos de estado (loading, sucesso, erro e modais de confirmação) mantendo a exata estética *premium dark*.

---

## 🏗️ Arquitetura de Dados & Sincronização entre Módulos

### 1. Fila de Espera (Queue Management)
- **Criação Automática:** Toda venda concluída no POS gera automaticamente um tíquete de fila (`Ticket #POS-...`) com status inicial `pending` (Em Espera).
- **Movimentação Operacional:** Os botões na fila de espera (Iniciar Lavagem, Concluir Lavagem e Remover) atualizarão o status e registrarão o evento no Histórico de Auditoria.

### 2. POS System & Catálogo de Serviços
- **Preservação de Serviços:** Os serviços do catálogo gerenciados em `Catalog.tsx` (criação, edição, exclusão) serão persistidos no localStorage (`doctor46_mock_catalog`), impedindo qualquer perda de dados ao recarregar.
- **Conexão Direta:** Finalizar a venda no POS não apenas gera o PDF, mas adiciona o item ao `doctor46_mock_documents`, abate os insumos do estoque e insere o log de venda nas Finanças.

### 3. PDF Center (Central de Documentos) & Faturamento
- **Visualizador e Pré-visualização:** Clicar em um documento na lista ou no botão de visualização em `Documents.tsx` ou `Billing.tsx` abrirá o modal de detalhes do documento ou fará o download instantâneo do PDF oficial formatado com o papel timbrado da empresa.

### 4. Finanças (Finance Module)
- **Cálculo Dinâmico em Tempo Real:** O resumo financeiro (`Receitas`, `Despesas`, `Lucro Líquido` e gráficos) será calculado dinamicamente a partir dos documentos emitidos e vendas concluídas.
- **Detalhamento:** O modal de transação selecionada exibirá as informações completas e conterá o botão *"Ver Documento Original"* perfeitamente funcional.

### 5. Inventário e Estoque (Inventory)
- **Abatimento Automático:** Cada venda de serviço de lavagem/detalhe no POS deduzirá automaticamente uma unidade padrão dos produtos de operação (ex: Shampoo, Cera) no estoque.
- **Alertas e Gestão:** Quantidades baixas (abaixo do estoque mínimo) acionarão badges de alerta amarelo/vermelho instantaneamente. Os botões de adição (`+`/`-`), edição e novo produto serão 100% persistidos.

### 6. Histórico, Equipe e Administração (History, Team, Settings)
- **Logs de Auditoria Reais:** Cada ação no sistema (venda no POS, movimentação na fila, ajuste de estoque, cadastro de membro) registrará um log detalhado em `doctor46_mock_audit_logs`.
- **Gestão de Equipe:** Criação de novos administradores/operadores e edição de status (`ativo`, `férias`, `inativo`) perfeitamente guardados.
- **Configurações Globais:** Dados da empresa (Razão social, NUIT, taxa de IVA) gravados e aplicados globalmente.

---

## 📋 Cronograma de Implementação (Fase de Execução)

### [ ] **Fase 2.1: Estrutura Base de Persistência (`apiClient.ts`)**
- Implementar chaves de armazenamento no localStorage para:
  - `doctor46_mock_catalog` (Catálogo de Serviços).
  - `doctor46_mock_inventory` & `doctor46_mock_movements` (Estoque).
  - `doctor46_mock_appointments` (Fila de Espera / Agendamentos).
  - `doctor46_mock_audit_logs` (Histórico de Ações).
  - `doctor46_mock_staff` (Membros da Equipe).
  - `doctor46_mock_settings` (Configurações Gerais).

### [ ] **Fase 2.2: Integração e Lógica dos Módulos Internos**
- **POS & Fila:** Refinar o fechamento de venda no POS para abastecer a Fila de Espera, o Estoque e as Finanças em um único ciclo assíncrono.
- **Central PDF:** Interligar a emissão manual e o faturamento para que todos os documentos gerados fiquem instantaneamente disponíveis para download e visualização.
- **Finanças e Histórico:** Conectar as tabelas e modais de detalhes aos dados dinâmicos locais recém-unificados.

### [ ] **Fase 2.3: Auditoria, Verificação e Testes**
- Executar `npm run lint` para garantir zero erros de tipagem.
- Validar todos os fluxos sem qualquer modificação na UI existente.

---

## ✅ Critérios de Aceitação (Definition of Done)
1. **Zero Redesign:** A aparência visual, barra lateral, espaçamentos e paleta de cores mantêm-se exatamente idênticas.
2. **Conexão Ponta a Ponta:** Uma venda realizada no POS reflete imediatamente na Fila de Espera, Estoque, Central PDF, Finanças e Histórico de Ações.
3. **Persistência Total:** Nenhuma informação inserida ou modificada é perdida após o recarregamento da página ou fechamento do navegador.
4. **Sem Erros de Compilação:** Linter executado com sucesso absoluto (`Exit code: 0`).
