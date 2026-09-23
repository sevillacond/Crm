import React from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  TrendingUp, 
  PhoneCall, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Building2,
  Workflow
} from 'lucide-react';
import { Deal, Contato } from '../types';

interface DashboardViewProps {
  deals: Deal[];
  contatos: Contato[];
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  deals,
  contatos,
  onNavigateTab
}) => {
  const mrrTotal = deals.reduce((acc, d) => acc + (d.etapa !== 'PERDIDO' ? d.valorMensal : 0), 0);
  const totalFechados = deals.filter(d => d.etapa === 'GANHO').length;
  const taxaConversao = deals.length > 0 ? Math.round((totalFechados / deals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              PRD Seção 30 • Dashboard Unificado
            </span>
            <span className="text-xs text-slate-400">• Atualizado em tempo real</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Painel Executivo 360° — Atendimento, IA, Comercial &amp; Telefonia
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Visão consolidada da operação de atendimento omnichannel, performance de resolução autônoma pela MaIA, funil de vendas e tráfego de voz SIP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('inbox')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Ver Inbox</span>
          </button>
          <button
            onClick={() => onNavigateTab('kanban')}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-950 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Abrir Kanban</span>
          </button>
        </div>
      </div>

      {/* 4 Quadrants defined by PRD Section 30 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quadrant 1: Atendimento Omnichannel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Atendimento</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
              SLA 98.4%
            </span>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Conversas Hoje:</span>
              <span className="text-2xl font-black text-white">48</span>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-center font-mono">
              <div>
                <div className="text-[10px] text-amber-400">Fila</div>
                <div className="text-sm font-bold text-white">3</div>
              </div>
              <div>
                <div className="text-[10px] text-cyan-400">Em Curso</div>
                <div className="text-sm font-bold text-white">8</div>
              </div>
              <div>
                <div className="text-[10px] text-emerald-400">Encerradas</div>
                <div className="text-sm font-bold text-white">37</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Tempo Médio 1ª Resposta:</span>
              <span className="font-mono text-emerald-400 font-bold">1m 12s</span>
            </div>
          </div>
        </div>

        {/* Quadrant 2: Inteligência MaIA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-950 border border-purple-800 text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Inteligência MaIA</span>
            </div>
            <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
              MCP Ativo
            </span>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Resoluções 100% IA:</span>
              <span className="text-2xl font-black text-purple-300">74%</span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-center font-mono">
              <div>
                <div className="text-[10px] text-slate-400">Autônomos</div>
                <div className="text-sm font-bold text-white">31</div>
              </div>
              <div>
                <div className="text-[10px] text-amber-400">Handoff Humano</div>
                <div className="text-sm font-bold text-white">9</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Ações MCP Auditadas:</span>
              <span className="font-mono text-cyan-400 font-bold">52 invocações</span>
            </div>
          </div>
        </div>

        {/* Quadrant 3: Comercial & CRM */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Comercial &amp; CRM</span>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
              {deals.length} Negócios
            </span>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Pipeline MRR:</span>
              <span className="text-2xl font-black text-white">
                R$ {mrrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-center font-mono">
              <div>
                <div className="text-[10px] text-slate-400">Leads Ativos</div>
                <div className="text-sm font-bold text-white">{contatos.length}</div>
              </div>
              <div>
                <div className="text-[10px] text-emerald-400">Conversão</div>
                <div className="text-sm font-bold text-emerald-400">{taxaConversao}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Ticket Médio:</span>
              <span className="font-mono text-white font-bold">
                R$ {deals.length > 0 ? (mrrTotal / deals.length).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Quadrant 4: Telefonia & Voz */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400">
                <PhoneCall className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Telefonia SIP</span>
            </div>
            <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
              WebRTC
            </span>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Chamadas Hoje:</span>
              <span className="text-2xl font-black text-white">24</span>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-center font-mono">
              <div>
                <div className="text-[10px] text-emerald-400">Atendidas</div>
                <div className="text-sm font-bold text-white">19</div>
              </div>
              <div>
                <div className="text-[10px] text-cyan-400">Realizadas</div>
                <div className="text-sm font-bold text-white">4</div>
              </div>
              <div>
                <div className="text-[10px] text-rose-400">Perdidas</div>
                <div className="text-sm font-bold text-rose-400">1</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Duração Média:</span>
              <span className="font-mono text-white font-bold">3m 45s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Timeline & Channel Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Health & Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Status dos Canais</h3>
            <span className="text-xs text-emerald-400 font-mono">3 Ativos</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <div className="text-xs font-semibold text-white">WhatsApp (Meta Cloud API)</div>
                  <div className="text-[10px] text-slate-400 font-mono">Canal Oficial Prioritário • 24 conversas</div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                Online
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <div>
                  <div className="text-xs font-semibold text-white">WebChat Widget Nativo</div>
                  <div className="text-[10px] text-slate-400 font-mono">Site da Empresa • 14 conversas</div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                Online
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <div>
                  <div className="text-xs font-semibold text-white">E-mail Comercial &amp; Suporte</div>
                  <div className="text-[10px] text-slate-400 font-mono">IMAP/SMTP Sincronizado • 10 tickets</div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                Online
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                <div>
                  <div className="text-xs font-semibold text-white">PBX SIP Asterisk (WebRTC)</div>
                  <div className="text-[10px] text-slate-400 font-mono">Ramal 1004 Conectado • Tronco OK</div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                Registrado
              </span>
            </div>
          </div>
        </div>

        {/* Live Activity Timeline (PRD Seção 29: Histórico Unificado) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Histórico Unificado em Tempo Real (PRD Seção 29)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Timeline Operacional</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <span className="text-slate-500 text-[11px] pt-0.5 shrink-0">14:38</span>
              <div className="flex-1 min-w-0 font-sans">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800">WhatsApp</span>
                  <span className="text-xs font-semibold text-white">João Pedro Ribeiro</span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Atendimento automático resolvido pela MaIA: Consulta de 2ª via de boleto via Tool Gateway.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <span className="text-slate-500 text-[11px] pt-0.5 shrink-0">14:25</span>
              <div className="flex-1 min-w-0 font-sans">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 text-[10px] font-mono border border-indigo-800">SIP Call</span>
                  <span className="text-xs font-semibold text-white">Dra. Camila Siqueira</span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Chamada realizada via WebPhone por Lucas Mendes (Comercial). Duração: 4m 12s.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <span className="text-slate-500 text-[11px] pt-0.5 shrink-0">14:10</span>
              <div className="flex-1 min-w-0 font-sans">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800">Kanban</span>
                  <span className="text-xs font-semibold text-white">Empresa Alpha Log</span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Oportunidade movida para &quot;Proposta Apresentada&quot; no valor de R$ 349,90/mês.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <span className="text-slate-500 text-[11px] pt-0.5 shrink-0">13:52</span>
              <div className="flex-1 min-w-0 font-sans">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 text-[10px] font-mono border border-purple-800">Handoff</span>
                  <span className="text-xs font-semibold text-white">Mercado Central Ltda</span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  MaIA transferiu conversa para a Fila Comercial com ficha de contexto preenchida.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
