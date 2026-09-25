# 11 — MaIA: Motor de Automação e Inteligência Artificial

## 1. Visão Geral e Arquitetura de Governança
A **MaIA** é o motor de IA especializado em operações de ISPs, acionada pelo Google Gemini 2.5 Flash via `@google/genai`. Opera sob isolamento single-tenant e controle rigoroso de autonomia.

## 2. Níveis de Autonomia Operacional
- **N0 (Desativada):** Não responde nem executa ferramentas.
- **N1 (Informativo):** Consulta planos, catálogos públicos e informações institucionais sem alterar dados.
- **N2 (Copiloto Assistente):** Sugere respostas para atendentes, qualifica leads e calcula scores heurísticos.
- **N3 (Execução Supervisionada):** Cria solicitações de aprovação (`maia_approval_requests`) com hash canônico (`paramsHash`). Ação só executa após autorização explícita de operador humano na UI.
- **N4 (Autônoma Regulada):** Execução direta de ferramentas previamente homologadas pela política da instância com registro imutável em auditoria.

## 3. Segurança e Prevenção de Falhas (Fail-Closed)
1. **Sem Acesso SQL Direto:** A IA nunca executa comandos de banco de dados ou acessa raw credentials.
2. **Hash Anti-Tamper:** Na criação de uma aprovação em N3, calcula-se o hash SHA-256 canônico dos parâmetros. Se houver divergência no momento da execução, a ação é bloqueada com `PARAMS_HASH_MISMATCH`.
3. **Máquina de Estados de Aprovação:**
   `PENDING_APPROVAL` ➔ `APPROVED` / `REJECTED` ➔ `EXECUTING` ➔ `EXECUTED` / `FAILED`. Concorrência protegida via atomicidade no PostgreSQL.
4. **Isolamento de Tenant:** Todas as ferramentas e consultas filtram obrigatoriamente por `instanceId` fornecido pelo `ActorContext` do token autenticado.
5. **Governança de Viabilidade Técnica (P0.12):**
   - Viabilidade opera atualmente em sandbox/simulação (MOCK).
   - Proibido declarar disponibilidade de portas físicas em CTOs sem vistoria técnica de campo.
   - Respostas da MaIA sobre viabilidade contêm aviso mandatório de simulação não-vinculante.
