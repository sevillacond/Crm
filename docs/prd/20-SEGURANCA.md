# 20 — Segurança da Informação, Hardening & Fail-Closed

## 1. Visão Geral
Diretrizes e mecanismos de defesa em profundidade aplicados em todas as camadas do Enlace-CRM, assegurando confidencialidade, integridade e disponibilidade das operações do provedor de internet.

## 2. Pilares de Segurança
1. **Startup Failure & Validação de Ambiente:**
   - O backend se recusa a iniciar em ambiente de produção (`NODE_ENV=production`) caso:
     - `JWT_SECRET` não esteja configurado ou possua menos de 32 caracteres;
     - `ADMIN_INITIAL_PASSWORD` não esteja configurado ou utilize senhas conhecidas/fracas (`admin`, `123456`, `password`);
     - `CORS_ORIGINS` não esteja expressamente definido (bloqueio de origens genéricas `*`).
2. **Isolamento de Tenants e Prevenção Cross-Instance (P0.1 & P0.10):**
   - Constraints compostas de integridade referencial no PostgreSQL (`id` + `instance_id`).
   - O backend extrai o `instanceId` exclusivamente do payload autenticado e assinado do JWT (`ActorContext`), ignorando qualquer `instanceId` fornecido no corpo (body) da requisição pelo cliente.
3. **Fail-Closed em Serviços Críticos (P0.4 & P0.8):**
   - Se o banco de dados PostgreSQL ou o Redis estiverem inacessíveis, operações sensíveis (como Login e acionamento de ferramentas pela MaIA) são bloqueadas com erro explícito 503/500, sem fallbacks permissivos.
4. **Proteção Contra Ataques Comuns:**
   - Headers de segurança HTTP configurados (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).
   - Rate limiting por IP e token de sessão contra ataques de força bruta.
   - Hash de senhas exclusivamente via bcrypt com salt rounds adequados.
