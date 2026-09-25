# 15 — Hub de Integrações & Gateways de ISP (SGP / ERP / PBX)

## 1. Visão Geral
O Enlace-CRM posiciona-se como centro de inteligência e relacionamento, conectando-se a sistemas de gestão de provedores (SGP/ERP), centrais de telefonia e gateways de pagamento via arquitetura de **Adapters** desacoplados.

## 2. Gateways SGP/ERP Suportados (Modo Adapter)
1. **Sistemas Suportados:**
   - **IXC Provedor:** WebService REST para contratos, desbloqueio de conexão e extrato financeiro.
   - **MK-AUTH:** Integração de clientes, radius e títulos bancários.
   - **HubSoft:** API para ordens de serviço, clientes e contratos.
   - **Voalle:** API ERP para ativação de serviços e billing.
2. **Regras de Isolamento e Integridade (P0.4 & P0.9):**
   - Instâncias sem credenciais SGP configuradas retornam status `NOT_CONFIGURED`.
   - É estritamente proibido fabricar clientes, contratos ou títulos fictícios na ausência de integração real em produção.
   - Toda chamada externa aos gateways é auditada com tempo de resposta e código HTTP retornado.

## 3. Integração de Telefonia (PBX / Asterisk)
- Comunicação WebSocket com o Asterisk AMI/ARI para monitoramento de ramais e WebRTC WSS para áudio SIP.
- Tratamento de status de operadora e gravação de chamadas.

## 4. Webhooks de Entrada e Saída
- Endpoints seguros para receber eventos externos com validação de HMAC ou Bearer Token.
- Envio de webhooks com retry exponencial para sistemas legados do provedor.
