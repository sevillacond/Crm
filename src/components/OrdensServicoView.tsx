import React, { useState } from 'react';
import { 
  Wrench, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Radio, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Search, 
  Filter, 
  Plus, 
  UserCheck, 
  Activity, 
  FileCheck, 
  ShieldCheck, 
  Zap, 
  Layers,
  ArrowUpRight,
  Sparkles,
  X,
  FileText
} from 'lucide-react';
import { OrdemServico, OSStatus, OSTipo, Contato, User as UserType } from '../types';
import { notify } from '../utils/notify';

interface OrdensServicoViewProps {
  ordens: OrdemServico[];
  onUpdateOrdem?: (updated: OrdemServico) => void;
  onAddOrdem?: (novaOS: OrdemServico) => void;
  contatos?: Contato[];
  currentUser: UserType;
  onOpenWebPhone?: (phone: string, name: string) => void;
}

export const OrdensServicoView: React.FC<OrdensServicoViewProps> = ({
  ordens: initialOrdens,
  onUpdateOrdem,
  onAddOrdem,
  contatos = [],
  currentUser,
  onOpenWebPhone
}) => {
  const [ordens, setOrdens] = useState<OrdemServico[]>(initialOrdens);
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [search, setSearch] = useState<string>('');
  const [selectedOS, setSelectedOS] = useState<OrdemServico>(initialOrdens[0]);
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [isNovaOSModalOpen, setIsNovaOSModalOpen] = useState<boolean>(false);

  // Form state for new OS
  const [novoClienteNome, setNovoClienteNome] = useState<string>('');
  const [novoTelefone, setNovoTelefone] = useState<string>('');
  const [novoEndereco, setNovoEndereco] = useState<string>('');
  const [novoBairro, setNovoBairro] = useState<string>('Cambuí');
  const [novoTipo, setNovoTipo] = useState<OSTipo>('INSTALACAO');
  const [novoPlanoNome, setNovoPlanoNome] = useState<string>('Fibra Ultra 600 Mega + Wi-Fi 6');
  const [novoTecnicoNome, setNovoTecnicoNome] = useState<string>('Marcos Ferraz');
  const [novaCto, setNovaCto] = useState<string>('CTO-CAM-014');
  const [novaPorta, setNovaPorta] = useState<number>(3);
  const [novoPeriodo, setNovoPeriodo] = useState<'MANHA' | 'TARDE' | 'INTEGRAL'>('MANHA');
  const [novaObservacao, setNovaObservacao] = useState<string>('');

  const filteredOrdens = ordens.filter(os => {
    const matchStatus = filterStatus === 'TODOS' || os.status === filterStatus;
    const matchSearch = 
      os.clienteNome.toLowerCase().includes(search.toLowerCase()) ||
      os.id.toLowerCase().includes(search.toLowerCase()) ||
      os.bairro.toLowerCase().includes(search.toLowerCase()) ||
      os.ctoDesignada.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleToggleChecklist = (field: keyof OrdemServico['checklist']) => {
    if (!selectedOS) return;
    const updated: OrdemServico = {
      ...selectedOS,
      checklist: {
        ...selectedOS.checklist,
        [field]: !selectedOS.checklist[field]
      }
    };
    setSelectedOS(updated);
    setOrdens(prev => prev.map(o => o.id === updated.id ? updated : o));
    if (onUpdateOrdem) onUpdateOrdem(updated);
    notify(`Checklist de campo atualizado: ${field}`, 'info');
  };

  const handleCreateNovaOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoClienteNome || !novoTelefone) {
      notify('Preencha o nome do cliente e telefone.', 'error');
      return;
    }

    const novaOS: OrdemServico = {
      id: `OS-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      contatoId: `ct_${Date.now()}`,
      clienteNome: novoClienteNome,
      telefone: novoTelefone,
      endereco: novoEndereco || 'Rua das Palmeiras, 340',
      bairro: novoBairro || 'Cambuí',
      tipo: novoTipo,
      status: 'AGENDADA',
      planoNome: novoPlanoNome,
      tecnicoId: 'usr_tecnico',
      tecnicoNome: novoTecnicoNome,
      dataAgendada: 'Hoje (23/09)',
      periodo: novoPeriodo,
      ctoDesignada: novaCto,
      portaCto: Number(novaPorta) || 1,
      sinalOpticoDbm: -20.4,
      metragemDropMetros: 35,
      ontSerialGpon: `HWTC${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      roteadorWifi6Serial: `WIFI6-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      checklist: {
        passagemDrop: false,
        conectorizacaoFusao: false,
        testePotenciaOptica: false,
        provisionamentoOLT: false,
        speedtestValido: false,
        assinaturaCliente: false
      },
      observacoes: novaObservacao || 'Instalação padrão com roteador Wi-Fi 6.'
    };

    setOrdens(prev => [novaOS, ...prev]);
    setSelectedOS(novaOS);
    if (onAddOrdem) onAddOrdem(novaOS);
    setIsNovaOSModalOpen(false);
    // Reset
    setNovoClienteNome('');
    setNovoTelefone('');
    setNovoEndereco('');
    setNovaObservacao('');
    notify(`Ordem de Serviço ${novaOS.id} agendada com sucesso para ${novaOS.clienteNome}!`, 'success');
  };

  const handleProvisionOLT = () => {
    setIsProvisioning(true);
    notify('Enviando comando de provisionamento GPON para OLT via adapter SGP/ERP...', 'info');

    setTimeout(() => {
      setIsProvisioning(false);
      const updated: OrdemServico = {
        ...selectedOS,
        checklist: {
          ...selectedOS.checklist,
          provisionamentoOLT: true,
          testePotenciaOptica: true
        }
      };
      setSelectedOS(updated);
      setOrdens(prev => prev.map(o => o.id === updated.id ? updated : o));
      if (onUpdateOrdem) onUpdateOrdem(updated);
      notify(`ONT GPON ${selectedOS.ontSerialGpon} provisionada com sucesso na OLT! Potência óptica aferida: ${selectedOS.sinalOpticoDbm} dBm (Excelente).`, 'success');
    }, 1200);
  };

  const handleFinalizeOS = () => {
    const updated: OrdemServico = {
      ...selectedOS,
      status: 'CONCLUIDA',
      checklist: {
        ...selectedOS.checklist,
        assinaturaCliente: true,
        speedtestValido: true
      }
    };
    setSelectedOS(updated);
    setOrdens(prev => prev.map(o => o.id === updated.id ? updated : o));
    if (onUpdateOrdem) onUpdateOrdem(updated);
    notify(`Ordem de Serviço ${selectedOS.id} finalizada com sucesso! Cliente ativado na base e deal sincronizado.`, 'success');
  };

  const getStatusBadge = (status: OSStatus) => {
    switch (status) {
      case 'EM_EXECUCAO':
        return <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded">Em Execução</span>;
      case 'AGENDADA':
        return <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded">Agendada</span>;
      case 'A_CAMINHO':
        return <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded">A Caminho</span>;
      case 'CONCLUIDA':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded">Concluída</span>;
      case 'CANCELADA':
        return <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded">Cancelada</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              PRD Seção 23 • Operações de Campo &amp; Ativação
            </span>
            <span className="text-xs text-slate-400">• Integração SGP &amp; OLT</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Ordens de Serviço &amp; Instalações FTTH
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Acompanhe o agendamento de técnicos de campo, parâmetros de sinal óptico (dBm), caixas CTO, provisionamento de ONT na OLT e checklist de ativação de clientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNovaOSModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova O.S. de Instalação</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total de O.S. Hoje</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">14</div>
          <div className="text-[10px] text-cyan-400 mt-1">100% com viabilidade técnica validada</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Em Execução no Campo</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
            {ordens.filter(o => o.status === 'EM_EXECUCAO').length}
          </div>
          <div className="text-[10px] text-amber-300/80 mt-1">Técnico em rota ou conectando drop</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Instalações Concluídas</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {ordens.filter(o => o.status === 'CONCLUIDA').length}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Provisionadas na OLT com speedtest</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Sinal Óptico Médio</div>
          <div className="text-2xl font-bold text-cyan-300 mt-1 font-mono">-20.8 dBm</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-mono">Dentro da faixa ideal (-15 a -27 dBm)</div>
        </div>
      </div>

      {/* Main Content Layout: List on Left, Selected OS Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter & OS Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Search and Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar O.S., cliente, CTO ou bairro..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="AGENDADA">Agendadas</option>
                <option value="EM_EXECUCAO">Em Execução</option>
                <option value="CONCLUIDA">Concluídas</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredOrdens.map(os => {
                const isSelected = selectedOS?.id === os.id;
                return (
                  <div
                    key={os.id}
                    onClick={() => setSelectedOS(os)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-white">{os.id}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {os.tipo}
                        </span>
                      </div>
                      {getStatusBadge(os.status)}
                    </div>

                    <h4 className="text-xs font-bold text-white truncate">{os.clienteNome}</h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{os.endereco} - {os.bairro}</p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 pt-2 border-t border-slate-800/60">
                      <span className="text-cyan-400">{os.ctoDesignada} (P.{os.portaCto})</span>
                      <span>Téc: {os.tecnicoNome.split(' ')[0]}</span>
                      <span className="text-slate-300">{os.dataAgendada}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Complete OS Detail and Activation Panel */}
        <div className="lg:col-span-7 space-y-4">
          {selectedOS ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono font-bold text-cyan-400">{selectedOS.id}</span>
                    <span className="text-xs text-slate-400">• {selectedOS.tipo}</span>
                    {getStatusBadge(selectedOS.status)}
                  </div>
                  <h3 className="text-lg font-bold text-white">{selectedOS.clienteNome}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{selectedOS.endereco} - {selectedOS.bairro}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenWebPhone && selectedOS.telefone && (
                    <button
                      onClick={() => onOpenWebPhone(selectedOS.telefone, selectedOS.clienteNome)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Ligar para o cliente via WebPhone"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selectedOS.telefone}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid with Technical Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Plano e Técnico */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Plano Contratado</div>
                  <div className="font-bold text-white">{selectedOS.planoNome}</div>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    Técnico Responsável:
                    <div className="text-slate-200 font-semibold mt-0.5">{selectedOS.tecnicoNome}</div>
                  </div>
                </div>

                {/* Caixa CTO e Porta */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Rede FTTH / CTO</div>
                  <div className="font-bold text-cyan-400 font-mono">{selectedOS.ctoDesignada}</div>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                    <span>Porta: <strong className="text-white font-mono">#{selectedOS.portaCto}</strong></span>
                    <span>Drop: <strong className="text-white font-mono">{selectedOS.metragemDropMetros}m</strong></span>
                  </div>
                </div>

                {/* Potência Óptica */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Potência Óptica (Power Meter)</div>
                  <div className="font-bold text-emerald-400 font-mono text-sm">
                    {selectedOS.sinalOpticoDbm} dBm
                  </div>
                  <div className="text-[10px] text-emerald-400/80 pt-1 border-t border-slate-800">
                    Qualidade: Excelente (SLA Normal)
                  </div>
                </div>
              </div>

              {/* Hardware / Provisioning Data */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Equipamentos Provisionados em Campo</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Adapter SGP • IXC / OLT</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Serial GPON da ONT (MAC/SN):</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedOS.ontSerialGpon || 'HWTC-NÃO-DEFINIDO'}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-emerald-400 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Roteador Wi-Fi 6 (Patrimônio/SN):</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedOS.roteadorWifi6Serial || 'WIFI6-EQUIP-001'}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-cyan-400 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={handleProvisionOLT}
                    disabled={isProvisioning || selectedOS.checklist.provisionamentoOLT}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      selectedOS.checklist.provisionamentoOLT
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-950'
                    }`}
                  >
                    <Activity className={`w-3.5 h-3.5 ${isProvisioning ? 'animate-spin' : ''}`} />
                    <span>{selectedOS.checklist.provisionamentoOLT ? 'Provisionado na OLT (OK)' : 'Provisionar na OLT via SGP'}</span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-mono">
                    OLT GPON Port 0/1/3 • Slot 2
                  </span>
                </div>
              </div>

              {/* Technical Activation Checklist */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Checklist Técnico de Ativação (Qualidade e Conformidade)</span>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {Object.values(selectedOS.checklist).filter(Boolean).length} / 6 Concluídos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedOS.checklist.passagemDrop}
                      onChange={() => handleToggleChecklist('passagemDrop')}
                      className="rounded border-slate-700 text-cyan-600 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                    />
                    <span className={selectedOS.checklist.passagemDrop ? 'text-white' : 'text-slate-400'}>
                      Passagem e Ancoragem do Cabo Drop
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedOS.checklist.conectorizacaoFusao}
                      onChange={() => handleToggleChecklist('conectorizacaoFusao')}
                      className="rounded border-slate-700 text-cyan-600 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                    />
                    <span className={selectedOS.checklist.conectorizacaoFusao ? 'text-white' : 'text-slate-400'}>
                      Fusão Óptica ou Conector de Campo
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedOS.checklist.testePotenciaOptica}
                      onChange={() => handleToggleChecklist('testePotenciaOptica')}
                      className="rounded border-slate-700 text-cyan-600 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                    />
                    <span className={selectedOS.checklist.testePotenciaOptica ? 'text-white' : 'text-slate-400'}>
                      Aferição Power Meter (-15 a -27 dBm)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedOS.checklist.provisionamentoOLT}
                      onChange={() => handleToggleChecklist('provisionamentoOLT')}
                      className="rounded border-slate-700 text-cyan-600 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                    />
                    <span className={selectedOS.checklist.provisionamentoOLT ? 'text-white' : 'text-slate-400'}>
                      Autenticação PPPoE / ONU Provisionada
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedOS.checklist.speedtestValido}
                      onChange={() => handleToggleChecklist('speedtestValido')}
                      className="rounded border-slate-700 text-cyan-600 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                    />
                    <span className={selectedOS.checklist.speedtestValido ? 'text-white' : 'text-slate-400'}>
                      Speedtest de Validação da Banda Total
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedOS.checklist.assinaturaCliente}
                      onChange={() => handleToggleChecklist('assinaturaCliente')}
                      className="rounded border-slate-700 text-cyan-600 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                    />
                    <span className={selectedOS.checklist.assinaturaCliente ? 'text-white' : 'text-slate-400'}>
                      Assinatura Digital de Aceite do Cliente
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Status: {getStatusBadge(selectedOS.status)}
                </div>

                <div className="flex items-center gap-2">
                  {selectedOS.status !== 'CONCLUIDA' && (
                    <button
                      onClick={handleFinalizeOS}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Concluir O.S. &amp; Ativar Cliente</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              Selecione uma Ordem de Serviço na lista ao lado para ver detalhes técnicos.
            </div>
          )}
        </div>
      </div>
      {/* Modal: Nova Ordem de Serviço */}
      {isNovaOSModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800/80 text-cyan-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Criar e Agendar Nova O.S. de Campo</h3>
                  <p className="text-[11px] text-slate-400">
                    Gera ordem de serviço FTTH com designação de CTO, porta e técnico responsável
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsNovaOSModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateNovaOS} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Seleção ou preenchimento de cliente */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Cliente / Razão Social *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={novoClienteNome}
                      onChange={(e) => setNovoClienteNome(e.target.value)}
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    {contatos.length > 0 && (
                      <select
                        onChange={(e) => {
                          const c = contatos.find(item => item.id === e.target.value);
                          if (c) {
                            setNovoClienteNome(c.nome);
                            setNovoTelefone(c.telefone);
                            setNovoEndereco(`${c.logradouro}, ${c.numero}`);
                            setNovoBairro(c.bairro);
                          }
                        }}
                        className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded-lg px-2 py-1 focus:border-cyan-500 max-w-[140px]"
                      >
                        <option value="">Buscar Lead...</option>
                        {contatos.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={novoTelefone}
                    onChange={(e) => setNovoTelefone(e.target.value)}
                    placeholder="(19) 98877-6655"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Tipo de O.S. *</label>
                  <select
                    value={novoTipo}
                    onChange={(e) => setNovoTipo(e.target.value as OSTipo)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="INSTALACAO">Instalação Nova FTTH</option>
                    <option value="UPGRADE_PLANO">Upgrade de Plano / Wi-Fi 6</option>
                    <option value="REPARO_FIBRA">Reparo de Fibra / Rompimento</option>
                    <option value="MUDANCA_ENDERECO">Mudança de Endereço</option>
                    <option value="RETIRADA">Retirada de Equipamentos</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    value={novoEndereco}
                    onChange={(e) => setNovoEndereco(e.target.value)}
                    placeholder="Rua das Palmeiras, 340, Apto 42"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={novoBairro}
                    onChange={(e) => setNovoBairro(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Plano FTTH</label>
                  <select
                    value={novoPlanoNome}
                    onChange={(e) => setNovoPlanoNome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="Fibra Ultra 600 Mega + Wi-Fi 6">Fibra Ultra 600 Mega (R$ 119,90)</option>
                    <option value="Fibra Gamer 1 Giga Wi-Fi 6E">Fibra Gamer 1 Giga (R$ 179,90)</option>
                    <option value="Fibra PME 800 Mega">Fibra PME 800 Mega (R$ 229,90)</option>
                    <option value="Link Dedicado Fibra 1 Giga B2B">Link Dedicado Fibra 1 Giga B2B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Caixa CTO Designada</label>
                  <select
                    value={novaCto}
                    onChange={(e) => setNovaCto(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-cyan-400 font-mono"
                  >
                    <option value="CTO-CAM-014">CTO-CAM-014 (Cambuí)</option>
                    <option value="CTO-CEN-002">CTO-CEN-002 (Centro)</option>
                    <option value="CTO-TAU-007">CTO-TAU-007 (Taquaral)</option>
                    <option value="CEO-IND-003 / CTO-008">CEO-IND-003 / CTO-008 (Distrito)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Porta do Splitter</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={novaPorta}
                    onChange={(e) => setNovaPorta(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Técnico de Campo</label>
                  <select
                    value={novoTecnicoNome}
                    onChange={(e) => setNovoTecnicoNome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="Marcos Ferraz">Marcos Ferraz (Técnico Nível II)</option>
                    <option value="Diego Albuquerque">Diego Albuquerque (Instalações FTTH)</option>
                    <option value="Gabriel Santana">Gabriel Santana (Fibra & Fusão)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Janela de Agendamento</label>
                  <select
                    value={novoPeriodo}
                    onChange={(e) => setNovoPeriodo(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="MANHA">Manhã (08h às 12h)</option>
                    <option value="TARDE">Tarde (13h às 18h)</option>
                    <option value="INTEGRAL">Comercial / Integral</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Observações Operacionais</label>
                  <textarea
                    rows={2}
                    value={novaObservacao}
                    onChange={(e) => setNovaObservacao(e.target.value)}
                    placeholder="Instruções para o técnico, ponto de fixação da ONT, aviso de portaria..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNovaOSModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Criar &amp; Agendar O.S.</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
