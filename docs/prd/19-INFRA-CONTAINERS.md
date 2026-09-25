# 19 — Infraestrutura, Containers Docker & Orquestração

## 1. Visão Geral
Especificação da infraestrutura de deploy do Enlace-CRM, priorizando isolamento single-tenant, segurança por design em containers Docker e alta performance com Bun/Node.js e PostgreSQL 16.

## 2. Padrões de Conteinerização (P0.6 & P0.7)
1. **Dockerfile Multi-Stage Unificado:**
   - Base de build e runtime unificada em `oven/bun:1-alpine`.
   - Compilação determinística usando `bun.lock`.
   - Execução sob usuário não-root `enlace:enlace` (UID/GID 1001) para mitigação de vulnerabilidades de escape de container.
2. **Ciclo de Vida do Processo e Sinais POSIX:**
   - Manipulação direta de sinais `SIGTERM` e `SIGINT` no servidor backend.
   - Graceful shutdown com timeout de 10 segundos para conclusão de transações pendentes e fechamento de conexões de pool com PostgreSQL.
3. **Segurança de Rede e Bind de Portas:**
   - Bind exclusivo em `127.0.0.1:3000` ou rede interna isolada de containers.
   - Proibição de exposição direta de portas da aplicação para a internet pública sem proxy reverso (Traefik, NGINX ou Caddy com terminação TLS/HTTPS automática).
4. **Orquestração com Docker Compose:**
   - Stack composta por `app`, `postgres` (versão 16 Alpine com volumes persistentes nomeados) e opcionalmente `redis` para cache volátil.
   - Healthchecks nativos (`/health` com retorno JSON e verificação de conectividade com o banco).
