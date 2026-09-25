# 21 — Observabilidade, Logs Estruturados & Rotinas de Backup

## 1. Visão Geral
Procedimentos e ferramentas para monitorar a saúde da aplicação, identificar anomalias em tempo real e assegurar a recuperação de desastres (Disaster Recovery) das bases de dados dos provedores.

## 2. Observabilidade e Telemetria
1. **Logs Estruturados em JSON:**
   - Logs de aplicação emitidos em formato JSON no stdout/stderr com campos unificados: `timestamp`, `level`, `instanceId`, `traceId`, `service`, `message` e `context`.
   - Compatibilidade com agregadores de logs: Vector, Fluentbit, Loki/Promtail, Datadog ou CloudWatch.
2. **Endpoints de Healthcheck e Prontidão:**
   - `/health`: Liveness probe retornando status básico da aplicação.
   - `/health/ready`: Readiness probe verificando conexões ativas com o PostgreSQL, pool de conexões e latência.
3. **Métricas de Performance:**
   - Tempo de resposta dos endpoints HTTP (percentis P95, P99).
   - Tempo de latência de chamadas ao Gemini Flash da MaIA.
   - Taxa de conexões ativas do pool do PostgreSQL.

## 3. Política e Rotinas de Backup
1. **Backups Lógicos Diários:**
   - Dump periódico (`pg_dump`) automatizado das instâncias com compressão gzip e criptografia com chave assimétrica (GPG).
   - Envio dos snapshots para storage off-site (S3, Cloud Storage ou MinIO seguro).
2. **Backups Contínuos (WAL Archiving):**
   - Point-In-Time Recovery (PITR) com retenção de Write-Ahead Logs para tolerância a perdas (RPO < 5 minutos).
   - RTO (Recovery Time Objective) de restauração inferior a 30 minutos em caso de falha catastrófica de hardware.
