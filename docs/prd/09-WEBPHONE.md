# 09 — WebPhone SIP & Telefonia WebRTC

## 1. Visão Geral
Softphone WebRTC embutido diretamente no navegador para operadores e atendentes, integrando-se via SIP sobre WebSocket (WSS) a centrais PBX Asterisk, FreePBX, Issabel ou Kamailio do provedor.

## 2. Requisitos Técnicos e Funcionais
1. **Conectividade SIP WebRTC:**
   - Protocolo SIP via WebSocket seguro (`wss://pbx.provedor.com.br:8089/ws`).
   - Codecs suportados: Opus (áudio HD), G.711u (PCMU), G.711a (PCMA).
   - Servidores STUN/TURN dedicados para atravessar NATs e firewalls de operadoras.
2. **Controles Operacionais em Tela:**
   - Discador com teclado DTMF numérico.
   - Botões: Atender, Desligar, Mute de microfone, Retenção (Hold), Transferência assistida e cega.
   - Discagem em 1 clique a partir da ficha do lead, deal do Kanban ou ticket do Inbox.
3. **Auditoria e Identificação de Chamadas (Screen Pop):**
   - Pop-up automático na tela do atendente com a ficha do cliente ao receber chamada pelo número do chamador (CallerID).
   - Registro de bilhetagem (CDR) no banco de dados com `instanceId`, duração, gravação de áudio (se habilitado) e resultado da chamada.
4. **Governança do Estado do WebPhone:**
   - Não declara status "Online/Pronto" sem autenticação SIP WSS bem-sucedida junto ao PBX.
   - Fila de atendimento integrada ao status do operador (Disponível, Em Pausa, Ocupado).
