import React, { useState } from 'react';
import { 
  Workflow, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Save, 
  History, 
  ArrowRight, 
  Plus, 
  Settings, 
  HelpCircle,
  Users,
  DollarSign,
  Headphones,
  FileCheck,
  Split,
  MessageSquare
} from 'lucide-react';
import { notify } from '../utils/notify';

export const FlowBuilderView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'VISUAL' | 'SIMULACAO' | 'VERSOES'>('VISUAL');
  const [flowStatus, setFlowStatus] = useState<'PUBLICADO' | 'RASCUNHO'>('PUBLICADO');
  const [simulatedMessage, setSimulatedMessage] = useState<string>('');
  const [simulationLog, setSimulationLog] = useState<string[]>([
    'Iniciando simulação do fluxo "Triagem Automática Omnichannel v2.4"...',
    'Cliente conectado via WhatsApp.',
    'Bloco [Início] disparado.',
    'Bloco [Identificar Cliente]: CPF localizado na base SGP/PostgreSQL.',
    'Bloco [MaIA]: Perguntou "Olá! Como posso te ajudar hoje?"'
  ]);

  const flowNodes = [
    {
      id: 'node-1',
      title: 'Início da Conversa',
      type: 'trigger',
      desc: 'Disparado ao receber mensagem por WhatsApp, WebChat ou E-mail.',
      color: 'border-emerald-700 bg-emerald-950/40 text-emerald-300'
    },
    {
      id: 'node-2',
      title: 'Identificar Cliente',
      type: 'crm_lookup',
      desc: 'Consulta CPF/Telefone no banco isolado PostgreSQL e histórico.',
      color: 'border-cyan-700 bg-cyan-950/40 text-cyan-300'
    },
    {
      id: 'node-3',
      title: 'Triagem com MaIA (Nível 2)',
      type: 'maia_agent',
      desc: 'Compreensão de intenção em linguagem natural e consulta de ferramentas.',
      color: 'border-purple-700 bg-purple-950/40 text-purple-300'
    },
    {
      id: 'node-4',
      title: 'Divisão de Fluxo por Assunto',
      type: 'condition',
      branches: [
        { label: '2ª Via Boleto / Pix', target: 'Fila Financeiro & Tool Cobrança' },
        { label: 'Suporte / Sem Conexão', target: 'Fila Suporte Técnico' },
        { label: 'Novo Plano / Adesão', target: 'Kanban Vendas & SDR' },
        { label: 'Falar com Atendente', target: 'Fila Geral Handoff' }
      ],
      color: 'border-amber-700 bg-amber-950/40 text-amber-300'
    }
  ];

  const handleRunSimulation = () => {
    if (!simulatedMessage.trim()) return;
    setSimulationLog(prev => [
      ...prev,
      `> Cliente enviou: "${simulatedMessage}"`,
      `MaIA processou intenção. Roteando para branch correspondente...`
    ]);
    setSimulatedMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              PRD Seção 14 • Flux Builder Nativo
            </span>
            <span className="text-xs text-slate-400">• v2.4 (Ativo na Instância)</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Construtor Visual de Fluxos de Atendimento
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure árvores de decisão, triagem inteligente com MaIA e roteamento para filas sem programar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('VISUAL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'VISUAL' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Editor Visual
            </button>
            <button
              onClick={() => setActiveTab('SIMULACAO')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'SIMULACAO' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulador</span>
            </button>
          </div>

          <button
            onClick={() => {
              setFlowStatus('PUBLICADO');
              notify('Fluxo validado e publicado em produção com sucesso!', 'success');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Publicar Fluxo</span>
          </button>
        </div>
      </div>

      {activeTab === 'VISUAL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3 font-mono">
            <span>Fluxo Ativo: &quot;Triagem &amp; Roteamento Omnichannel&quot;</span>
            <span className="text-emerald-400 font-bold">● Status: Publicado &amp; Versionado</span>
          </div>

          {/* Visual Node Chain */}
          <div className="max-w-3xl mx-auto space-y-4">
            {flowNodes.map((node, index) => (
              <React.Fragment key={node.id}>
                <div className={`p-4 rounded-xl border ${node.color} shadow-lg transition-all relative`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono tracking-wider uppercase">
                      Passo 0{index + 1} • {node.title}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                      ID: {node.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mb-2">{node.desc}</p>

                  {node.branches && (
                    <div className="mt-3 pt-3 border-t border-amber-800/40 grid grid-cols-2 gap-2 text-xs">
                      {node.branches.map((b, bi) => (
                        <div key={bi} className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 font-mono text-[11px]">
                          <span className="text-amber-400 font-semibold block">{b.label}</span>
                          <span className="text-slate-400 text-[10px]">→ {b.target}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {index < flowNodes.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div className="w-0.5 h-6 bg-slate-700"></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'SIMULACAO' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Ambiente Sandbox de Simulação de Fluxo</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Testar sem enviar mensagens reais</span>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs space-y-2 h-64 overflow-y-auto">
            {simulationLog.map((log, i) => (
              <div key={i} className="text-slate-300 leading-relaxed">
                {log}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Digite uma mensagem como se fosse o cliente (ex: 'Quero pagar meu boleto')..."
              value={simulatedMessage}
              onChange={(e) => setSimulatedMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunSimulation()}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleRunSimulation}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
            >
              Simular Envio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
