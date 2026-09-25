# 10 — Flow Builder & Construtor de Fluxos de Atendimento

## 1. Visão Geral
O **Flow Builder** permite a criação visual de fluxos de navegação interativos, menus de autoatendimento (URA de texto) e árvores de decisão para WhatsApp e Webchat, sem necessidade de programação.

## 2. Requisitos Funcionais
1. **Nós de Fluxo Suportados:**
   - **Mensagem / Envio:** Envio de texto formatado, imagens de campanhas e arquivos.
   - **Menu de Opções:** Botões e listas numeradas (ex: 1. Suporte Técnico, 2. Comercial, 3. Financeiro/2ª Via Pix).
   - **Coleta de Dados:** Validação de CPF/CNPJ, CEP, número predial e e-mail.
   - **Condicionais / Lógica:** Verificação de horário de atendimento, feriados e status do contrato no SGP.
   - **Ação MaIA:** Invocação supervisionada de inteligência artificial para dúvidas abertas.
   - **Transbordo:** Encaminhamento para fila humana com priorização por SLA.
2. **Versionamento e Publicação:**
   - Modo Rascunho vs. Publicado.
   - Teste do fluxo em sandbox antes de colocar em produção.
   - Histórico de versões com restauração em 1 clique.
3. **Métricas de Navegação:**
   - Taxa de resolução por autoatendimento (containment rate).
   - Nós de maior abandono pelo usuário.
   - Tempo médio de navegação até transbordo humano.
