# Plano de Implementação: Checkout Premium Estilo Stripe no POS

Este plano detalha a arquitetura e as etapas necessárias para transformar o sistema de pagamento do POS (`POS.tsx`) em uma experiência altamente funcional, fluida e sofisticada inspirada no Stripe Checkout, mantendo estritamente a identidade visual *minimal dark premium* original sem sobrecarregar a interface.

---

## 🎯 Objetivos Principais

1. **Lógica de Pagamento Integral e Sincronizada:** Garantir o funcionamento ponta a ponta dos pagamentos em Dinheiro e Carteiras Móveis (M-Pesa, E-Mola, Mkesh) com prevenção de cliques duplos, feedback visual imersivo e atualização automática do histórico de transações.
2. **Cálculo em Tempo Real (Dinheiro):** Validação estrita de valores de entrada, exibição dinâmica do troco devido e bloqueio seguro contra pagamentos insuficientes.
3. **Experiência Push Realista (Carteiras Móveis):** Ciclo de vida completo com estados de validação, processamento animado (spinner/pulse), desativação temporária de inputs, opção de cancelamento/retry e transição limpa para a tela de aprovação.
4. **Preservação da Estética Minimal Dark:** Nenhuma adição de cards supercoloridos ou elementos ruidosos. O modal de celular permanecerá limpo, focando no input de telefone com prefixo `🇲🇿 +258` e parágrafo explicativo simples abaixo.

---

## 🏗️ Arquitetura e Gestão de Estados (Stripe-Style)

### 1. Estados do Ciclo de Vida do Pagamento (`PaymentState`)
O modal adotará um fluxo de estado determinístico para eliminar inconsistências:
- `idle`: Aguardando interação do usuário.
- `validating`: Validando dados de entrada (valor em dinheiro ou formato do telefone).
- `processing`: Comunicação assíncrona em andamento (comunicação com a operadora ou gravação no banco de dados/localStorage).
- `success`: Transação aprovada com sucesso. Emissão e download do recibo/fatura.
- `failed` / `timeout`: Falha de saldo ou esgotamento do tempo limite (60s no Push), com ações rápidas para tentar novamente ou trocar de método.
- `cancelled`: Cancelamento manual acionado pelo operador durante a fase de espera.

### 2. Sincronização Instantânea do Histórico de Vendas
- Ao concluir o pagamento com sucesso, a função `createBusinessDocument` invocará a API e/ou o gerenciador de cache local (`apiClient.ts`). O novo documento emitido será imediatamente unificado no estado global da sessão, atualizando a grelha de relatórios e histórico instantaneamente sem necessidade de recarregar a página.

---

## 📋 Detalhamento das Tarefas (Fase de Implementação)

### [ ] **Tarefa 1: Refatoração da Lógica de Pagamento em Dinheiro (`POS.tsx`)**
- **Validação e Troco:** Implementar sanitização para aceitar apenas números e ponto decimal. Calcular `change = amountReceived - total`.
- **Bloqueio de Insuficiência:** Se o valor recebido for menor que o total, desabilitar o botão de confirmação e exibir uma notificação de alerta discreta e elegante em vermelho/âmbar escuro.
- **Conclusão:** Ao clicar em *"Confirmar Recebimento e Emitir Recibo"*, disparar o estado de `processing` (desabilitando o botão e exibindo ícone de loading). Finalizar criando o documento oficial, limpando o carrinho, fechando o modal e acionando o Toast flutuante de sucesso.

### [ ] **Tarefa 2: Ciclo de Vida do Push Payment (M-PESA / E-MOLA / MKESH)**
- **Input Minimalista:** Preservar o input escuro com borda sutil e o prefixo com a pequena bandeira (`🇲🇿 +258`).
- **Validação de Celular Moçambicano:** Formatar em tempo real no padrão `84 XXX XXXX` ou `82 XXX XXXX`.
- **Botão Customizado:** O botão principal exibirá o texto estritamente formatado *"Pagar com M-PESA"* (ou a carteira selecionada: *"Pagar com E-MOLA"*, *"Pagar com MKESH"*).
- **Simulação do Push:** Ao clicar, alterar o estado para `processing`. Exibir o spinner de alta qualidade com a mensagem *"Aguardando confirmação no celular do cliente..."*. Bloquear inputs. Iniciar um temporizador de aprovação (ex: 4-5s) e um timeout máximo (60s). Permitir cancelar manualmente através de um link/botão discreto de *"Cancelar e Voltar para Opções"*.
- **Transição de Sucesso:** Exibir ícone de sucesso animado com Framer Motion, gerar o número de referência e o botão *"Emitir Recibo Oficial"*.

### [ ] **Tarefa 3: Microinterações e Feedback Visual (Stripe Details)**
- **Transições Suaves:** Utilizar `<AnimatePresence>` do `framer-motion` para abrir/fechar o modal de pagamento, exibir o aviso de troco ou a mensagem de insuficiência de fundos de maneira perfeitamente fluida.
- **Notificação de Sucesso Premium:** Um Toast flutuante posicionado no canto inferior direito informará o sucesso da transação com clareza e elegância.
- **Responsividade:** Garantir que o teclado numérico em dispositivos móveis não sobreponha os elementos vitais de confirmação.

### [ ] **Tarefa 4: Verificação e Testes de Qualidade**
- Executar `npm run lint` para certificar que a tipagem do TypeScript está 100% correta.
- Executar e testar todas as transições de pagamento em modo demonstração/dev local para comprovar o funcionamento impecável de todos os fluxos.

---

## ✅ Critérios de Aceitação (Definition of Done)
1. O fluxo de pagamento em dinheiro calcula o troco e impede transações insuficientes de forma fluida.
2. O fluxo de carteiras móveis reflete o ciclo de vida real de um Push Payment (idle, processing, success, timeout, cancelled) sem usar cards coloridos ou quebrar o visual minimalista.
3. O botão de pagamento móvel exibe exatamente o texto obrigatório *"Pagar com M-PESA"* (dinâmico conforme a carteira escolhada).
4. O histórico de transações e relatórios é atualizado em tempo real na conclusão da venda.
5. Nenhuma regressão visual ou erro de compilação no linter (`Exit code: 0`).
