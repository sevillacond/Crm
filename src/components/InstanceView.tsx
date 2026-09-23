import React from 'react';
import { 
  Building2, 
  Database, 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  Radio, 
  Sparkles, 
  Cpu, 
  Lock,
  Workflow,
  BookOpen
} from 'lucide-react';
import { InstanceConfig } from '../types';

interface InstanceViewProps {
  instance: InstanceConfig;
}

export const InstanceView: React.FC<InstanceViewProps> = ({ instance }) => {
  const prdPhases = [
    {
      phase: 'FASE 1',
      title: 'Arquitetura, Banco, Autenticação e RBAC',
      docs: '01-VISAO • 02-INSTANCIA-ISOLADA • 03-IDENTIDADE-RBAC',
      status: 'IMPLEMENTADO',
      details: 'Instância isolada por empresa/provedor (PostgreSQL + Redis), RBAC com 5 papéis e isolamento total de dados.'
    },
    {
      phase: 'FASE 2',
      title: 'CRM Core, Clientes, Leads & Kanban',
      docs: '07-CRM-CORE • 08-KANBAN • 29-HISTORICO-UNIFICADO',
      status: 'IMPLEMENTADO',
      details: 'Gestão PF/PJ, leads, oportunidades, pipeline visual Kanban de 7 etapas com MRR e drag-and-drop.'
    },
    {
      phase: 'FASE 3',
      title: 'Conversation Core, Inbox Omnichannel, WhatsApp & WebChat',
      docs: '09-INBOX-OMNICHANNEL • 10-WEBCHAT • 11-WHATSAPP',
      status: 'IMPLEMENTADO',
      details: 'Inbox único 3 colunas (WhatsApp Meta/WAHA, WebChat nativo e E-mail), notas internas, handoff humano e copilot MaIA.'
    },
    {
      phase: 'FASE 4',
      title: 'Filas, Operadores, SLA, Supervisor & WebPhone',
      docs: '12-WEBPHONE • 19-FILAS • 21-PRESENCA • 22-SUPERVISOR • 23-SLA',
      status: 'IMPLEMENTADO',
      details: 'WebRTC SIP Webphone via PBX Asterisk externo com DTMF, filas de atendimento, monitoria do supervisor ao vivo e SLAs.'
    },
    {
      phase: 'FASE 5',
      title: 'Flow Builder, Automações, MaIA & Tools/MCP',
      docs: '14-FLUX-BUILDER • 15-MAIA • 18-TOOLS-MCP • 24-CONHECIMENTO',
      status: 'IMPLEMENTADO',
      details: 'Construtor visual de fluxos de atendimento com simulação em tempo real, MaIA com autonomia de IA, Gateway MCP e RAG.'
    },
    {
      phase: 'FASE 6',
      title: 'Integrações, Cobrança, Campanhas & Ordens de Campo',
      docs: '25-CAMPANHAS • 26-INTEGRACOES • 28-COBRANCA • 30-DASHBOARD',
      status: 'IMPLEMENTADO',
      details: 'Adapters SGP/ERP (IXC/HubSoft), camada de cobrança (Pix/Boleto), O.S. FTTH de campo com checklist e dashboard 360°.'
    },
    {
      phase: 'FASE 7',
      title: 'Auditoria, LGPD, Observabilidade, Backup & Hardening',
      docs: '31-AUDITORIA • 32-LGPD • 33-SEGURANCA • 39-OBSERVABILIDADE • 40-BACKUP',
      status: 'IMPLEMENTADO',
      details: 'Trilha de auditoria imutável, conformidade LGPD, controle estrito de privilégios e logs de ferramentas.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Card: Provedor & Instance Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-950 ring-1 ring-white/10">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">{instance.nomeFantasia}</h2>
                <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Instância Dedicada Ativa
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {instance.razaoSocial} • Sede: {instance.cidadeSede}/{instance.uf}
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-right font-mono text-xs">
            <div className="text-slate-400 text-[11px]">ID da Instância</div>
            <div className="text-cyan-300 font-bold">{instance.instanceId}</div>
            <div className="text-slate-400 text-[11px] mt-1">CNPJ do Provedor</div>
            <div className="text-white font-semibold">{instance.cnpj}</div>
          </div>
        </div>

        {/* Technical Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Banco de Dados</span>
            </div>
            <div className="text-sm font-bold text-white">{instance.databaseEngine}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Isolamento Físico / Schema Próprio</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Radio className="w-4 h-4 text-amber-400" />
              <span>Malha de CTOs Ópticas</span>
            </div>
            <div className="text-sm font-bold text-white">{instance.totalCtos} CTOs Cadastradas</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{instance.totalPortasDisponiveis} portas livres</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Server className="w-4 h-4 text-purple-400" />
              <span>SGP Integrado</span>
            </div>
            <div className="text-sm font-bold text-white">{instance.sgpIntegrado}</div>
            <div className="text-[10px] text-cyan-400 mt-0.5">Sincronização de Assinantes &amp; OS</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Motor de Inteligência</span>
            </div>
            <div className="text-sm font-bold text-white">{instance.versaoMaia}</div>
            <div className="text-[10px] text-purple-400 mt-0.5">MCP Tool Gateway Auditado</div>
          </div>
        </div>
      </div>

      {/* PRD Roadmap & Modular Progress Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              PRD Modular — Acompanhamento de Implementação
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Concluído (7/7 Fases)
            </span>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800">
              docs/prd/00-INDEX.md
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Progresso Global de Engenharia Telecom</span>
            <span className="font-mono font-bold text-emerald-400">40/40 Módulos Operacionais</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-500 h-full rounded-full w-full"></div>
          </div>
        </div>

        <div className="space-y-3">
          {prdPhases.map((phase, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                phase.status === 'IMPLEMENTADO'
                  ? 'bg-slate-950/90 border-emerald-800/60'
                  : phase.status === 'EM_ANDAMENTO'
                  ? 'bg-slate-950/90 border-indigo-800/60'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-70'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">{phase.phase}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-bold text-white">{phase.title}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">{phase.docs}</div>
                <p className="text-xs text-slate-300 mt-1">{phase.details}</p>
              </div>

              <div>
                {phase.status === 'IMPLEMENTADO' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    IMPLEMENTADO &amp; VALIDADO
                  </span>
                ) : phase.status === 'EM_ANDAMENTO' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    EM ANDAMENTO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    {phase.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
