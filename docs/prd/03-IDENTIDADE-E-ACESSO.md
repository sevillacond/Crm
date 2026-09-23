# 03 — Identidade e Controle de Acesso (RBAC)

## 1. Papéis de Usuário (Roles)
O Enlace-CRM adota RBAC granular adaptado ao cotidiano de provedores de internet:

1. **ADMIN (Administrador da Instância)**
   - Configurações gerais da instância (CNPJ, Razão Social, Planos de Fibra, Fuso horário).
   - Gerenciamento de operadores, filas e chaves de API da MaIA.
   - Acesso irrestrito a logs de auditoria e exportação LGPD.

2. **SUPERVISOR (Supervisor de Vendas/Atendimento)**
   - Visualização de todos os pipelines e relatórios de desempenho.
   - Atribuição e reatribuição de leads e negócios no Kanban.
   - Monitoramento de SLA e controle de intervenção na MaIA.

3. **ATENDENTE (Comercial / SDR)**
   - Gestão de contatos atribuídos e movimentação no pipeline Kanban.
   - Interação via Inbox Omnichannel com auxílio do co-piloto MaIA.
   - Registro de notas de viabilidade e envio de propostas.

4. **TECNICO (Suporte e Instalação)**
   - Consulta de dados técnicos de viabilidade, endereço e status de agendamento de OS.
   - Leitura de histórico de atendimento do assinante.

5. **MAIA_AGENT (Agente Sintético Autônomo)**
   - Identidade de sistema para ações executadas pela IA via Tool Gateway.
   - Todas as transações marcadas com `author: "MaIA (IA)"`.

## 2. Trilha de Auditoria (Audit Trail)
Todas as operações de criação, alteração, exclusão e visualização de dados sensíveis (CPF, telefone, endereço) são persistidas com:
- `timestamp`: ISO-8601
- `actorId`: ID do usuário ou MaIA
- `actorName` e `actorRole`
- `action`: Ex: `DEAL_MOVED`, `LEAD_QUALIFIED_BY_MAIA`, `CONTACT_CREATED`
- `entityType` e `entityId`
- `metadata`: diff ou payload higienizado
