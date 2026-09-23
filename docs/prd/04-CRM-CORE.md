# 04 — CRM Core (Contatos, Leads, Planos de Internet)

## 1. Modelo de Domínio
O CRM Core do Enlace-CRM foi desenhado para as especificidades de Provedores de Internet:

### Entidades Centrais
- **Contato (Lead / Cliente Assinante):**
  - Identificação: Nome, CPF/CNPJ, E-mail, Telefone (WhatsApp formatado E.164).
  - Endereço para Viabilidade: Logradouro, Número, Complemento, Bairro, Cidade, UF, CEP, Coordenadas (lat/long opcionais).
  - Status Cadastral: `PROSPECT`, `LEAD_QUALIFICADO`, `CLIENTE_ATIVO`, `CANCELADO`.
  - Tags: Ex: `FIBRA`, `EMPRESARIAL`, `ALTA_PRIORIDADE`, `AREA_RURAL`, `HOT_LEAD`.
  - Score MaIA: 0 a 100 com justificativa calculada pela IA.

- **Catálogo de Planos do Provedor:**
  - Código, Nome comercial (ex: *Fibra 600 Mega Gamer*, *Link Dedicado 1 Gbps*, *Combo Fibra + TV*).
  - Velocidade Download / Upload (Mbps).
  - Valor Mensalidade (R$) e Taxa de Adesão/Instalação.
  - Tecnologia (FTTH, Rádio 5GHz, PTP Dedicado).

- **Negócio / Oportunidade (Deal):**
  - Título, Contato associado, Plano pretendido, Valor estimado (MRR).
  - Etapa do Pipeline, Probabilidade de fechamento (%), Data prevista.
  - Responsável atribuído (Atendente ou MaIA).
  - Status de Viabilidade Técnica: `PENDENTE`, `VIAVEL_CTO`, `INVIAVEL`, `EXPANSAO_NECESSARIA`.
