import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  FileText, 
  MapPin, 
  DollarSign, 
  Cpu,
  Bot
} from 'lucide-react';
import { Contato, Deal, Plano, User } from '../types';

interface MaiaCopilotModalProps {
  onClose: () => void;
  selectedDeal?: Deal | null;
  selectedContato?: Contato | null;
  currentUser: User;
  planos: Plano[];
  onRefreshData?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'MAIA';
  text: string;
  toolExecutada?: string;
  auditId?: string;
  timestamp: string;
}

export const MaiaCopilotModal: React.FC<MaiaCopilotModalProps> = ({
  onClose,
  selectedDeal,
  selectedContato,
  currentUser,
  planos,
  onRefreshData
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'MAIA',
      text: `Olá, ${currentUser.name.split(' ')[0]}! Sou a MaIA v3.8, seu co-piloto especializado em operações de Provedores de Internet. Como posso ajudar com este atendimento?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const quickPrompts = [
    { label: 'Qualificar Lead & Gerar Score', text: 'Analise os dados deste lead e calcule um Score de Qualificação (0 a 100), temperatura e propensão de fechamento.' },
    { label: 'Consultar Viabilidade CTO', text: 'Verifique a viabilidade óptica para este endereço e me informe a distância da CTO mais próxima.' },
    { label: 'Recomendar Plano Ideal', text: 'Considerando os planos do provedor, qual a melhor recomendação para este cliente sem dar desconto desnecessário?' },
    { label: 'Mensagem WhatsApp de Proposta', text: 'Gere uma mensagem amigável e persuasiva para enviar no WhatsApp apresentando a proposta comercial de fibra óptica.' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || prompt;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setPrompt('');
    setLoading(true);

    try {
      const response = await fetch('/api/maia/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          prompt: text,
          dealId: selectedDeal?.id,
          contatoId: selectedContato?.id
        })
      });

      if (!response.ok) {
        throw new Error('Falha na resposta da MaIA');
      }

      const data = await response.json();

      const maiaMsg: ChatMessage = {
        id: `msg_m_${Date.now()}`,
        sender: 'MAIA',
        text: data.resposta,
        toolExecutada: data.toolExecutada,
        auditId: data.auditId,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, maiaMsg]);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'MAIA',
          text: `Erro ao contatar MaIA Gateway: ${err.message || 'Erro desconhecido'}. Verifique logs do servidor.`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[90vh] max-h-[720px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-950">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">MaIA Co-Pilot</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Gemini 3.8 Flash • MCP Gateway
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Acesso via ferramentas auditadas (Governança &amp; RBAC)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Context Banner */}
        {(selectedContato || selectedDeal) && (
          <div className="bg-indigo-950/30 border-b border-indigo-900/40 px-5 py-2 text-xs flex items-center justify-between text-indigo-200">
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-indigo-400">Contexto:</span>
              <span className="font-bold text-white">{selectedContato?.nome || selectedDeal?.titulo}</span>
              {selectedContato && (
                <span className="text-slate-400 text-[11px] font-mono truncate">
                  ({selectedContato.bairro} - CEP {selectedContato.cep})
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-200 shrink-0">
              {selectedDeal?.etapa || selectedContato?.status}
            </span>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.sender === 'USER'
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                {msg.sender === 'MAIA' && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 mb-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>MaIA (Módulo de IA)</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Tool execution badge & audit indicator */}
                {msg.toolExecutada && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Tool: {msg.toolExecutada}</span>
                    </div>
                    {msg.auditId && <span>Audit: #{msg.auditId.slice(-6)}</span>}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 p-2 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>MaIA consultando ferramentas autorizadas e gerando resposta...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/60 overflow-x-auto flex gap-1.5 scrollbar-none">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.text)}
              disabled={loading}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua dúvida ou instrução para a MaIA..."
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !prompt.trim()}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white shadow-md shadow-cyan-950 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
