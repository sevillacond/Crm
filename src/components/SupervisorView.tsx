import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  PhoneCall, 
  MessageSquare, 
  ArrowRightLeft, 
  Headphones, 
  Eye, 
  BarChart3, 
  Filter, 
  Activity,
  Flame,
  Volume2
} from 'lucide-react';
import { User, Role } from '../types';
import { notify } from '../utils/notify';

interface OperatorStatus {
  id: string;
  name: string;
  role: Role;
  status: 'DISPONIVEL' | 'OCUPADO' | 'EM_CHAMADA' | 'PAUSA' | 'OFFLINE';
  fila: string;
  atendimentosAtivos: number;
  tempoNoEstado: string;
  ramalSip: string;
}

interface FilaMetrics {
  nome: string;
  emEspera: number;
  emAtendimento: number;
  slaPercent: number;
  tempoMedioEspera: string;
  tempoMedioAtendimento: string;
  operadoresDisponiveis: number;
}

export const SupervisorView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [selectedFila, setSelectedFila] = useState<string>('TODAS');

  const filas: FilaMetrics[] = [
    {
      nome: 'Comercial',
      emEspera: 2,
      emAtendimento: 6,
      slaPercent: 97.8,
      tempoMedioEspera: '1m 15s',
      tempoMedioAtendimento: '6m 40s',
      operadoresDisponiveis: 3
    },
    {
      nome: 'Suporte Técnico',
      emEspera: 4,
      emAtendimento: 8,
      slaPercent: 94.2,
      tempoMedioEspera: '2m 30s',
      tempoMedioAtendimento: '11m 20s',
      operadoresDisponiveis: 2
    },
    {
      nome: 'Financeiro',
      emEspera: 1,
      emAtendimento: 4,
      slaPercent: 99.1,
      tempoMedioEspera: '45s',
      tempoMedioAtendimento: '4m 10s',
      operadoresDisponiveis: 2
    },
    {
      nome: 'Retenção & Cancelamento',
      emEspera: 0,
      emAtendimento: 2,
      slaPercent: 96.0,
      tempoMedioEspera: '1m 00s',
      tempoMedioAtendimento: '9m 50s',
      operadoresDisponiveis: 1
    }
  ];

  const operadores: OperatorStatus[] = [
    {
      id: 'op-1',
      name: 'Lucas Mendes',
      role: 'ATENDENTE',
      status: 'EM_CHAMADA',
      fila: 'Comercial',
      atendimentosAtivos: 3,
      tempoNoEstado: '4m 12s',
      ramalSip: '1004'
    },
    {
      id: 'op-2',
      name: 'Beatriz Almeida',
      role: 'ATENDENTE',
      status: 'DISPONIVEL',
      fila: 'Suporte Técnico',
      atendimentosAtivos: 1,
      tempoNoEstado: '12m 30s',
      ramalSip: '1005'
    },
    {
      id: 'op-3',
      name: 'Marcos Vinicius',
      role: 'ATENDENTE',
      status: 'OCUPADO',
      fila: 'Comercial',
      atendimentosAtivos: 4,
      tempoNoEstado: '18m 05s',
      ramalSip: '1006'
    },
    {
      id: 'op-4',
      name: 'Juliana Costa',
      role: 'ATENDENTE',
      status: 'DISPONIVEL',
      fila: 'Financeiro',
      atendimentosAtivos: 1,
      tempoNoEstado: '8m 45s',
      ramalSip: '1007'
    },
    {
      id: 'op-5',
      name: 'Rodrigo Faro',
      role: 'ATENDENTE',
      status: 'PAUSA',
      fila: 'Suporte Técnico',
      atendimentosAtivos: 0,
      tempoNoEstado: '10m 00s',
      ramalSip: '1008'
    }
  ];

  const liveConversas = [
    {
      id: 'conv-101',
      cliente: 'Mariana Silva Costa',
      canal: 'WHATSAPP',
      fila: 'Comercial',
      operador: 'Lucas Mendes',
      tempoAtendimento: '4m 12s',
      statusSla: 'NORMAL',
      ultimaMsg: 'Gostaria de saber se o plano de 600 Mega tem Wi-Fi 6 incluso.'
    },
    {
      id: 'conv-102',
      cliente: 'Mercado Central do Bairro',
      canal: 'WEBCHAT',
      fila: 'Comercial',
      operador: 'MaIA (Autônomo)',
      tempoAtendimento: '1m 20s',
      statusSla: 'NORMAL',
      ultimaMsg: 'Qual é o prazo padrão de instalação de link dedicado?'
    },
    {
      id: 'conv-103',
      cliente: 'Edvaldo Fontes ME',
      canal: 'WHATSAPP',
      fila: 'Suporte Técnico',
      operador: 'Beatriz Almeida',
      tempoAtendimento: '14m 50s',
      statusSla: 'ALERTA',
      ultimaMsg: 'Ainda aguardando verificação de atenuação do sinal da fibra.'
    },
    {
      id: 'conv-104',
      cliente: 'Carlos Eduardo Nogueira',
      canal: 'WHATSAPP',
      fila: 'Financeiro',
      operador: 'Aguardando Fila',
      tempoAtendimento: '4m 10s',
      statusSla: 'CRITICO',
      ultimaMsg: 'Preciso da segunda via da fatura com vencimento hoje.'
    }
  ];

  const getStatusBadge = (status: OperatorStatus['status']) => {
    switch (status) {
      case 'DISPONIVEL':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Disponível</span>;
      case 'OCUPADO':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Ocupado</span>;
      case 'EM_CHAMADA':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>Em Chamada SIP</span>;
      case 'PAUSA':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Pausa</span>;
      case 'OFFLINE':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-500 border border-slate-800"><span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>Offline</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Supervisor Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
              PRD Seção 22 &amp; 23 • Console do Supervisor
            </span>
            <span className="text-xs text-slate-400">• Monitoramento em Tempo Real</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Supervisão de Filas, Operadores &amp; Cumprimento de SLA
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Acompanhe o estado de presença de cada atendente, conversas ativas por canal, tempo de espera e assuma conversas críticas com intervenção autorizada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800 font-bold flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            <span>SLA Global: 97.2%</span>
          </span>
        </div>
      </div>

      {/* Filas Overview Cards (PRD Seção 19 & 20) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filas.map(f => (
          <div
            key={f.nome}
            onClick={() => setSelectedFila(selectedFila === f.nome ? 'TODAS' : f.nome)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-lg ${
              selectedFila === f.nome
                ? 'bg-amber-950/20 border-amber-500 ring-1 ring-amber-500/40'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Fila {f.nome}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                SLA {f.slaPercent}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 my-3 text-center font-mono">
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-amber-400">Em Espera</div>
                <div className="text-base font-bold text-white">{f.emEspera}</div>
              </div>
              <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-cyan-400">Em Atend.</div>
                <div className="text-base font-bold text-white">{f.emAtendimento}</div>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>T.M. Espera:</span>
                <span className="text-slate-200 font-bold">{f.tempoMedioEspera}</span>
              </div>
              <div className="flex justify-between">
                <span>Operadores Livres:</span>
                <span className="text-emerald-400 font-bold">{f.operadoresDisponiveis} ativos</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Live Active Conversations & SLA Monitor */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Atendimentos em Curso (Visão do Supervisor)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {liveConversas.length} Conversas Ativas
            </span>
          </div>

          <div className="space-y-3">
            {liveConversas.map(conv => (
              <div
                key={conv.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{conv.cliente}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {conv.canal}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Fila: {conv.fila}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{conv.tempoAtendimento}</span>
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      conv.statusSla === 'NORMAL'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : conv.statusSla === 'ALERTA'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                        : 'bg-rose-950 text-rose-300 border border-rose-800 font-black'
                    }`}>
                      {conv.statusSla === 'NORMAL' ? 'SLA OK' : conv.statusSla === 'ALERTA' ? 'SLA Risco' : 'SLA Estourado'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-1 italic">
                  &quot;{conv.ultimaMsg}&quot;
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                  <span className="text-slate-400">
                    Operador: <strong className="text-slate-200">{conv.operador}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => notify(`Supervisor assumiu a conversa de ${conv.cliente}. Notificação enviada ao operador anterior.`, 'info')}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      Assumir Conversa
                    </button>
                    <button
                      onClick={() => notify(`Transferência da conversa de ${conv.cliente} para outra fila iniciada.`, 'info')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 cursor-pointer transition-colors"
                    >
                      Transferir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Operator Live Presence & Ramais (PRD Seção 21) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Presença dos Operadores</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {operadores.length} Cadastrados
            </span>
          </div>

          <div className="space-y-3">
            {operadores.map(op => (
              <div
                key={op.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{op.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Ramal {op.ramalSip} • Fila {op.fila}
                    </div>
                  </div>
                  {getStatusBadge(op.status)}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/50">
                  <span>Atendimentos: <strong className="text-white">{op.atendimentosAtivos}</strong></span>
                  <span>No estado: <strong className="text-slate-300">{op.tempoNoEstado}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
