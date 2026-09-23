# Especificação do Agente de Inteligência Artificial — MaIA

> **MaIA**: **M**otor de **A**utomação e **I**nteligência **A**rtificial  
> **Versão**: 2.4.0 Hardened (Google Gemini 2.5 Flash via `@google/genai` com isolamento estrito)  
> **Escopo**: Operações Especializadas de Provedores de Internet (ISP) & Telecomunicações

---

## 1. Arquitetura de Execução & Governança Estrita

A MaIA opera sob uma arquitetura de defesa em profundidade com mediação determinística:

```
[ Usuário Operador ]
        │
        ▼
   [ API / MaIA ]
        │
        ▼
 [ Policy Engine ] ──(Verifica Nível N0..N4 e permissão RBAC)
        │
        ▼
 [ Tool Registry ] ──(Validação de esquema de parâmetros)
        │
        ▼
 [ Business Service ] ──(Serviço da aplicação: Deals, Planos, Viabilidade)
        │
        ▼
[ Repository Scoped ] ──(Filtro mandatório por instanceId)
        │
        ▼
 [ PostgreSQL 16 ] ──(Persistência e Hash SHA-256 de Auditoria)
```

### Regras Mandatórias de Arquitetura:
1. **Sem Acesso Direto ao Banco**: O modelo de linguagem **NUNCA** executa queries SQL nem possui conexão com o banco de dados.
2. **Princípio do Menor Privilégio**: O contexto injetado no prompt limita-se estritamente ao contato ou negócio em foco selecionado pelo operador.
3. **Confirmação Humana (Human-in-the-Loop)**: Em níveis intermediários (N3), ações de alteração de dados exigem confirmação explícita na UI.
4. **Auditoria Criptográfica de Toda Execução**: Qualquer acionamento de ferramenta pela MaIA gera evento de auditoria com `isMaiaAction = true`, nível de autonomia, identificação do operador solicitante, e encadeamento SHA-256 (`hashIntegridade`).
5. **Sanitização de Parâmetros**: Senhas, hashes e tokens são filtrados e nunca registrados no log da IA.

---

## 2. Níveis de Autonomia Operacional

| Nível | Classificação | Comportamento | Exemplo de Ação |
| :--- | :--- | :--- | :--- |
| **N0** | Desativada | A MaIA não processa mensagens nem executa ferramentas. | Retorna aviso de inatividade. |
| **N1** | Informativo | Consulta planos e catálogos públicos informativos. | Apresenta detalhes do plano 600 Mega. |
| **N2** | Copiloto Assistente | Auxilia o atendente sugerindo respostas e qualificando leads. | Calcula score heurístico de lead. |
| **N3** | Execução Supervisionada | Prepara ações (ex: simulação de viabilidade) sob aprovação humana. | Operador clica em confirmar para efetivar. |
| **N4** | Autônoma Regulada | Executa ferramentas automáticas com registro auditado. | Baixa automática via webhook homologado. |

---

## 3. Catálogo de Ferramentas Registradas (`Tool Registry`)

### 1. `consultar_viabilidade`
- **Nível Mínimo**: N1
- **Modo Atual**: `MOCK_DEMO_SIMULADO` (Sandbox de demonstração com disclaimer explícito até homologação do GIS real).
- **Parâmetros**: `{ cep: string, numero?: string, bairro?: string }`
- **Garantia**: Retorna aviso legal de estimativa indicando que não representa laudo definitivo de engenharia óptica.

### 2. `recomendar_plano`
- **Nível Mínimo**: N1
- **Ação**: Consulta o catálogo oficial da instância e recomenda a melhor opção técnica e custo-benefício.

### 3. `qualificar_lead`
- **Nível Mínimo**: N2
- **Ação**: Calcula score de propensão de contratação para o contato em atendimento.

---

## 4. Auditoria de Ações da MaIA

Toda interação executada via MaIA registra os seguintes campos:
- `actorId`: Identificador do agente (`usr_maia`) e operador humano associado;
- `actorRole`: `MAIA_AGENT`;
- `action`: `MAIA_INTERACTION_PROCESSED` ou `MAIA_TOOL_EXECUTED`;
- `instanceId`: Identificador da instância do provedor;
- `isMaiaAction`: `true`;
- `details`: Resumo da ação e ferramenta executada;
- `hashIntegridade`: Hash SHA-256 vinculado ao `previousHash` do evento anterior.
