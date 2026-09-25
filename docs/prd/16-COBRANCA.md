# 16 — Cobrança, Faturas & Pix Instantâneo

## 1. Visão Geral
Módulo financeiro integrado para visualização de faturas em aberto, geração de 2ª via, emissão de Pix dinâmico do Banco Central e automação de régua de cobrança para provedores de internet.

## 2. Requisitos Funcionais
1. **Faturas e Títulos do Assinante:**
   - Visualização de status: `PENDENTE`, `VENCIDA`, `PAGA`, `CANCELADA`.
   - Consulta detalhada: Data de vencimento, valor original, juros/multa por atraso e valor total atualizado.
2. **Pix Dinâmico com Baixa em Tempo Real:**
   - Geração de QR Code e Pix Copia e Cola via API do gateway bancário (ex: Gerencianet/Efí, Asaas, Itaú, Cora).
   - Webhook de notificação de liquidação do Pix:
     - Confirmação do pagamento no banco de dados.
     - Registro em auditoria.
     - Liberação imediata da conexão do cliente no SGP/Radius caso estivesse com corte comercial.
3. **Boletos Bancários:**
   - Exibição de linha digitável do boleto para pagamento em bancos convencionais e lotéricas.
   - Link direto para download do PDF da fatura/carnê.
4. **Governança Financeira (P0.12):**
   - Na ausência de credenciais reais do gateway de pagamento, o módulo opera em modo restrito/adapter sem forjar liquidações financeiras não autorizadas.
