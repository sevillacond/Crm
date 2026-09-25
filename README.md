# Enlace Telecom CRM

> **Plataforma Omnichannel, Gestão de Operações FTTH e Inteligência Artificial MaIA para Provedores de Internet (ISP)**  
> *Arquitetura Single-Tenant Dedicada (Uma Empresa = Uma Instância Isolada)*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Google%20GenAI-Gemini%202.5%20Flash-8e24aa.svg)](https://ai.google.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ed.svg)](https://www.docker.com/)

---

## 1. Visão Geral da Solução

O **Enlace Telecom CRM** foi desenvolvido especificamente para atender à realidade operacional, comercial e técnica de Provedores Regionais de Internet (ISPs) e Operadoras de Telecomunicações no Brasil.

Diferente de CRMs genéricos, o Enlace CRM integra nativamente:
1. **Engenharia de Acesso Óptico**: Consulta georreferenciada de caixas CTO, cálculo de atenuação em dBm e verificação de raio de cabo drop;
2. **Ativações de Campo (O.S.)**: Gestão técnica de conectorização, fusão de fibra, checklist de 6 etapas e registro de seriais PON/Wi-Fi 6;
3. **Atendimento Omnichannel com Telefonia**: WhatsApp Oficial (Meta Cloud API), WebChat embutido e WebPhone SIP WebRTC integrado ao PBX Asterisk;
4. **Cobrança Instantânea Pix**: Geração de Pix Copia e Cola dinâmico do Banco Central com baixa automática e reativação no Radius/OLT;
5. **Inteligência Artificial Especializada (MaIA)**: Copiloto alimentado pelo Google Gemini 2.5 Flash via `@google/genai` com regras de negócio e MCP Tools.

---

## 2. Mapa de Módulos da Plataforma

| Módulo | Descrição Funcional |
| :--- | :--- |
| **Dashboard 360°** | KPIs executivos: MRR recorrente, Churn rate, NPS de atendimento, ocupação de OLTs e fila em tempo real. |
| **Relatórios & BI** | Análise de performance: TME/TMA de atendimento, produtividade do campo (First-Time Right) e ranking de bairros. |
| **Funil Comercial (Kanban)** | 7 etapas de vendas com probabilidade ponderada, ações em 1 clique (Ligar SIP, Testar CTO, Proposta). |
| **Ordens de Serviço (O.S.)** | Gestão de instalações e reparos, técnicos designados, Power Meter (dBm), MAC/Serial da ONU e checklist. |
| **Clientes & Contatos** | Cadastro PF/PJ, histórico 360° de interações, exportação de relatório completo para CSV. |
| **Viabilidade Técnica** | Validação de cobertura por CEP, mapa de CTOs com portas livres e calculadora de Power Budget GPON. |
| **Inbox Unificado** | Central omnichannel para WhatsApp, WebChat e E-mail com notas internas e transbordo para humanos. |
| **WebPhone SIP** | Softphone WebRTC integrado ao Asterisk/FreePBX com teclado DTMF, mute, retenção e transferência de chamadas. |
| **Supervisor & SLA** | Monitoria ao vivo de atendentes, cálculo de tempo de espera e intervenção (escuta / sussurro). |
| **Flow Builder** | Construtor visual de fluxos de autoatendimento e árvores de decisão para WhatsApp e Webchat. |
| **Central MaIA** | Gestão do motor de inteligência artificial, autonomia N1 a N4 e histórico de execuções de ferramentas. |
| **Base de Conhecimento (RAG)** | Ingestão de Procedimentos Operacionais Padrão (SOP), manuais técnicos (LOS, PPPoE) e políticas financeiras. |
| **Campanhas & Disparos** | Gestão de disparos em massa via WhatsApp com templates HSM aprovados pela Meta e controle de opt-out. |
| **Cobrança & Financeiro** | Faturas pendentes/vencidas, 2ª via Pix com baixa em 3 minutos e visualizador de boletos bancários em PDF. |
| **Auditoria & LGPD** | Trilha imutável de eventos gravando todas as operações humanas e autônomas da MaIA. |
| **Instância & Configurações** | Dados do provedor, integração SGP (IXC, MK-AUTH, HubSoft), limites de SLA e horários de atendimento. |
| **Ajuda & Operações** | Guias rápidos, glossário de telecom (GPON, CTO, dBm, LOS), FAQ interativo e atalhos de teclado. |

---

## 3. Estado Real da Arquitetura & Governança (Auditoria P0.12 & P0.13)

O Enlace CRM segue separação arquitetural estrita entre **módulos reais de produção**, **gateways de integração (adapters)**, **dados de sandbox/mock** e **módulos planejados**:

### 3.1 Tabela de Classificação de Módulos

| Módulo | Estado | Observação |
| :--- | :--- | :--- |
| **CRM Core** | `REAL` | Implementado com Vite SPA + Express e isolamento estrito por `instanceId`. |
| **PostgreSQL 16** | `REAL` | Implementado com Drizzle ORM, migrações versionadas e constraints compostas cross-instance. |
| **RBAC** | `REAL` | Implementado com matriz de permissões positiva e negativa por perfil (`ActorContext`). |
| **Auditoria** | `REAL` | Implementado com hash chain SHA-256 linear imutável e advisory locks. |
| **MaIA (Motor IA)** | `REAL` | Governada por Policy Engine com níveis de autonomia N0 a N4 e Fail-Closed. |
| **Aprovação MaIA** | `REAL` | Persistente no PostgreSQL com máquina de estados atômica e proteção anti-tamper (`paramsHash`). |
| **SGP (IXC/MK-Auth/Voalle)** | `ADAPTER` | Requer configuração de credenciais da API. Nunca fabrica clientes fictícios quando não configurado. |
| **WhatsApp** | `ADAPTER` | Requer integração com Meta Cloud API (`WHATSAPP_API_TOKEN` e `PHONE_NUMBER_ID`). |
| **Asterisk** | `ADAPTER` | Requer integração com PBX Asterisk via WebRTC WSS. Não declara status online sem conexão real. |
| **Cobrança** | `ADAPTER` | Requer credenciais do gateway Pix/Bancário. Não declara status `PAGO` sem retorno oficial. |
| **Viabilidade Técnica** | `MOCK` | Estimativa teórica simulada sandbox. Não utilizar como resultado real nem afirmar disponibilidade física de portas de CTO sem vistoria. |
| **GIS** | `PLANNED/PARTIAL` | Visualização de coordenadas preliminar; motor georreferenciado completo planejado. |
| **OLT / Telemetria PON** | `PLANNED/PARTIAL` | Diagnóstico óptico via SGP adapter; integração direta SNMP/SSH com chassis OLT planejada. |

### 3.2 O que é REAL (Implementação de Produção)
- **Autoridade Única PostgreSQL 16 + Drizzle**: PostgreSQL é a autoridade máxima de persistência. O cache em memória/Redis atua exclusivamente como otimização transitória (Fail-Closed na ausência do banco).
- **Integridade Cross-Instance no PostgreSQL (P0.1)**: Constraints compostas de chave primária e estrangeira (`id + instance_id`) em `deals`, `contatos`, `planos`, `users`, `sessions`, `ordens_servico` e `maia_approval_requests`. O banco de dados impede em nível de schema que entidades de uma instância referenciem outra.
- **Máquina de Estados de Aprovações MaIA (P0.2 & P0.3)**: Transições atômicas estritas (`PENDING_APPROVAL` -> `APPROVED`/`REJECTED` -> `EXECUTING` -> `EXECUTED`/`FAILED`). Verificação de concorrência com validação de `rowsAffected === 1` e proteção contra execução duplicada.
- **Integridade Criptográfica (paramsHash)**: Hash SHA-256 canônico gerado na solicitação e revalidado na execução. Alterações nos parâmetros bloqueiam a execução imediatamente com `PARAMS_HASH_MISMATCH`.
- **Governança & Três Identidades**: Preservação auditada de `requestedBy`, `resolvedBy` e `executedBy`. Nunca substitui identidade humana por identificadores genéricos.
- **Expiração de Aprovações**: Campo `expiresAt` com bloqueio automático de aprovação e execução de solicitações expiradas.
- **Policy Engine de Autonomia**: Níveis N0 (desativada) a N4 (autônoma). Persistência de `setNivel` gravada primeiro no PostgreSQL antes de invalidar/atualizar cache.
- **Isolamento Absoluto por `instanceId`**: Todos os repositórios sensíveis exigem `instanceId` obrigatório, injetado exclusivamente pelo `ActorContext` do token JWT verificado (o frontend pode exibir o ID mas jamais determina autorização).
- **Trilha de Auditoria Encadeada**: Encadeamento linear de hash SHA-256 (`previousHash` -> `hashIntegridade`) com PostgreSQL advisory lock por `instanceId` contra bifurcação concorrente.
- **Fail-Closed em Produção**: Indisponibilidade de PostgreSQL ou Redis bloqueia operações críticas sem fallbacks permissivos.
- **Zero Dados Fictícios como Default (P0.4)**: Eliminação completa de fallbacks silenciosos como `13000-000`, `Campinas`, `SP` ou IDs de clientes/contratos demonstrativos em fluxos produtivos.
- **CORS Estrito (P0.5)**: Variável `CORS_ORIGINS` estritamente obrigatória em produção, sem fallback permissivo para `localhost` ou `127.0.0.1`.
- **Arquitetura Docker Unificada (P0.6 & P0.7)**: Build e runtime unificados em Bun (`oven/bun:1-alpine`) com lockfile determinístico (`bun.lock`), execução como usuário não-root `enlace:enlace`, signal handling (`SIGTERM`/`SIGINT`), graceful shutdown em 10s e bind de porta restrito ao localhost (`127.0.0.1:3000`) para integração com Traefik/Proxy Reverso.

---

## 4. Início Rápido (Desenvolvimento Local)

### Pré-requisitos:
- **Node.js**: Versão 20.x ou superior;
- **npm** ou **bun** instalado;
- Chave de API do **Google Gemini** (`GEMINI_API_KEY`).

### Passo a Passo:

1. **Clone o projeto e acesse o diretório**:
   ```bash
   git clone https://github.com/sua-empresa/enlace-telecom-crm.git
   cd enlace-telecom-crm
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   ```bash
   cp .env.example .env
   # Preencha sua GEMINI_API_KEY no arquivo .env
   ```

4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:3000`.

---

## 5. Scripts Disponíveis

- `npm run dev`: Inicia o servidor backend Express e o middleware Vite para desenvolvimento rápido com Hot Module Replacement;
- `npm run build`: Compila os assets estáticos do React SPA via Vite para a pasta `/dist`;
- `npm run lint`: Executa a checagem rigorosa de tipagem com TypeScript (`tsc --noEmit`);
- `npm start`: Inicia o servidor Node.js/Express em modo de produção servindo os arquivos estáticos compilados em `/dist`.

---

## 6. Documentações Complementares

- [Guia de Deploy em Produção (Docker, Cloud Run, Linux VPS)](./docs/DEPLOY.md)
- [Especificação da IA MaIA, Níveis N1-N4 & MCP Tools](./AGENTE.md)
- [Índice do PRD Funcional](./docs/prd/00-INDEX.md)
- [Dockerfile Multi-Stage](./Dockerfile)
- [Docker Compose para Orquestração](./docker-compose.yml)

---

## 7. Licença & Suporte

© 2026 Enlace Telecomunicações. Todos os direitos reservados.  
Suporte Técnico & Plantão NOC: `0800 892 0044` | `noc@enlacecrm.com.br`
