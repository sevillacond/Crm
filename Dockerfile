# ==============================================================================
# ENLACE TELECOM CRM — DOCKERFILE MULTI-STAGE DE PRODUÇÃO
# Arquitetura Unificada: Bun Build + Bun Runtime (P0.6 Hardening)
# Single-Tenant Dedicated ISP Instance (Build Determinístico com bun.lock)
# ==============================================================================

# Estágio 1: Build da Aplicação (Frontend Vite + Server TypeScript)
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copiar manifestos de dependência
COPY package.json bun.lock ./

# Instalação estritamente determinística via lockfile congelado
RUN bun install --frozen-lockfile

# Copiar todo o código-fonte da aplicação
COPY . .

# Compilar o frontend estático React (Vite SPA -> /app/dist)
RUN bun run build

# ==============================================================================
# Estágio 2: Imagem Final de Execução (Bun Runtime Unificado & Minimalista)
# ==============================================================================
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Definir ambiente como produção
ENV NODE_ENV=production
ENV PORT=3000

# Criar usuário não-root por segurança (Conformidade CIS Docker Benchmark)
RUN addgroup --system --gid 1001 enlace && \
    adduser --system --uid 1001 enlace

# Copiar arquivos de configuração e dependências necessárias do builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Ajustar propriedade dos arquivos para o usuário não-root
RUN chown -R enlace:enlace /app

USER enlace

# Expor porta padrão de execução
EXPOSE 3000

# Health check para orquestradores (Kubernetes, AWS ECS, Google Cloud Run)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health/ready || exit 1

# Comando de inicialização via Bun (Execução nativa de TypeScript com suporte a sinais POSIX)
CMD ["bun", "server.ts"]
