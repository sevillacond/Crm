# Guia de Deploy & Operações de Infraestrutura — Enlace Telecom CRM

Este documento estabelece as diretrizes completas de implantação, dimensionamento de infraestrutura, segurança de rede e sustentação em produção para o **Enlace Telecom CRM** (Instância Single-Tenant Dedicada).

---

## 1. Topologia de Implantação (Single-Tenant Isolado)

Em conformidade com o PRD (Seção 2 e 33), cada provedor de internet opera em sua **própria infraestrutura isolada**:
- **Banco de Dados Dedicado**: PostgreSQL 16 com schema exclusivo (sem compartilhamento de tabelas entre provedores);
- **Contêiner da Aplicação**: Node.js 20 + Express + Frontend Vite pré-compilado;
- **Instância WebRTC/SIP**: Ramal dedicado apontado para a central telefônica Asterisk/FreePBX do provedor;
- **Chave de IA MaIA**: Chave individual ou token corporativo para consumo da API Gemini 2.5 Flash via MCP.

---

## 2. Dimensionamento de Hardware Recomendado

| Porte do Provedor | Assinantes Ativos | vCPUs | Memória RAM | Armazenamento SSD NVMe |
| :--- | :--- | :--- | :--- | :--- |
| **Inicial / Regional** | Até 3.000 clientes | 2 vCPUs | 4 GB | 50 GB |
| **Médio Provedor** | 3.001 a 15.000 clientes | 4 vCPUs | 8 GB | 120 GB |
| **Grande Operadora** | 15.001 a 60.000 clientes | 8 vCPUs | 16 GB | 300 GB (Com réplica read-only) |
| **Enterprise ISP** | Acima de 60.000 clientes | Cluster K8s | Auto-scaling | PostgreSQL Cloud SQL / RDS HA |

---

## 3. Matriz de Variáveis de Ambiente (`.env`)

Crie o arquivo `.env` na raiz do projeto ou configure as variáveis no seu orquestrador:

```bash
# Ambiente de Execução
NODE_ENV=production
PORT=3000

# Identificação da Instância
VITE_INSTANCE_ID=inst-enlace-fibra-001
VITE_PROVEDOR_NOME="Enlace Telecomunicações"
VITE_CNPJ="14.892.341/0001-90"

# Inteligência Artificial MaIA (Gemini 2.5 Flash)
GEMINI_API_KEY=sua_chave_gemini_api_aqui

# Banco de Dados Dedicado (PostgreSQL 16)
DATABASE_URL=postgresql://enlace_user:senha_forte@localhost:5432/enlace_crm_db?sslmode=require

# Cache de Sessão & Filas (Opcional - Redis)
REDIS_URL=redis://localhost:6379

# Canal Oficial Meta WhatsApp Cloud API
WHATSAPP_API_TOKEN=EAAG...seutoken
WHATSAPP_PHONE_NUMBER_ID=109283746501928
WHATSAPP_VERIFY_TOKEN=token_secreto_webhook_enlace

# Integração SGP / ERP de Provedor
SGP_INTEGRACAO=IXC_SOFT            # Opções: IXC_SOFT, MK_AUTH, HUBSOFT, SGP
SGP_API_ENDPOINT=https://sgp.provedor.com.br/webservice/v1
SGP_API_TOKEN=token_autenticacao_sgp

# Telefonia Asterisk / FreePBX (WebRTC SIP)
ASTERISK_WEBRTC_WSS=wss://pbx.provedor.com.br:8089/ws
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=turn:turn.provedor.com.br:3478
TURN_USERNAME=enlace_webrtc
TURN_PASSWORD=credencial_turn_secreta
```

---

## 4. Métodos de Implantação

### Opção A: Deploy com Docker & Docker Compose (Recomendado para VPS dedicada)

1. **Clone o repositório no servidor**:
   ```bash
   git clone https://github.com/sua-empresa/enlace-telecom-crm.git /opt/enlace-crm
   cd /opt/enlace-crm
   ```

2. **Configure o arquivo de ambiente**:
   ```bash
   cp .env.example .env
   nano .env
   ```

3. **Construa e inicie os contêineres**:
   ```bash
   docker compose up -d --build
   ```

4. **Verifique os logs e status dos serviços**:
   ```bash
   docker compose ps
   docker compose logs -f enlace-crm
   ```

5. **Teste o endpoint de health check**:
   ```bash
   curl -I http://localhost:3000/health
   # HTTP/1.1 200 OK
   # Content-Type: application/json; charset=utf-8
   ```

---

### Opção B: Deploy em Google Cloud Run (Serverless Container)

1. **Autentique no Google Cloud SDK**:
   ```bash
   gcloud auth login
   gcloud config set project id-do-seu-projeto-gcp
   ```

2. **Construa a imagem no Google Artifact Registry**:
   ```bash
   gcloud builds submit --tag gcr.io/id-do-seu-projeto-gcp/enlace-crm:v1.0.0 .
   ```

3. **Implante no Cloud Run**:
   ```bash
   gcloud run deploy enlace-telecom-crm \
     --image gcr.io/id-do-seu-projeto-gcp/enlace-crm:v1.0.0 \
     --platform managed \
     --region southamerica-east1 \
     --allow-unauthenticated \
     --port 3000 \
     --memory 2Gi \
     --cpu 2 \
     --set-env-vars NODE_ENV=production,GEMINI_API_KEY="AIzaSy..."
   ```

---

### Opção C: Deploy Direto em Linux Ubuntu (Systemd + Nginx + Let's Encrypt)

1. **Instale dependências do sistema**:
   ```bash
   sudo apt update && sudo apt install -y curl git nginx certbot python3-certbot-nginx
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. **Instale e compile a aplicação**:
   ```bash
   cd /var/www/enlace-crm
   npm ci
   npm run build
   ```

3. **Configure o serviço Systemd (`/etc/systemd/system/enlace-crm.service`)**:
   ```ini
   [Unit]
   Description=Enlace Telecom CRM Daemon
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/enlace-crm
   ExecStart=/usr/bin/npm start
   Restart=on-failure
   RestartSec=5
   Environment=NODE_ENV=production
   Environment=PORT=3000

   [Install]
   WantedBy=multi-user.target
   ```

4. **Inicie o serviço**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now enlace-crm
   ```

5. **Configure o Nginx Reverse Proxy (`/etc/nginx/sites-available/crm.provedor.com.br`)**:
   ```nginx
   server {
       server_name crm.provedor.com.br;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Gere o certificado SSL gratuito**:
   ```bash
   sudo certbot --nginx -d crm.provedor.com.br
   ```

---

## 5. Configuração do WebPhone WebRTC & Asterisk SIP

Para habilitar a telefonia IP em tempo real:
1. No Asterisk, certifique-se de que o módulo `res_http_websocket.so` e `chan_pjsip.so` estejam habilitados com TLS;
2. Libere a porta WebSocket segura (`8089/tcp`) e a faixa de áudio RTP (`10000-20000/udp`) no firewall;
3. Configure o servidor STUN/TURN no arquivo `.env` para garantir a travessia de NAT em clientes atrás de CGNAT.

---

## 6. Rotina de Backup & Tolerância a Falhas

- **Backup Diário do PostgreSQL (Dump Automatizado)**:
  ```bash
  pg_dump -U enlace_user -h localhost enlace_crm_db | gzip > /backups/enlace_backup_$(date +%Y%m%d_%H%M%S).sql.gz
  ```
- **Retenção de Logs de Auditoria**: Os logs da trilha de conformidade LGPD devem ser preservados por no mínimo 5 anos conforme a legislação e regulamentação da Anatel.
