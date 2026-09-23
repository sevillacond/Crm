import React, { useState } from 'react';
import { 
  Send, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Filter, 
  MessageSquare, 
  Plus, 
  BarChart2, 
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';
import { notify } from '../utils/notify';

interface Campanha {
  id: string;
  nome: string;
  canal: 'WHATSAPP_HSM' | 'EMAIL';
  templateNome: string;
  publicoAlvo: string;
  totalDestinatarios: number;
  enviados: number;
  entregues: number;
  lidos: number;
  status: 'AGENDADA' | 'EM_DISPARO' | 'CONCLUIDA' | 'RASCUNHO';
  agendadoPara: string;
  taxaEntrega: number;
}

export const CampanhasView: React.FC = () => {
  const [campanhas, setCampanhas] = useState<Campanha[]>([
    {
      id: 'cmp-01',
      nome: 'Aviso de Manutenção Preventiva OLT Centro',
      canal: 'WHATSAPP_HSM',
      templateNome: 'manutencao_preventiva_v1',
      publicoAlvo: 'Assinantes Bairro Centro & Rosas (CTO 01 a 08)',
      totalDestinatarios: 280,
      enviados: 280,
      entregues: 276,
      lidos: 242,
      status: 'CONCLUIDA',
      agendadoPara: '21/09/2026 23:00',
      taxaEntrega: 98.5
    },
    {
      id: 'cmp-02',
      nome: 'Campanha Upgrade Wi-Fi 6 para Clientes 300 Mega',
      canal: 'WHATSAPP_HSM',
      templateNome: 'oferta_upgrade_wifi6_res',
      publicoAlvo: 'Clientes residenciais há +12 meses em planos antigos',
      totalDestinatarios: 150,
      enviados: 85,
      entregues: 82,
      lidos: 61,
      status: 'EM_DISPARO',
      agendadoPara: '22/09/2026 14:00',
      taxaEntrega: 96.4
    },
    {
      id: 'cmp-03',
      nome: 'Lembrete Amigável de Vencimento Fatura Pix',
      canal: 'WHATSAPP_HSM',
      templateNome: 'lembrete_fatura_pix_v2',
      publicoAlvo: 'Faturas com vencimento D-2 dias',
      totalDestinatarios: 74,
      enviados: 0,
      entregues: 0,
      lidos: 0,
      status: 'AGENDADA',
      agendadoPara: '23/09/2026 09:00',
      taxaEntrega: 0
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              PRD Seção 25 • Campanhas &amp; Mensageria Ativa
            </span>
            <span className="text-xs text-slate-400">• Conformidade com Políticas Meta Cloud</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Campanhas Segmentadas &amp; Avisos em Massa
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Disparos controlados de avisos operacionais, faturas e campanhas de vendas com templates oficiais HSM pré-aprovados, respeito estrito a opt-out e métricas em tempo real.
          </p>
        </div>

        <button
          onClick={() => notify('Assistente de criação de nova campanha HSM aberto.', 'info')}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Campanha</span>
        </button>
      </div>

      {/* Security & Compliance Warning (PRD Seção 25 & 4) */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-bold">Proteção Anti-Spam &amp; Gestão de Consentimento Ativo</div>
            <div className="text-slate-400 text-[11px]">
              O Enlace-CRM não possui mecanismos para contornar limites das plataformas oficiais. Todos os disparos registram opt-out automático quando o assinante solicita.
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
          Reputação Tier 1
        </span>
      </div>

      {/* Campaigns List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {campanhas.map(cmp => (
          <div
            key={cmp.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                  {cmp.canal === 'WHATSAPP_HSM' ? 'WhatsApp HSM' : 'E-mail'}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                  cmp.status === 'CONCLUIDA'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : cmp.status === 'EM_DISPARO'
                    ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {cmp.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">{cmp.nome}</h3>
              <p className="text-xs text-slate-400 font-mono">Template: {cmp.templateNome}</p>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
                <strong>Público:</strong> {cmp.publicoAlvo}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Destinatários:</span>
                <span className="text-white font-bold">{cmp.totalDestinatarios}</span>
              </div>

              {cmp.status !== 'AGENDADA' && (
                <>
                  <div className="flex justify-between text-slate-400">
                    <span>Entregues:</span>
                    <span className="text-emerald-400">{cmp.entregues} ({cmp.taxaEntrega}%)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Lidos pelo Cliente:</span>
                    <span className="text-cyan-400">{cmp.lidos}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-slate-500 text-[10px] pt-1">
                <span>Data:</span>
                <span>{cmp.agendadoPara}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
