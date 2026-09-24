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

## 3. Estado Real da Arquitetura & Governança (Auditoria P0.5)

O Enlace CRM segue separação arquitetural estrita entre **módulos reais de produção**, **gateways de integração (adapters)** e **dados de demonstração/sandbox (mocks)**:

### 3.1 O que é REAL (Implementação de Produção)
- **Autoridade Única PostgreSQL 16 + Drizzle**: PostgreSQL é a autoridade máxima de persistência. O cache em memória/Redis atua exclusivamente como otimização transitória (Fail-Closed na ausência do banco).
- **Máquina de Estados de Aprovações MaIA**: Transições atômicas estritas (`PENDING_APPROVAL` -> `APPROVED`/`REJECTED` -> `EXECUTING` -> `EXECUTED`/`FAILED`). Verificação de concorrência com validação de `rowsAffected === 1`.
- **Integridade Criptográfica (paramsHash)**: Hash SHA-256 canônico gerado na solicitação e revalidado na execução. Alterações nos parâmetros bloqueiam a execução imediatamente com `PARAMS_HASH_MISMATCH`.
- **Governança & Três Identidades**: Preservação auditada de `requestedBy`, `resolvedBy` e `executedBy`. Nunca substitui identidade humana por identificadores genéricos.
- **Expiração de Aprovações**: Campo `expiresAt` com bloqueio automático de aprovação e execução de solicitações expiradas.
- **Policy Engine de Autonomia**: Níveis N0 (desativada) a N4 (autônoma). Persistência de `setNivel` gravada primeiro no PostgreSQL antes de invalidar/atualizar cache.
- **Isolamento Absoluto por `instanceId`**: Todos os repositórios sensíveis (`contatos`, `deals`, `planos`, `ordensServico`, `auditoria`, `sessions`, `maiaApprovals`, `sgp`) exigem `instanceId` obrigatório, injetado exclusivamente pelo `ActorContext` do token JWT verificado.
- **Integridade Relacional Cross-Instance**: Bloqueio transacional de entidades de instâncias distintas (ex: Deal na instância A tentando referenciar Contato ou Plano da instância B é rejeitado com 403).
- **Trilha de Auditoria Encadeada**: Encadeamento linear de hash SHA-256 (`previousHash` -> `hashIntegridade`) com PostgreSQL advisory lock por `instanceId` contra bifurcação concorrente.
- **Fail-Closed em Produção**: Indisponibilidade de PostgreSQL ou Redis bloqueia operações críticas sem fallbacks permissivos.

### 3.2 O que é ADAPTER (Gateways Prontos para Homologação)
- **Gateway SGP / ERP de Provedor**: Arquitetura padronizada (`SgpService` -> `ISgpAdapter`). Identifica explicitamente se a instância está em modo `REAL`, `ADAPTER`, `MOCK` ou `NOT_CONFIGURED`. Nunca fabrica clientes fictícios quando não configurada.
- **Telefonia WebRTC / Asterisk SIP**: Interface para PBX Asterisk com suporte a softphone integrado, sinalização SIP e histórico de chamadas vinculado aos contatos.
- **Gateway Pix / Pagamentos**: Geração de Pix Copia e Cola EMVCo padrão Banco Central com marcação `GATEWAY_PRODUCAO` ou `MOCK_SANDBOX`.
- **WhatsApp Cloud API**: Adapter para envio de mensagens via Meta Cloud API com verificação de configuração ativa.
- **Viabilidade Técnica**: Adapter desacoplado com simulação explícita de cobertura óptica identificada como `[MOCK_DEMO_SIMULADO]`.

### 3.3 O que é MOCK / DEMO (Ambiente Local)
- **Fixtures de Desenvolvimento**: Contratos de exemplo (`CTR-IXC-8821`, `CTR-MK-4412`) restritos à instância de desenvolvimento local `inst-dev-local-001`.
- **Fallback Heurístico da MaIA**: Isolado e desativado em produção (`NODE_ENV=production`), operando apenas em modo local/teste e explicitamente marcado como `[MOCK/DEMO]`.

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
