import React, { useState } from 'react';
import { 
  Plus, 
  Sparkles, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  Zap, 
  FileText,
  DollarSign,
  TrendingUp,
  Filter,
  Phone,
  Wrench
} from 'lucide-react';
import { Deal, DealEtapa, Contato, Plano, User, ViabilidadeStatus } from '../types';

interface KanbanBoardProps {
  deals: Deal[];
  contatos: Contato[];
  planos: Plano[];
  users: User[];
  currentUser: User;
  onMoveDealStage: (dealId: string, targetStage: DealEtapa) => void;
  onOpenNewDeal: () => void;
  onOpenViabilidade: (contato: Contato) => void;
  onAskMaiaAboutDeal: (deal: Deal, contato: Contato) => void;
  onOpenWebPhone?: (phone: string, name: string) => void;
  onOpenOrdemServico?: (deal: Deal, contato: Contato) => void;
  searchQuery: string;
}

const STAGES: { key: DealEtapa; label: string; color: string; bg: string }[] = [
  { key: 'NOVO_LEAD', label: 'Novo Lead', color: 'border-blue-500/40', bg: 'bg-blue-950/20' },
  { key: 'VIABILIDADE', label: 'Viabilidade Técnica', color: 'border-amber-500/40', bg: 'bg-amber-950/20' },
  { key: 'PROPOSTA', label: 'Apresentação Proposta', color: 'border-cyan-500/40', bg: 'bg-cyan-950/20' },
  { key: 'NEGOCIACAO', label: 'Negociação', color: 'border-indigo-500/40', bg: 'bg-indigo-950/20' },
  { key: 'INSTALACAO', label: 'Instalação Agendada', color: 'border-purple-500/40', bg: 'bg-purple-950/20' },
  { key: 'GANHO', label: 'Fechado / Ativado', color: 'border-emerald-500/40', bg: 'bg-emerald-950/20' },
  { key: 'PERDIDO', label: 'Perdido', color: 'border-rose-500/40', bg: 'bg-rose-950/20' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  deals,
  contatos,
  planos,
  users,
  currentUser,
  onMoveDealStage,
  onOpenNewDeal,
  onOpenViabilidade,
  onAskMaiaAboutDeal,
  onOpenWebPhone,
  onOpenOrdemServico,
  searchQuery
}) => {
  const [filterViabilidade, setFilterViabilidade] = useState<string>('TODOS');

  // Filter deals
  const filteredDeals = deals.filter((deal) => {
    const contato = contatos.find(c => c.id === deal.contatoId);
    const plano = planos.find(p => p.id === deal.planoId);
    const matchesSearch = 
      !searchQuery ||
      deal.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contato?.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contato?.bairro.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contato?.telefone.includes(searchQuery) ||
      plano?.nome.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesViabilidade = 
      filterViabilidade === 'TODOS' || 
      deal.statusViabilidade === filterViabilidade;

    return matchesSearch && matchesViabilidade;
  });

  // Calculate high-level pipeline stats
  const totalMRR = filteredDeals
    .filter(d => d.etapa !== 'PERDIDO')
    .reduce((acc, d) => acc + d.valorMensal, 0);

  const totalGanhos = filteredDeals.filter(d => d.etapa === 'GANHO').length;
  const taxaConversao = filteredDeals.length > 0 
    ? Math.round((totalGanhos / filteredDeals.length) * 100) 
    : 0;

  const ticketMedio = filteredDeals.length > 0
    ? (totalMRR / Math.max(1, filteredDeals.filter(d => d.etapa !== 'PERDIDO').length)).toFixed(2)
    : '0.00';

  const getViabilidadeBadge = (status: ViabilidadeStatus, cto?: string, dist?: number) => {
    switch (status) {
      case 'VIAVEL_CTO':
        return (
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{cto ? `${cto} (${dist}m)` : 'Viável CTO'}</span>
          </div>
        );
      case 'INVIAVEL':
        return (
          <div className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
            <span>Inviável Óptica</span>
          </div>
        );
      case 'EXPANSAO_NECESSARIA':
        return (
          <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Expansão de Rede</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Viabilidade Pendente</span>
          </div>
        );
    }
  };

  const getNextStage = (current: DealEtapa): DealEtapa | null => {
    const sequence: DealEtapa[] = ['NOVO_LEAD', 'VIABILIDADE', 'PROPOSTA', 'NEGOCIACAO', 'INSTALACAO', 'GANHO'];
    const idx = sequence.indexOf(current);
    if (idx >= 0 && idx < sequence.length - 1) {
      return sequence[idx + 1];
    }
    return null;
  };

  const getPrevStage = (current: DealEtapa): DealEtapa | null => {
    const sequence: DealEtapa[] = ['NOVO_LEAD', 'VIABILIDADE', 'PROPOSTA', 'NEGOCIACAO', 'INSTALACAO', 'GANHO'];
    const idx = sequence.indexOf(current);
    if (idx > 0) {
      return sequence[idx - 1];
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top Metrics & Pipeline Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Pipeline Ativo (MRR)</div>
            <div className="text-lg font-bold text-white">
              R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-xs text-slate-400 font-normal">/mês</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-950 border border-indigo-800/60 text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Ticket Médio Estimado</div>
            <div className="text-lg font-bold text-white">
              R$ {ticketMedio}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-800/60 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Taxa de Conversão</div>
            <div className="text-lg font-bold text-emerald-300">
              {taxaConversao}%
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-950 border border-purple-800/60 text-purple-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Total de Oportunidades</div>
            <div className="text-lg font-bold text-white">
              {filteredDeals.length} <span className="text-xs text-slate-400 font-normal">negócios</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter & Add New Deal */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/90 p-3 rounded-xl">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Filtrar Viabilidade:</span>
          {['TODOS', 'VIAVEL_CTO', 'PENDENTE', 'INVIAVEL'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterViabilidade(st)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                filterViabilidade === st
                  ? 'bg-slate-800 text-cyan-300 font-semibold border border-cyan-700/50'
                  : 'text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              {st === 'TODOS' ? 'Todos' : st === 'VIAVEL_CTO' ? 'Viável CTO' : st === 'PENDENTE' ? 'Pendente' : 'Inviável'}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenNewDeal}
          className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Negócio / Oportunidade</span>
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 min-h-[600px] overflow-x-auto pb-4">
        {STAGES.map((col) => {
          const colDeals = filteredDeals.filter(d => d.etapa === col.key);
          const colMRR = colDeals.reduce((acc, d) => acc + d.valorMensal, 0);

          return (
            <div
              key={col.key}
              className={`flex flex-col rounded-xl border ${col.color} ${col.bg} p-2.5 min-w-[260px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                <div>
                  <div className="text-xs font-bold text-slate-200 tracking-tight">
                    {col.label}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    R$ {colMRR.toFixed(2)}/mês
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300">
                  {colDeals.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
                {colDeals.length === 0 ? (
                  <div className="h-28 rounded-lg border border-dashed border-slate-800/80 flex items-center justify-center text-[11px] text-slate-500">
                    Nenhum negócio nesta etapa
                  </div>
                ) : (
                  colDeals.map((deal) => {
                    const contato = contatos.find(c => c.id === deal.contatoId);
                    const plano = planos.find(p => p.id === deal.planoId);
                    const responsavel = users.find(u => u.id === deal.responsavelId);
                    const nextStage = getNextStage(deal.etapa);
                    const prevStage = getPrevStage(deal.etapa);

                    return (
                      <div
                        key={deal.id}
                        className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 shadow-md hover:shadow-cyan-950/20 transition-all group"
                      >
                        {/* Card Header: Title & Probability */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                            {deal.titulo}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 font-medium">
                            {deal.probabilidade}%
                          </span>
                        </div>

                        {/* Customer & Address Details */}
                        {contato && (
                          <div className="space-y-1 text-[11px] text-slate-300 mb-2">
                            <div className="font-medium text-slate-200 truncate">
                              {contato.nome}
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 text-[10px] truncate">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{contato.bairro}, {contato.cidade}</span>
                            </div>
                          </div>
                        )}

                        {/* Plan & Value */}
                        <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 mb-2">
                          <div className="text-[10px] text-cyan-400 font-medium truncate">
                            {plano?.nome || 'Plano Personalizado'}
                          </div>
                          <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="font-bold text-white">
                              R$ {deal.valorMensal.toFixed(2)}<span className="text-[10px] text-slate-400 font-normal">/mês</span>
                            </span>
                            {deal.taxaAdesao > 0 && (
                              <span className="text-[10px] text-slate-400">
                                Instalação: R$ {deal.taxaAdesao.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Feasibility Status */}
                        <div className="mb-2">
                          {getViabilidadeBadge(deal.statusViabilidade, deal.ctoProxima, deal.distanciaMetros)}
                        </div>

                        {/* Card Actions & Responsible Avatar */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[11px]">
                          {/* Responsible Avatar */}
                          <div className="flex items-center gap-1.5" title={`Responsável: ${responsavel?.name || 'Não atribuído'}`}>
                            {responsavel?.avatar ? (
                              <img src={responsavel.avatar} alt={responsavel.name} className="w-5 h-5 rounded-full object-cover border border-slate-700" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-800 text-[9px] flex items-center justify-center text-slate-300">
                                ?
                              </div>
                            )}
                            <span className="text-[10px] text-slate-400 truncate max-w-[70px]">
                              {responsavel?.name.split(' ')[0]}
                            </span>
                          </div>

                          {/* Quick AI, Phone, CTO Feasibility, and OS Actions */}
                          <div className="flex items-center gap-1">
                            {contato && contato.telefone && onOpenWebPhone && (
                              <button
                                onClick={() => onOpenWebPhone(contato.telefone, contato.nome)}
                                title={`Discar para ${contato.nome} (${contato.telefone}) via WebPhone VoIP`}
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {contato && (
                              <button
                                onClick={() => onOpenViabilidade(contato)}
                                title="Consultar viabilidade técnica de CTO"
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {contato && onOpenOrdemServico && (
                              <button
                                onClick={() => onOpenOrdemServico(deal, contato)}
                                title="Criar ou visualizar Ordem de Serviço (O.S.)"
                                className="p-1 rounded hover:bg-amber-950 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {contato && (
                              <button
                                onClick={() => onAskMaiaAboutDeal(deal, contato)}
                                title="Analisar oportunidade com a MaIA"
                                className="p-1 rounded hover:bg-indigo-950 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Stage Progression Buttons */}
                        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1 text-[10px]">
                          {prevStage ? (
                            <button
                              onClick={() => onMoveDealStage(deal.id, prevStage)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Retornar etapa"
                            >
                              <ArrowLeft className="w-3 h-3" />
                              <span className="hidden sm:inline">Voltar</span>
                            </button>
                          ) : <div />}

                          <div className="flex items-center gap-1">
                            {deal.etapa !== 'PERDIDO' && deal.etapa !== 'GANHO' && (
                              <button
                                onClick={() => onMoveDealStage(deal.id, 'PERDIDO')}
                                className="px-1.5 py-1 rounded hover:bg-rose-950/80 text-rose-400 text-[10px] transition-colors cursor-pointer"
                                title="Marcar como perdido"
                              >
                                Perda
                              </button>
                            )}

                            {nextStage && (
                              <button
                                onClick={() => onMoveDealStage(deal.id, nextStage)}
                                className="px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title={`Avançar para ${nextStage}`}
                              >
                                <span>Avançar</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
