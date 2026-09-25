import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Radio, 
  Code, 
  Copy, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink, 
  Send, 
  Sparkles, 
  Key, 
  PhoneCall, 
  Server,
  Layers
} from 'lucide-react';
import { notify } from '../utils/notify';

export const CanaisIntegracoesView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'WHATSAPP' | 'WEBCHAT' | 'INTEGRACOES'>('WHATSAPP');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [integrationHealth, setIntegrationHealth] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/health/integrations')
      .then(res => res.json())
      .then(data => setIntegrationHealth(data))
      .catch(() => {});
  }, []);

  // WebChat widget customization
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState<string>('#0891b2');
  const [widgetWelcomeMsg, setWidgetWelcomeMsg] = useState<string>('Olá! Seja bem-vindo à Enlace Telecom. Como a MaIA pode te ajudar hoje?');
  const [webChatTestInput, setWebChatTestInput] = useState<string>('');
  const [webChatMessages, setWebChatMessages] = useState<Array<{ sender: string; text: string }>>([
    { sender: 'maia', text: 'Olá! Seja bem-vindo à Enlace Telecom. Como a MaIA pode te ajudar hoje?' }
  ]);

  const currentInstanceId = (() => {
    try {
      const stored = localStorage.getItem('enlace_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.instanceId) return u.instanceId;
      }
    } catch {
      // fallback
    }
    return 'SEU_INSTANCE_ID';
  })();

  const embedScript = `<!-- Enlace-CRM WebChat Nativo (PRD Seção 10) -->
<script 
  src="https://cdn.enlacecrm.com.br/widget/v1/enlace-webchat.js"
  data-instance-id="${currentInstanceId}"
  data-primary-color="${widgetPrimaryColor}"
  data-title="Atendimento ao Cliente"
  data-avatar="maia"
  async>
</script>`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(embedScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSendWebChatTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webChatTestInput.trim()) return;

    const userText = webChatTestInput;
    setWebChatMessages(prev => [...prev, { sender: 'visitante', text: userText }]);
    setWebChatTestInput('');

    setTimeout(() => {
      setWebChatMessages(prev => [
        ...prev, 
        { 
          sender: 'maia', 
          text: `Compreendi sua dúvida sobre "${userText}". Temos viabilidade imediata para internet fibra de alta velocidade na sua região! Deseja consultar planos residenciais ou falar com nossa equipe comercial?` 
        }
      ]);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              PRD Seções 10, 11, 26 &amp; 27 • Conectividade &amp; Canais
            </span>
            <span className="text-xs text-slate-400">• Arquitetura de Adaptadores</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Canais Omnichannel &amp; Integrações de Provedores
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure o canal oficial Meta WhatsApp Cloud API, incorpore o WebChat Nativo ao site e conecte os adaptadores autorizados de SGP (IXC, HubSoft e Asterisk SIP).
          </p>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('WHATSAPP')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'WHATSAPP' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            WhatsApp (Meta &amp; WAHA)
          </button>
          <button
            onClick={() => setActiveSubTab('WEBCHAT')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'WEBCHAT' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            WebChat Widget Nativo
          </button>
          <button
            onClick={() => setActiveSubTab('INTEGRACOES')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'INTEGRACOES' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Adapters SGP / ERP / PBX
          </button>
        </div>
      </div>

      {/* SUBTAB: WHATSAPP (PRD Seção 11) */}
      {activeSubTab === 'WHATSAPP' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Official Meta Cloud API */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Meta WhatsApp Cloud API (Oficial Prioritário)</h3>
                  <p className="text-[11px] text-slate-400">Canal homologado Meta Business Platform</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                Conectado
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Phone Number ID (WABA)</label>
                <input
                  type="text"
                  readOnly
                  value="10928374659201"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">WABA Account ID</label>
                <input
                  type="text"
                  readOnly
                  value="88291049281746"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Webhook Endpoint da Instância (Seguro)</label>
                <input
                  type="text"
                  readOnly
                  value="https://enlace-telecom.enlacecrm.com.br/api/v1/webhooks/whatsapp"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-emerald-400 text-xs focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Qualidade do Número:</span>
                  <span className="text-emerald-400 font-bold">ALTA (Verde)</span>
                </div>
                <div className="flex justify-between">
                  <span>Limite de Mensagens Ativas:</span>
                  <span className="text-white font-mono">10.000 clientes / 24h</span>
                </div>
                <div className="flex justify-between">
                  <span>Templates HSM Aprovados:</span>
                  <span className="text-cyan-400 font-mono">12 modelos</span>
                </div>
              </div>
            </div>
          </div>

          {/* WAHA / QR Alternative (PRD Seção 11.2) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-950 border border-amber-800 text-amber-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">WAHA / QR Code (Canal Opcional)</h3>
                  <p className="text-[11px] text-slate-400">Tecnologia alternativa isolada sem acoplamento estrutural</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Standby
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/60 text-xs text-amber-300 leading-relaxed">
              <strong>Diretriz PRD 11.2:</strong> O WAHA é tratado como tecnologia não oficial e opcional. O CRM mantém separação estrita entre o canal oficial e QR, evitando qualquer dependência arquitetural.
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Sessão QR Secundária</div>
                <div className="text-[10px] text-slate-400 font-mono">Para canais de atendimento interno ou testes</div>
              </div>
              <button
                onClick={() => notify('Sessão WAHA iniciada em container isolado com sucesso.', 'info')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer"
              >
                Gerar QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: WEBCHAT NATIVO (PRD Seção 10) */}
      {activeSubTab === 'WEBCHAT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code & Widget Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span>Script de Incorporação (Embed Widget)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Conversation Core Unificado</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              O WebChat é nativo do Enlace-CRM. Ele utiliza o mesmo core de conversação do WhatsApp e as mensagens caem diretamente no Inbox único dos operadores.
            </p>

            <div className="relative">
              <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                {embedScript}
              </pre>
              <button
                onClick={handleCopyScript}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-white">Cor Primária do Widget</label>
              <div className="flex items-center gap-3">
                {['#0891b2', '#059669', '#4f46e5', '#d97706', '#e11d48'].map(color => (
                  <button
                    key={color}
                    onClick={() => setWidgetPrimaryColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                      widgetPrimaryColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              <span className="font-bold text-slate-200">Segurança (PRD Seção 10.2):</span> O widget não expõe credenciais, tokens administrativos nem acesso ao banco PostgreSQL.
            </div>
          </div>

          {/* Interactive Live WebChat Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Simulador do Widget no Site da Empresa</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Ao Vivo
                </span>
              </div>

              {/* Simulated Chat Window */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-80">
                {/* Header Widget */}
                <div
                  style={{ backgroundColor: widgetPrimaryColor }}
                  className="p-3 text-white flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Enlace Fibra Atendimento</div>
                      <div className="text-[9px] text-white/80 mt-0.5">MaIA Online</div>
                    </div>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                  {webChatMessages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${m.sender === 'visitante' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                          m.sender === 'visitante'
                            ? 'bg-cyan-600 text-white rounded-tr-none'
                            : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Send */}
                <form onSubmit={handleSendWebChatTest} className="p-2 border-t border-slate-800 bg-slate-900 flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite uma mensagem no site..."
                    value={webChatTestInput}
                    onChange={(e) => setWebChatTestInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: INTEGRACOES & ADAPTERS (PRD Seções 26 & 27) */}
      {activeSubTab === 'INTEGRACOES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              nome: 'SGP (IXC Soft)',
              desc: 'Integração de contratos, planos e cadastro de assinantes FTTH via Webservice.',
              status: integrationHealth.sgp === 'CONNECTED' ? 'CONECTADO' : (integrationHealth.sgp === 'ADAPTER_PARTIAL' ? 'ADAPTER PARCIAL' : 'NÃO CONFIGURADO'),
              statusColor: integrationHealth.sgp === 'CONNECTED' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800',
              tipo: 'Adapter REST API'
            },
            {
              nome: 'HubSoft ERP',
              desc: 'Consulta de situação de sinal de fibra óptica, desbloqueio de confiança e OLT.',
              status: 'STUB (NÃO HOMOLOGADO)',
              statusColor: 'bg-slate-800 text-slate-300 border-slate-700',
              tipo: 'Adapter STUB'
            },
            {
              nome: 'Enlace-PBX (Asterisk SIP)',
              desc: 'Infraestrutura de voz separada para chamadas WebPhone WebRTC.',
              status: integrationHealth.asterisk === 'CONNECTED' ? 'CONECTADO' : (integrationHealth.asterisk === 'ADAPTER_PARTIAL' ? 'ADAPTER PARCIAL (WSS)' : 'MOCK / SIMULADO'),
              statusColor: integrationHealth.asterisk === 'CONNECTED' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-indigo-950 text-indigo-300 border-indigo-800',
              tipo: 'SIP WebSocket / WebRTC'
            },
            {
              nome: 'Enlace-Pay (Pix Bancário)',
              desc: 'Geração de Pix dinâmico instantâneo e conciliação via webhook assinado HMAC-SHA256.',
              status: integrationHealth.payments === 'PRODUCTION' ? 'PRODUÇÃO' : (integrationHealth.payments === 'CONNECTED' ? 'CONECTADO' : 'MOCK / SANDBOX'),
              statusColor: integrationHealth.payments === 'PRODUCTION' || integrationHealth.payments === 'CONNECTED' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-blue-950 text-blue-300 border-blue-800',
              tipo: 'API Bancária'
            },
            {
              nome: 'Meta WhatsApp Cloud API',
              desc: 'Canal oficial Meta Cloud API com webhooks verificados e modelos HSM.',
              status: integrationHealth.whatsapp === 'CONNECTED' ? 'CONECTADO' : (integrationHealth.whatsapp === 'ADAPTER_PARTIAL' ? 'ADAPTER PARCIAL' : 'NÃO CONFIGURADO'),
              statusColor: integrationHealth.whatsapp === 'CONNECTED' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800',
              tipo: 'Meta Graph API'
            },
            {
              nome: 'Google Gemini 2.5 Flash',
              desc: 'Motor de inteligência artificial com Structured Tool Calling e isolamento de instância.',
              status: integrationHealth.gemini === 'CONNECTED' ? 'OPERACIONAL' : 'NÃO CONFIGURADO',
              statusColor: integrationHealth.gemini === 'CONNECTED' ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-slate-800 text-slate-300 border-slate-700',
              tipo: '@google/genai SDK'
            }
          ].map(adapter => (
            <div
              key={adapter.nome}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400">{adapter.tipo}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${adapter.statusColor}`}>
                  {adapter.status}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">{adapter.nome}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{adapter.desc}</p>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-[11px] font-mono text-slate-500">Credenciais no Backend</span>
                <button
                  onClick={() => notify(`Adapter ${adapter.nome}: status operacional atual é ${adapter.status}. Configuração gerenciada via variáveis de ambiente da instância.`, 'info')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  Status do Adapter &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
