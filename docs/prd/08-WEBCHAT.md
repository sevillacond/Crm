# 08 — WebChat Embutido (Widget Flutuante)

## 1. Visão Geral
O **WebChat do Enlace-CRM** é um widget embeddável e personalizável para o site institucional, portal do assinante e landing pages comerciais do provedor de internet.

## 2. Requisitos Funcionais
1. **Identificação e Pré-atendimento:**
   - Formulário de triagem: Nome, Telefone/WhatsApp, CPF/CNPJ, CEP e Assunto.
   - Detecção se o visitante é cliente ativo com chave no banco da instância.
2. **Personalização Visual por Instância:**
   - Cores primárias e secundárias alinhadas à identidade visual do provedor.
   - Logotipo institucional e mensagem de boas-vindas customizada.
   - Posição (canto inferior direito ou esquerdo) e som de notificação.
3. **Fluxos Automatizados & MaIA:**
   - Execução imediata de árvore de decisão (Flow Builder) para suporte inicial.
   - Atuação da MaIA para consulta de cobertura técnica e cotação de planos.
   - Transbordo para atendente humano com preservação de todo o histórico da conversa.
4. **Segurança e Proteção contra Spam:**
   - Rate limiting por IP e fingerprint.
   - Sanitização XSS estrita em mensagens de texto e nomes de anexos.
