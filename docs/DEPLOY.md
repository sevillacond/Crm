# Guia de Deploy & Operações de Infraestrutura — Enlace CRM

Este documento estabelece as diretrizes completas de implantação, dimensionamento de infraestrutura, segurança de rede e sustentação em produção para o **Enlace CRM** (Instância Single-Tenant Dedicada com Hardening P0).

---

## 1. Topologia de Implantação (Single-Tenant Isolado)

O Enlace CRM segue o princípio arquitetural estrito: **UMA INSTÂNCIA = UM PROVEDOR / CNPJ**.
Cada implantação possui isolamento completo:
- **Banco de Dados Dedicado**: PostgreSQL 16 com schema oficial gerenciado via Drizzle ORM;
- **Contêiner da Aplicação**: Node.js 20/22 + Express + Frontend Vite pré-compilado;
- **Persistência Confiável (Fail-Fast)**: Em produção (`NODE_ENV=production`), caso o PostgreSQL esteja indisponível, a aplicação **rejeita operações e retorna erro 503**, proibindo qualquer fallback silencioso em memória que gere perda de dados;
- **Sessões Persistidas & Revogáveis**: Autenticação via JWT vinculado à tabela de sessões (`sessionsTable`), com revogação imediata em `POST /api/auth/logout`;
- **Trilha de Auditoria com Encadeamento Criptográfico**: Cada evento gera hash SHA-256 encadeado (`previousHash` -> `hashIntegridade`), garantindo integridade e conformidade LGPD/Anatel.

---

## 2. Dimensionamento de Hardware Recomendado

| Porte do Provedor | Assinantes Ativos | vCPUs | Memória RAM | Armazenamento SSD NVMe | Banco de Dados |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Regional Pequeno** | Até 3.000 clientes | 2 vCPUs | 4 GB | 50 GB | PostgreSQL 16 dedicado |
| **Médio Provedor** | 3.001 a 15.000 clientes | 4 vCPUs | 8 GB | 120 GB | PostgreSQL 16 dedicado + Redis 7 |
| **Grande Operadora** | 15.001 a 60.000 clientes | 8 vCPUs | 16 GB | 300 GB | PostgreSQL 16 HA + Réplica Read-only |
| **Enterprise ISP** | Acima de 60.000 clientes | Cluster K8s | Auto-scaling | Cloud SQL / RDS PostgreSQL HA | PgBouncer + Redis Cluster |

---

## 3. Matriz de Variáveis de Ambiente Críticas (`.env`)

| Variável | Obrigatória em Prod | Descrição / Exemplo |
| :--- | :---: | :--- |
| `NODE_ENV` | **Sim** | `production` (Ativa fail-fast estrito e bloqueia seeds simulados) |
| `PORT` | Sim | `3000` |
| `DATABASE_URL` | **Sim** | `postgresql://enlace_user:SENHA@postgres:5432/enlace_crm_db?sslmode=disable` |
| `JWT_SECRET` | **Sim** | Segredo aleatório de alta entropia (mínimo 32 caracteres) |
| `INSTANCE_ID` | **Sim** | Identificador único do provedor (ex: `inst-provedor-fibra-001`) |
| `CORS_ORIGINS` | **Sim** | Lista de origens permitidas separadas por vírgula (ex: `https://crm.provedor.com.br`) |
| `ADMIN_INITIAL_EMAIL` | Sim | E-mail do administrador inicial (ex: `admin@provedor.com.br`) |
| `ADMIN_INITIAL_PASSWORD` | **Sim** | Senha forte para o bootstrap inicial da instância |
| `REDIS_URL` | Recomendado | `redis://redis:6379` (Rate limiting distribuído) |
| `GEMINI_API_KEY` | Opcional | Chave para copiloto MaIA via `@google/genai` |

---

## 4. Inicialização: Bootstrap de Produção vs. Seed Demo

A inicialização do banco é automaticamente bifurcada por ambiente:
- **Produção (`NODE_ENV=production`)**:
  - Executa migrações Drizzle;
  - Cria papéis e permissões RBAC;
  - Cadastra o registro oficial da instância (`instancesTable`);
  - Cadastra exclusivamente o Administrador Raiz com senha criptografada via `bcrypt` (12 rounds);
  - **Nenhum lead ou negócio fictício é inserido**.
- **Desenvolvimento/Demo (`NODE_ENV=development`)**:
  - Semeia dados fictícios de demonstração para homologação visual.

---

## 5. Health Checks & Orquestração

O Enlace CRM expõe sondas separadas para orquestradores (Kubernetes / Docker Compose):

- **Liveness Probe**: `GET /health/live` ou `GET /liveness`
  - Retorna `200 OK` se o processo Node.js estiver respondendo.
- **Readiness Probe**: `GET /health/ready` ou `GET /readiness`
  - Retorna `200 OK` se o processo estiver ativo **e** a conexão com o PostgreSQL 16 estiver operacional.
  - Em produção, caso o PostgreSQL caia, retorna `503 Service Unavailable`, sinalizando ao balanceador para não direcionar tráfego.

---

## 6. Procedimento de Deploy com Docker Compose

```bash
# 1. Clone o repositório
git clone https://github.com/sevillacond/Crm.git /opt/enlace-crm
cd /opt/enlace-crm

# 2. Configure o arquivo de ambiente
cp .env.example .env
chmod 600 .env
nano .env

# 3. Suba os contêineres em background
docker compose up -d --build

# 4. Verifique a prontidão dos serviços
curl -f http://localhost:3000/health/ready
docker compose ps
docker compose logs -f enlace-crm
```

---

## 7. Procedimento de Migração e Testes

Para validar a integridade da suíte de testes antes do go-live:

```bash
npm run test
```

A suíte executará a validação de:
1. Rejeição de credenciais inválidas;
2. Ausência de senhas master ou universais;
3. Revogação real de sessão no logout;
4. Princípio do Menor Privilégio no RBAC;
5. Encadeamento criptográfico SHA-256 da auditoria;
6. Isolamento estrito entre instâncias (Tenant Isolation);
7. Fail-Fast em produção quando o banco de dados falha.
