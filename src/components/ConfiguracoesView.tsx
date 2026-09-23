import React, { useState } from 'react';
import { 
  Settings, 
  Server, 
  Clock, 
  ShieldCheck, 
  Bell, 
  Database, 
  Save, 
  CheckCircle2, 
  Lock, 
  Key, 
  RefreshCw,
  Building2,
  Calendar
} from 'lucide-react';
import { InstanceConfig } from '../types';

interface ConfiguracoesViewProps {
  instance: InstanceConfig;
  onSave?: () => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({ instance }) => {
  const [activeTab, setActiveTab] = useState<'EMPRESA' | 'SLA' | 'HORARIOS' | 'SEGURANCA'>('EMPRESA');
  const [empresaNome, setEmpresaNome] = useState(instance.nomeFantasia || instance.razaoSocial);
  const [dominio, setDominio] = useState('enlace-fibra.enlacecrm.com.br');
  const [timezone, setTimezone] = useState('America/Sao_Paulo (UTC-3)');
  const [slaPrimeiraRespostaMin, setSlaPrimeiraRespostaMin] = useState(3);
  const [slaAtendimentoMin, setSlaAtendimentoMin] = useState(15);
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFim, setHorarioFim] = useState('19:00');
  const [foraHorarioMsg, setForaHorarioMsg] = useState('Nosso atendimento humano encerrou às 19:00, mas a MaIA continua disponível 24h para tirar dúvidas, emitir 2ª via e consultar viabilidade!');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
              PRD Seções 2, 21, 22 &amp; 33 • Configurações do Sistema
            </span>
            <span className="text-xs text-slate-400">• Instância Dedicada</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Parâmetros da Instância &amp; Regras de Negócio
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Ajuste a identidade da empresa, limites rigorosos de SLA, horários de funcionamento do atendimento humano e políticas de segurança da instância.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800 font-bold flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configurações salvas!</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('EMPRESA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'EMPRESA'
              ? 'bg-blue-950 text-blue-300 border border-blue-800 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Empresa &amp; Domínio</span>
        </button>
        <button
          onClick={() => setActiveTab('SLA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'SLA'
              ? 'bg-amber-950 text-amber-300 border border-amber-800 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Metas de SLA &amp; Alertas</span>
        </button>
        <button
          onClick={() => setActiveTab('HORARIOS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'HORARIOS'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Horário de Funcionamento</span>
        </button>
        <button
          onClick={() => setActiveTab('SEGURANCA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'SEGURANCA'
              ? 'bg-purple-950 text-purple-300 border border-purple-800 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Segurança &amp; Criptografia</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === 'EMPRESA' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-w-3xl">
            <h3 className="text-sm font-bold text-white">Dados da Organização</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Razão Social / Nome Fantasia</label>
                <input
                  type="text"
                  value={empresaNome}
                  onChange={(e) => setEmpresaNome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Domínio Dedicado da Instância</label>
                <input
                  type="text"
                  value={dominio}
                  onChange={(e) => setDominio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Fuso Horário Oficial</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">ID da Instância (Imutável)</label>
                <input
                  type="text"
                  readOnly
                  value={instance.instanceId}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-500 font-mono text-xs focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SLA' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-w-3xl">
            <h3 className="text-sm font-bold text-white">Configuração de Limiares de SLA</h3>
            <p className="text-xs text-slate-400">
              Quando estes limites são ultrapassados, as conversas são sinalizadas com destaque visual e notificam o console do supervisor.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-white">SLA de 1ª Resposta (Minutos)</label>
                <input
                  type="number"
                  value={slaPrimeiraRespostaMin}
                  onChange={(e) => setSlaPrimeiraRespostaMin(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
                <p className="text-[10px] text-slate-400">Tempo máximo desde a triagem até o operador enviar a primeira mensagem.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-white">SLA Máximo de Atendimento (Minutos)</label>
                <input
                  type="number"
                  value={slaAtendimentoMin}
                  onChange={(e) => setSlaAtendimentoMin(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
                <p className="text-[10px] text-slate-400">Tempo de permanência máxima de um atendimento em aberto.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'HORARIOS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-w-3xl">
            <h3 className="text-sm font-bold text-white">Horário Comercial dos Operadores</h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Início da Operação Humana</label>
                <input
                  type="time"
                  value={horarioInicio}
                  onChange={(e) => setHorarioInicio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Encerramento da Operação Humana</label>
                <input
                  type="time"
                  value={horarioFim}
                  onChange={(e) => setHorarioFim(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-[11px] font-mono text-slate-400">Mensagem de Fora de Horário (Atendimento MaIA Ativo)</label>
              <textarea
                rows={3}
                value={foraHorarioMsg}
                onChange={(e) => setForaHorarioMsg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {activeTab === 'SEGURANCA' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-w-3xl">
            <h3 className="text-sm font-bold text-white">Segurança, Criptografia &amp; Isolamento</h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">Criptografia em Repouso</div>
                  <div className="text-[11px] text-slate-400">AES-256 com chave mestra exclusiva por instância</div>
                </div>
                <span className="text-emerald-400 text-xs font-bold">ATIVO</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">PostgreSQL Conexão TLS 1.3</div>
                  <div className="text-[11px] text-slate-400">Banco de dados relacional dedicado e isolado</div>
                </div>
                <span className="text-emerald-400 text-xs font-bold">CONECTADO</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">Auditoria Imutável Append-Only</div>
                  <div className="text-[11px] text-slate-400">Hash SHA-256 e gravação de todos os eventos de usuário</div>
                </div>
                <span className="text-emerald-400 text-xs font-bold">HABILITADO</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Parâmetros</span>
          </button>
        </div>
      </form>
    </div>
  );
};
