# 23 — Procedimentos de Deploy & Operação em Produção

## 1. Visão Geral
Guia prático para provisionamento, implantação contínua e administração operacional do Enlace-CRM em ambientes corporativos e nuvem.

## 2. Modelos de Implantação
1. **Implantação em VPS Linux Dedicada (Docker Compose):**
   - Recomendado para provedores com infraestrutura própria em data center ou servidores dedicados (Hetzner, OVH, Hostinger, AWS EC2).
   - Utilização de `docker-compose.yml` pré-configurado com isolamento de rede e volumes persistentes.
   - Terminação SSL/TLS via Traefik ou Nginx com certificados Let's Encrypt automatizados.
2. **Implantação Serverless / Container Gerenciado (Cloud Run / ECS):**
   - Implantação da imagem Docker construída a partir do `Dockerfile` multi-stage.
   - Banco de dados gerenciado (Cloud SQL PostgreSQL 16 ou AWS Aurora PostgreSQL).
   - Injeção segura de segredos via Secret Manager.

## 3. Checklist Pré-Deploy
- [ ] Criar arquivo `.env` de produção a partir do `.env.example`.
- [ ] Definir `NODE_ENV=production`.
- [ ] Gerar `JWT_SECRET` aleatório de 64 caracteres criptográficos.
- [ ] Definir `ADMIN_INITIAL_PASSWORD` forte e exclusiva.
- [ ] Configurar `CORS_ORIGINS` com o domínio exato de acesso (ex: `https://crm.provedor.com.br`).
- [ ] Configurar `DATABASE_URL` apontando para o PostgreSQL 16 com SSL habilitado.
- [ ] Inserir chave de API válida do Google Gemini (`GEMINI_API_KEY`).
- [ ] Executar migrações do banco de dados antes de iniciar o tráfego de produção.

## 4. Procedimento de Atualização sem Downtime (Rolling Update)
1. Realizar pull da nova imagem ou checkout do código.
2. Executar `npm test` e `npm run build`.
3. Aplicar migrações do banco com `npm run db:push` ou script de migração.
4. Reiniciar o serviço permitindo o graceful shutdown de 10s para conexões em andamento.
