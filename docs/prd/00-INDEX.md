# Enlace-CRM
## PRD Modular — Índice Geral

**Produto:** Enlace-CRM  
**Organização:** Enlace  
**Arquitetura:** Instância isolada por provedor/CNPJ  
**Frontend:** 100% Enlace  
**Formato:** PWA  
**Backend:** TypeScript/Node.js  
**Banco:** PostgreSQL  
**ORM:** Drizzle ORM  
**IA:** MaIA  
**Referência funcional/técnica:** DeskcommCRM  
**Status:** PRD aprovado para desenvolvimento incremental

---

## 1. Objetivo deste PRD

Este documento define a estrutura do PRD modular do Enlace-CRM.
O projeto NÃO deve ser implementado a partir de um único documento gigante.
Cada arquivo representa um domínio funcional ou técnico específico.

### Estrutura

```text
docs/prd/
├── 00-INDEX.md
├── 01-VISAO-PRODUTO.md
├── 02-ARQUITETURA.md
├── 03-IDENTIDADE-E-ACESSO.md
├── 04-CRM-CORE.md
├── 05-KANBAN.md
├── 06-INBOX-OMNICHANNEL.md
├── 07-WHATSAPP.md
├── 08-WEBCHAT.md
├── 09-WEBPHONE.md
├── 10-FLUXOS-ATENDIMENTO.md
├── 11-MAIA.md
├── 12-FILAS-SLA-SUPERVISOR.md
├── 13-BASE-CONHECIMENTO.md
├── 14-CAMPANHAS.md
├── 15-INTEGRACOES.md
├── 16-COBRANCA.md
├── 17-RELATORIOS.md
├── 18-AUDITORIA-LGPD.md
├── 19-INFRA-CONTAINERS.md
├── 20-SEGURANCA.md
├── 21-OBSERVABILIDADE-BACKUP.md
├── 22-TESTES-HOMOLOGACAO.md
├── 23-DEPLOY-OPERACAO.md
├── 24-LIMITES-DO-PRODUTO.md
└── 25-AJUDA-SOP-OPERACIONAL.md
```

### Documentações Complementares
- **Manual do Agente MaIA**: `AGENTE.md` (e `docs/AGENTE.md`)
- **Guia de Deploy em Produção**: `docs/DEPLOY.md`
- **Módulo de Ajuda & Glossário no CRM**: `src/components/AjudaView.tsx`

---

## 2. Regras Fundamentais de Engenharia

1. Instância isolada (single-tenant per ISP/CNPJ). Nenhum dado operacional cruza instâncias.
2. MaIA (IA) com acesso via MCP/Tool Gateway auditado, sem acesso irrestrito ao banco.
3. Fluxo incremental com critério de aceite: IMPLEMENTADO, TESTADO, DOCUMENTADO, VALIDADO.
4. Enlace-CRM não é ERP/SGP/PBX/Gateway bancário, mas integra-se perfeitamente a eles.
