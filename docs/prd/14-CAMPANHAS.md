# 14 — Campanhas & Disparos Ativos

## 1. Visão Geral
Módulo para criação, agendamento e execução de campanhas comerciais, comunicados de manutenção e notificações operacionais via WhatsApp Oficial (Meta HSM), E-mail ou SMS.

## 2. Requisitos Funcionais
1. **Segmentação Avançada de Destinatários:**
   - Filtro por bairro, cidade ou região geográfica vinculada a uma OLT/caixa CTO específica.
   - Filtro por plano de internet contratado (para campanhas de upgrade de velocidade).
   - Filtro por status do lead (leads perdidos por inviabilidade que agora possuem cobertura).
2. **Templates Homologados Meta:**
   - Seleção de templates pré-aprovados pela Meta para disparos fora da janela de 24h.
   - Variáveis dinâmicas: `{{nome}}`, `{{plano}}`, `{{vencimento}}`, `{{link_pix}}`.
3. **Controle de Vazão e Antispam:**
   - Disparo cadenciado (rate limit configurável de 20 a 50 mensagens/segundo) para evitar sobrecarga e bloqueios de número.
   - Gestão de opt-out: Assinantes que solicitarem exclusão são adicionados à lista de supressão da instância.
4. **Relatórios de Desempenho da Campanha:**
   - Taxa de entrega, leitura e resposta.
   - Negócios (deals) gerados e conversões financeiras originadas a partir do disparo.
