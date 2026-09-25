# 24 — Limites de Escopo, Fronteiras Arquiteturais & Não-Objetivos

## 1. Visão Geral
Este documento define formalmente o que o **Enlace-CRM** faz e, fundamentalmente, o que o sistema **NÃO É** e **NÃO DEVE** fazer, evitando escopo inflado e conflitos com o ecossistema de telecomunicações existente.

## 2. O Que o Enlace-CRM É
- Plataforma de Relacionamento com o Cliente (CRM) e Gestão Comercial para Provedores de Internet.
- Central de Atendimento Omnichannel (WhatsApp Oficial, Webchat, Telefonia WebPhone).
- Copiloto e Motor de Automação com Inteligência Artificial (MaIA) com governança estrita.
- Visualizador e orquestrador de processos de ativação de campo (Ordens de Serviço).
- Trilha imutável de auditoria com encadeamento de hash SHA-256 e conformidade com LGPD.

## 3. O Que o Enlace-CRM NÃO É (Fronteiras Delimitadas)
1. **Não é um ERP / SGP Completo:**
   - O Enlace-CRM **não** substitui sistemas fiscais como IXC, MK-AUTH, Voalle ou HubSoft para emissão de Notas Fiscais de Telecomunicação (Modelo 21/22 e NFCom modelo 62), geração de arquivos fiscais do Sped, controle contábil e rateio de custos de estoque físico. O CRM consome e aciona estes SGPs via API.
2. **Não é um Servidor de Telefonia PBX Físico:**
   - O Enlace-CRM **não** atua como Media Gateway SIP ou PBX autônomo. O WebPhone integrado atua como um softphone WebRTC (cliente SIP) que se conecta a centrais homologadas (Asterisk, FreePBX, etc.).
3. **Não é um Gateway Bancário Direto:**
   - O Enlace-CRM **não** liquida valores nem custodia saldo bancário. As operações financeiras de Pix e boletos são intermediadas por instituições financeiras autorizadas pelo Banco Central via API de cobrança.
4. **Não é um Sistema de Laudo Óptico de Engenharia (GIS Definitivo):**
   - A ferramenta de viabilidade técnica no momento atua em modo de estimativa teórica simulada (MOCK). Ela **não** substitui a vistoria técnica presencial nem o cadastro georreferenciado certificado de rede óptica subterrânea e aérea.
