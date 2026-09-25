# 07 — Integração WhatsApp Oficial (Meta Cloud API)

## 1. Visão Geral
Integração direta com a **Meta Cloud API** (WhatsApp Business Platform) em modelo oficial, dispensando emuladores não oficiais (Web/QR Code instáveis) e garantindo conformidade com os termos da Meta e estabilidade do número empresarial do provedor.

## 2. Requisitos Técnicos
1. **Credenciais Oficiais por Instância:**
   - `WHATSAPP_API_TOKEN`: Token de acesso permanente do sistema Meta.
   - `PHONE_NUMBER_ID`: Identificador do número de telefone registrado na Meta.
   - `WABA_ID`: WhatsApp Business Account ID.
   - `VERIFY_TOKEN`: Token de validação de Webhooks.
2. **Recepção de Webhooks:**
   - Endpoint seguro `/api/integrations/whatsapp/webhook` isolado por instância.
   - Validação de assinatura HMAC-SHA256 (`x-hub-signature-256`).
   - Processamento de mensagens de texto, áudio (PTT), imagens, documentos (PDF de comprovantes e contratos) e localização geográfica (CEP/coordenadas para viabilidade).
3. **Modelos de Mensagem HSM (Templates Aprovados):**
   - Disparo ativo de notificações de fatura e código Pix.
   - Avisos proativos de manutenção preventiva e rompimento de fibra óptica na região.
   - Lembretes de agendamento de Ordem de Serviço de instalação.
4. **Governança & Opt-out:**
   - Controle automático de janela de 24 horas de conversação gratuita iniciada pelo usuário.
   - Mecanismo de opt-out (STOP/CANCELAR) com bloqueio automático em conformidade com as regras da Meta.
