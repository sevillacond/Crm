import React, { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Send, 
  Sparkles, 
  User, 
  Phone, 
  Paperclip, 
  FileText, 
  Tag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  ArrowRight,
  ExternalLink,
  DollarSign,
  Lock,
  Headphones,
  Radio
} from 'lucide-react';
import { Contato, User as UserType } from '../types';
import { notify } from '../utils/notify';

interface Message {
  id: string;
  sender: 'cliente' | 'atendente' | 'maia' | 'sistema';
  senderName: string;
  text: string;
  timestamp: string;
  isInternalNote?: boolean;
}

interface Conversation {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTipo: 'PF' | 'PJ';
  canal: 'WHATSAPP' | 'WEBCHAT' | 'EMAIL';
  status: 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'MAIA' | 'ENCERRADO';
  fila: 'Comercial' | 'Suporte' | 'Financeiro';
  atendenteNome?: string;
  ultimaMensagem: string;
  tempoEspera: string;
  scoreMaia: number;
  mensagens: Message[];
}

interface InboxViewProps {
  contatos: Contato[];
  currentUser: UserType;
  onOpenWebPhone?: (phone: string, name: string) => void;
  onOpenMaiaWithContext?: (conversation: Conversation) => void;
  onOpenViabilidade?: (contato: Contato) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  contatos,
  currentUser,
  onOpenWebPhone,
  onOpenMaiaWithContext,
  onOpenViabilidade
}) => {
  const [activeFilaFilter, setActiveFilaFilter] = useState<string>('TODOS');
  const [search, setSearch] = useState<string>('');
  const [selectedConversationId, setSelectedConversationId] = useState<string>('conv-1');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      clienteId: 'c1',
      clienteNome: 'Mariana Silva Costa',
      clienteTipo: 'PF',
      canal: 'WHATSAPP',
      status: 'EM_ATENDIMENTO',
      fila: 'Comercial',
      atendenteNome: 'Lucas Mendes',
      ultimaMensagem: 'Gostaria de saber se o plano de 600 Mega tem Wi-Fi 6 incluso.',
      tempoEspera: '2m',
      scoreMaia: 94,
      mensagens: [
        {
          id: 'm1',
          sender: 'cliente',
          senderName: 'Mariana Silva',
          text: 'Olá! Estou pesquisando internet de fibra para minha residência no Parque das Rosas.',
          timestamp: '14:20'
        },
        {
          id: 'm2',
          sender: 'maia',
          senderName: 'MaIA (IA)',
          text: 'Olá Mariana! Seja bem-vinda à Enlace Telecom. Temos viabilidade confirmada na sua região no Parque das Rosas com CTO a menos de 45 metros. Nossos planos contam com Wi-Fi 6 Mesh de alta performance. Como posso te auxiliar com a melhor opção?',
          timestamp: '14:20'
        },
        {
          id: 'm3',
          sender: 'cliente',
          senderName: 'Mariana Silva',
          text: 'Gostaria de saber se o plano de 600 Mega tem Wi-Fi 6 incluso.',
          timestamp: '14:22'
        },
        {
          id: 'm4',
          sender: 'sistema',
          senderName: 'Sistema',
          text: 'Handoff: Operador Lucas Mendes assumiu a conversa. MaIA em modo copiloto.',
          timestamp: '14:23'
        }
      ]
    },
    {
      id: 'conv-2',
      clienteId: 'c2',
      clienteNome: 'Mercado Central do Bairro Ltda',
      clienteTipo: 'PJ',
      canal: 'WEBCHAT',
      status: 'MAIA',
      fila: 'Comercial',
      atendenteNome: 'MaIA (IA)',
      ultimaMensagem: 'Qual é o prazo padrão de instalação de link dedicado?',
      tempoEspera: '35s',
      scoreMaia: 88,
      mensagens: [
        {
          id: 'm20',
          sender: 'cliente',
          senderName: 'Roberto (Mercado Central)',
          text: 'Boa tarde, precisamos de um link redundante com IP fixo para nosso servidor de emissão de NF.',
          timestamp: '14:30'
        },
        {
          id: 'm21',
          sender: 'maia',
          senderName: 'MaIA (IA)',
          text: 'Boa tarde Roberto! Para planos corporativos com IP Fixo entregamos SLA de 4 horas e instalação expressa em até 48h úteis.',
          timestamp: '14:31'
        },
        {
          id: 'm22',
          sender: 'cliente',
          senderName: 'Roberto (Mercado Central)',
          text: 'Qual é o prazo padrão de instalação de link dedicado?',
          timestamp: '14:32'
        }
      ]
    },
    {
      id: 'conv-3',
      clienteId: 'c3',
      clienteNome: 'Carlos Eduardo Nogueira',
      clienteTipo: 'PF',
      canal: 'WHATSAPP',
      status: 'AGUARDANDO',
      fila: 'Financeiro',
      atendenteNome: undefined,
      ultimaMensagem: 'Preciso da segunda via da fatura com vencimento hoje.',
      tempoEspera: '4m',
      scoreMaia: 76,
      mensagens: [
        {
          id: 'm30',
          sender: 'cliente',
          senderName: 'Carlos Eduardo',
          text: 'Preciso da segunda via da fatura com vencimento hoje.',
          timestamp: '14:18'
        }
      ]
    },
    {
      id: 'conv-4',
      clienteId: 'c4',
      clienteNome: 'Dra. Camila Siqueira',
      clienteTipo: 'PF',
      canal: 'EMAIL',
      status: 'EM_ATENDIMENTO',
      fila: 'Comercial',
      atendenteNome: 'Lucas Mendes',
      ultimaMensagem: 'Recebi a proposta comercial por e-mail e gostaria de agendar a instalação.',
      tempoEspera: '12m',
      scoreMaia: 98,
      mensagens: [
        {
          id: 'm40',
          sender: 'cliente',
          senderName: 'Dra. Camila Siqueira',
          text: 'Recebi a proposta comercial por e-mail e gostaria de agendar a instalação para sexta-feira de manhã.',
          timestamp: '13:50'
        }
      ]
    }
  ]);

  const activeConv = conversations.find(c => c.id === selectedConversationId) || conversations[0];
  const activeContact = contatos.find(c => c.id === activeConv?.clienteId) || contatos[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConv) return;

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: isInternalNote ? 'sistema' : 'atendente',
      senderName: isInternalNote ? `Nota Privada (${currentUser.name})` : currentUser.name,
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isInternalNote
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeConv.id) {
        return {
          ...c,
          status: 'EM_ATENDIMENTO',
          atendenteNome: currentUser.name,
          ultimaMensagem: isInternalNote ? c.ultimaMensagem : inputMessage,
          mensagens: [...c.mensagens, newMsg]
        };
      }
      return c;
    }));

    setInputMessage('');
    setIsInternalNote(false);
  };

  const handleTransferToHuman = (convId: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        const handoffMsg: Message = {
          id: `m-${Date.now()}`,
          sender: 'sistema',
          senderName: 'Sistema Enlace',
          text: `Handoff executado: Operador ${currentUser.name} assumiu a conversa. MaIA mantida em modo co-piloto.`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        return {
          ...c,
          status: 'EM_ATENDIMENTO',
          atendenteNome: currentUser.name,
          mensagens: [...c.mensagens, handoffMsg]
        };
      }
      return c;
    }));
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = !search || c.clienteNome.toLowerCase().includes(search.toLowerCase()) || c.ultimaMensagem.toLowerCase().includes(search.toLowerCase());
    const matchesFila = activeFilaFilter === 'TODOS' || c.fila === activeFilaFilter || (activeFilaFilter === 'MEUS' && c.atendenteNome === currentUser.name);
    return matchesSearch && matchesFila;
  });

  return (
    <div className="h-[calc(100vh-140px)] min-h-[600px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex">
      {/* COLUMN 1: Conversation List (Omnichannel) */}
      <div className="w-80 sm:w-96 border-r border-slate-800 flex flex-col bg-slate-950/60 shrink-0">
        {/* Header & Search */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Inbox Omnichannel</span>
            </h3>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
              {filteredConversations.length} Ativas
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar conversas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Fila Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-medium scrollbar-none">
            {[
              { id: 'TODOS', label: 'Todos' },
              { id: 'MEUS', label: 'Meus' },
              { id: 'Comercial', label: 'Comercial' },
              { id: 'Suporte', label: 'Suporte' },
              { id: 'Financeiro', label: 'Financeiro' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilaFilter(tab.id)}
                className={`px-2 py-0.8 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilaFilter === tab.id
                    ? 'bg-cyan-950 text-cyan-200 border border-cyan-700/60 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of Conversations */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {filteredConversations.map(conv => {
            const isSelected = conv.id === selectedConversationId;

            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                className={`p-3 cursor-pointer transition-colors relative ${
                  isSelected ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Canal Badge */}
                    {conv.canal === 'WHATSAPP' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="WhatsApp" />
                    )}
                    {conv.canal === 'WEBCHAT' && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" title="WebChat Widget" />
                    )}
                    {conv.canal === 'EMAIL' && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="E-mail" />
                    )}

                    <span className="font-bold text-xs text-white truncate">
                      {conv.clienteNome}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {conv.tempoEspera}
                  </span>
                </div>

                <p className="text-xs text-slate-400 truncate line-clamp-1 mb-2">
                  {conv.ultimaMensagem}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={`px-1.5 py-0.2 rounded border ${
                    conv.status === 'MAIA' 
                      ? 'bg-purple-950 text-purple-300 border-purple-800' 
                      : conv.status === 'AGUARDANDO'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {conv.status === 'MAIA' ? 'MaIA Ativa' : conv.status}
                  </span>

                  <span className="text-slate-500">
                    Fila: {conv.fila}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COLUMN 2: Active Chat & Messaging */}
      <div className="flex-1 flex flex-col bg-slate-900/80 min-w-0">
        {/* Chat Top Bar */}
        <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 font-bold border border-slate-700">
              {activeConv.clienteNome.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white truncate max-w-xs">
                  {activeConv.clienteNome}
                </h4>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {activeConv.canal}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Fila {activeConv.fila}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Atendente Atual: <span className="text-white font-semibold">{activeConv.atendenteNome || 'Aguardando Operador'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeConv.status === 'MAIA' && (
              <button
                onClick={() => handleTransferToHuman(activeConv.id)}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Assumir Conversa</span>
              </button>
            )}

            {onOpenViabilidade && activeContact && (
              <button
                onClick={() => onOpenViabilidade(activeContact)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Consultar Viabilidade Óptica FTTH/GPON para este cliente"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Viabilidade</span>
              </button>
            )}

            {onOpenMaiaWithContext && (
              <button
                onClick={() => onOpenMaiaWithContext(activeConv)}
                className="px-2.5 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Abrir Copiloto MaIA com histórico da conversa"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">MaIA Copilot</span>
              </button>
            )}

            {onOpenWebPhone && activeContact?.telefone && (
              <button
                onClick={() => onOpenWebPhone(activeContact.telefone, activeContact.nome)}
                className="p-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 transition-colors cursor-pointer"
                title={`Ligar para ${activeContact.nome} via WebPhone VoIP`}
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {activeConv.mensagens.map(msg => {
            if (msg.sender === 'sistema') {
              return (
                <div key={msg.id} className="text-center my-3">
                  <span className={`inline-block text-[11px] font-mono px-3 py-1 rounded-full border ${
                    msg.isInternalNote
                      ? 'bg-amber-950/80 text-amber-200 border-amber-700'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}>
                    {msg.text} • {msg.timestamp}
                  </span>
                </div>
              );
            }

            const isMe = msg.sender === 'atendente';
            const isMaia = msg.sender === 'maia';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  {isMaia && <Sparkles className="w-3 h-3 text-purple-400" />}
                  <span className="text-[10px] text-slate-400 font-medium">{msg.senderName}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-md rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                      : isMaia
                      ? 'bg-purple-950/80 border border-purple-800/80 text-purple-100 rounded-tl-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Co-pilot MaIA Suggestion Bar (PRD Seção 17: MaIA em modo copiloto após handoff) */}
        <div className="px-4 py-2 bg-purple-950/30 border-t border-purple-900/40 flex items-center justify-between text-xs text-purple-300">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
            <span className="truncate">
              <strong>Sugestão MaIA:</strong> &quot;Sim, o plano 600 Mega inclui comodato de Roteador Wi-Fi 6 Dual-Band sem taxa extra.&quot;
            </span>
          </div>
          <button
            onClick={() => setInputMessage('Sim, o plano de 600 Mega inclui comodato de Roteador Wi-Fi 6 Dual-Band sem taxa extra de adesão.')}
            className="px-2 py-0.5 rounded bg-purple-900 hover:bg-purple-800 text-[10px] font-mono font-bold text-white cursor-pointer shrink-0 ml-2"
          >
            Usar Sugestão
          </button>
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsInternalNote(false)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  !isInternalNote ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mensagem Externa
              </button>
              <button
                type="button"
                onClick={() => setIsInternalNote(true)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  isInternalNote ? 'bg-amber-950 text-amber-300 border border-amber-800 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Nota Interna (Privada)</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Pressione Enter para enviar
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={isInternalNote ? "Escreva uma nota interna (apenas visível para a equipe)..." : "Digite uma resposta para o cliente..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className={`flex-1 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                isInternalNote
                  ? 'bg-amber-950/20 border border-amber-800/80 focus:border-amber-500'
                  : 'bg-slate-900 border border-slate-800 focus:border-cyan-500'
              }`}
            />

            <button
              type="submit"
              className={`p-2 rounded-xl text-white shadow-lg cursor-pointer transition-all ${
                isInternalNote
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* COLUMN 3: Customer 360° Profile & Historic */}
      <div className="w-72 lg:w-80 border-l border-slate-800 p-4 bg-slate-950/80 flex flex-col justify-between overflow-y-auto shrink-0 hidden md:flex">
        <div className="space-y-4">
          <div className="text-center pb-3 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400 mx-auto flex items-center justify-center font-bold text-base mb-2">
              {activeConv.clienteNome.slice(0, 2).toUpperCase()}
            </div>
            <h4 className="text-sm font-bold text-white truncate">{activeConv.clienteNome}</h4>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {activeContact?.cpfCnpj || 'CPF: 123.456.789-00'}
            </div>
          </div>

          {/* Quick Details */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Telefone:</span>
              <span className="text-white font-mono">{activeContact?.telefone || '(11) 98765-4321'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>E-mail:</span>
              <span className="text-white truncate max-w-[140px]">{activeContact?.email || 'cliente@exemplo.com'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Bairro/Cidade:</span>
              <span className="text-white">{activeContact?.bairro || 'Centro'} / {activeContact?.cidade || 'São Paulo'}</span>
            </div>
          </div>

          {/* Billing & Cobrança (PRD Seção 28) */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Situação Financeira</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                Em Dia
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span>Última Fatura:</span>
              <span className="text-white">R$ 119,90</span>
            </div>
            <button 
              onClick={() => {
                notify('2ª Via de fatura Pix gerada com sucesso! Código Copia e Cola anexado ao rascunho.', 'success');
                setInputMessage('Olá! Segue a 2ª via da sua fatura no valor de R$ 119,90. Chave Pix Copia e Cola:\n00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865406119.905802BR5914ENLACE TELECOM6009SAO PAULO62070503***6304E2CA');
              }}
              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gerar 2ª Via Pix no Chat</span>
            </button>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Tags do Cliente</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">Lead Quente</span>
              <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">Viável FTTH</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Residencial</span>
            </div>
          </div>
        </div>

        {/* Footer Score */}
        <div className="pt-3 border-t border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 font-mono">Score de Propensão MaIA</div>
          <div className="text-lg font-black text-cyan-400 font-mono">{activeConv.scoreMaia}/100</div>
        </div>
      </div>
    </div>
  );
};
