# 18 — Trilha de Auditoria Imutável & Conformidade LGPD

## 1. Visão Geral
Sistema de auditoria de segurança baseado em encadeamento criptográfico linear SHA-256 e ferramentas de conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).

## 2. Encadeamento Criptográfico SHA-256 (Audit Trail)
1. **Hash Chain Linear:**
   - Cada evento de auditoria armazena o `previousHash` do registro anterior e calcula seu próprio `hashIntegridade = SHA-256(previousHash + timestamp + actorId + action + entityId + details + instanceId)`.
   - Bloqueio concorrente via PostgreSQL Advisory Lock por `instanceId` durante a inserção, evitando bifurcações ou forks na cadeia de auditoria.
2. **Eventos Auditados Obrigatoriamente:**
   - Autenticação e encerramento de sessão de operadores humanos (`AUTH_LOGIN`, `AUTH_LOGOUT`, falhas de login).
   - Criação, movimentação e exclusão de Deals e Contatos.
   - Toda execução de ferramenta pela MaIA com marcação `isMaiaAction = true` e identificação do solicitante.
   - Visualização e exportação de dados pessoais e relatórios.

## 3. Conformidade LGPD
1. **Direitos do Titular (Art. 18 LGPD):**
   - Relatório de exportação de dados pessoais do titular em formato estruturado legível.
   - Registro de termo de consentimento e base legal para comunicação via WhatsApp.
2. **Anonimização e Exclusão:**
   - Mecanismo seguro de anonimização cadastral para clientes cancelados com retenção estrita dos prazos legais do Marco Civil da Internet (Lei nº 12.965/2014) e resoluções da Anatel.
