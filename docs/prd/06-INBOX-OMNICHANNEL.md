# 06 — Inbox Omnichannel Unificado

## 1. Visão Geral
O **Inbox Omnichannel** do Enlace-CRM centraliza em uma única interface operacional todas as interações com o assinante ou prospect, consolidando canais digitais (WhatsApp Oficial, Webchat, E-mail) e telefonia SIP (WebPhone).

## 2. Requisitos Funcionais
1. **Fila Única e Triagem Inteligente:**
   - Mensagens recebidas entram na fila da instância identificadas por canal de origem.
   - Atribuição automática por distribuição round-robin, menor carga ou habilidade técnica.
2. **Contexto 360° do Cliente em Tela Única:**
   - Painel lateral exibindo dados cadastrais (CPF/CNPJ, Contrato, Endereço de instalação).
   - Diagnóstico em tempo real de OLT/ONT (sinal óptico dBm, status PPPoE/Radius).
   - Histórico de chamados, Ordens de Serviço (OS) e faturas em aberto.
3. **Co-piloto MaIA Integrado:**
   - Sugestão de respostas baseadas em procedimentos operacionais padrão (SOP).
   - Ações rápidas: Desbloqueio em confiança de 48h, envio de 2ª via Pix, teste de viabilidade.
4. **Notas Internas e Transbordo:**
   - Chat interno privado entre operadores e supervisores no mesmo ticket sem visibilidade pelo cliente.
   - Transbordo com transferência com ou sem consulta prévia.

## 3. Arquitetura e Persistência
- Cada conversa e mensagem possui isolamento rígido por `instance_id`.
- Sincronização via WebSockets / Server-Sent Events (SSE).
- Toda mensagem e anexo é registrado na trilha de auditoria.
