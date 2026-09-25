# 12 — Filas de Atendimento, SLA e Módulo Supervisor

## 1. Visão Geral
Módulo voltado para coordenadores de atendimento, supervisores de suporte e gerentes comerciais para monitoramento em tempo real da operação.

## 2. Requisitos Funcionais
1. **Monitoria ao Vivo (Cockpit do Supervisor):**
   - Lista de atendentes conectados com status atual (Disponível, Em Atendimento, Em Pausa, Offline).
   - Tempo de permanência no status atual com alertas de estouro de pausa.
   - Painel de conversas ativas com possibilidade de intervenção:
     - **Escuta Silenciosa:** O supervisor lê a conversa sem intervenção visível.
     - **Sussurro Interno:** Envio de orientações privadas que apenas o atendente visualiza.
     - **Assunção / Transbordo:** O supervisor assume diretamente o controle do ticket.
2. **Políticas de SLA (Acordo de Nível de Serviço):**
   - Configuração de TME (Tempo Médio de Espera) máximo tolerado por fila.
   - Configuração de TMA (Tempo Médio de Atendimento) por tipo de chamado.
   - Notificações sonoras e visuais para tickets próximos ao estouro de SLA.
   - Escalada automática de prioridade no estouro do prazo.
3. **Distribuição e Roteamento de Tickets:**
   - Round-robin circular entre operadores ativos.
   - Distribuição ponderada por menor número de conversas ativas.
   - Fila prioritária para clientes corporativos (Link Dedicado / B2B).
