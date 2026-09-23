# 02 — Arquitetura de Sistema Enlace-CRM

## 1. Princípio de Isolamento e Soberania
Cada Provedor de Internet contratante opera em uma **instância isolada por CNPJ**:
- Instância com banco de dados próprio (PostgreSQL isolado ou schema/banco dedicado).
- Chaves de integração, logs de auditoria e sessões de usuários estritamente contidos.
- Nenhuma base compartilhada (sem multi-tenant permissivo com risco de vazamento de leads entre concorrentes).

## 2. Diagrama Conceitual
```text
[ Cliente / Assinante ]
         │ (WhatsApp, Webchat, Telefonia SIP)
         ▼
┌────────────────────────────────────────────────────────┐
│             INSTÂNCIA DO PROVEDOR (CNPJ)               │
│                                                        │
│  [ PWA Frontend: React 19 + TypeScript + Tailwind CSS ]│
│                       │ (REST / SSE)                   │
│  [ Backend Node.js / Express / TypeScript ]           │
│         ├── Auth / RBAC & Audit Interceptor            │
│         ├── CRM & Pipeline Engine                      │
│         ├── MaIA Tool & MCP Gateway (Gemini 3.8 Flash)  │
│         └── Storage / Drizzle ORM                      │
│                       │                                │
│  [ PostgreSQL DB ] ── [ Redis / In-Memory Worker ]     │
└────────────────────────────────────────────────────────┘
```

## 3. Diretrizes Técnicas da MaIA (IA)
- **Princípio do Menor Privilégio:** MaIA NUNCA executa SQL direto ou acessa raw credentials.
- **Camada MCP / Tool Gateway:** MaIA invoca tools com schemas validados:
  - `consultar_viabilidade(cep, numero)`
  - `qualificar_lead(lead_id, score, resumo)`
  - `sugerir_plano(perfil_consumo)`
  - `criar_negocio(nome, telefone, plano_id)`
  - `mover_kanban_etapa(deal_id, target_stage)`
- **Auditoria Obrigatória:** Cada invocação de tool pela MaIA é registrada na trilha de auditoria com timestamp, parâmetros, resultado e hash da sessão.
