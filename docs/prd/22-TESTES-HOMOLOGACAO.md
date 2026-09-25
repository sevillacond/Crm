# 22 — Suíte de Testes Automatizados & Critérios de Homologação

## 1. Visão Geral
Documentação da suíte automatizada de testes do Enlace-CRM (`test/run-tests.ts`), cobrindo testes unitários, de integração, segurança multi-tenant e fluxo ponta a ponta (E2E).

## 2. Cobertura da Suíte de Testes (43 Testes Essenciais)
1. **Autenticação & Segurança (Grupo 1):**
   - 1.1 a 1.3: Login com JWT, rejeição de senha incorreta e bloqueio de credenciais master hardcoded.
   - 1.4 a 1.6: Startup failure em produção por ausência de JWT_SECRET ou senha fraca de administrador.
   - 1.7: Logout com invalidação de sessão e token.
2. **Persistência, Concorrência & Políticas da MaIA (P0.4 - Testes 1 a 12):**
   - Criação e recuperação íntegra de aprovações com validação de `paramsHash`.
   - Isolamento cross-instance entre provedor A e provedor B.
   - Máquina de estados: Aprovação e rejeição com três identidades (solicitante, aprovador, executor).
   - Concorrência de dupla aprovação e dupla execução (apenas 1 vence atomicamente).
   - Detecção de adulteração de parâmetros (`PARAMS_HASH_MISMATCH`).
   - Fail-closed na indisponibilidade de banco de dados ou Redis.
3. **Auditoria Criptográfica (Grupo 3):**
   - Inserções concorrentes gerando cadeia linear de hashes SHA-256 sem bifurcação.
4. **RBAC Negativo & Isolamento de Domínio (Grupos 4 a 8):**
   - Proibição de ações indevidas por perfis TECNICO e ATENDENTE (exclusão de contatos, alteração de autonomia da MaIA, consulta a cobranças).
   - SGP Gateway: Instância não configurada nunca fabrica clientes fictícios (`NOT_CONFIGURED`).
   - P0.10: Rejeição de adulteração de `instanceId` enviado no payload.
   - P0.12: Simulador de viabilidade técnica nunca afirma portas físicas reais e sempre exibe aviso de MOCK.
   - P0.14: Fluxo E2E completo: Login ➔ Contato ➔ Deal ➔ Plano ➔ MaIA ➔ Aprovação ➔ Execução ➔ Auditoria.

## 3. Critérios de Homologação de Release
- 100% dos testes devem passar (`npm test` com 0 falhas).
- 100% de conformidade com o linter (`npm run lint` sem erros de TypeScript).
- Compilação estática (`npm run build`) concluída com sucesso.
