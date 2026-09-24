import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Unlock, 
  Activity, 
  Radio, 
  FileText,
  Clock,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { SgpClienteStatus, User as UserType } from '../types';
import { notify } from '../utils/notify';

export const SgpView: React.FC<{ currentUser: UserType }> = ({ currentUser }) => {
  const [contratos, setContratos] = useState<SgpClienteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContrato, setSelectedContrato] = useState<SgpClienteStatus | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagnostico, setDiagnostico] = useState<any | null>(null);
  const [desbloqueando, setDesbloqueando] = useState(false);

  const fetchContratos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sgp/contratos', {
        headers: { 'x-user-id': currentUser.id }
      });
      if (res.ok) {
        const data = await res.json();
        setContratos(data.contratos || []);
      }
    } catch (err: any) {
      console.error('Erro ao buscar contratos SGP:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContratos();
  }, []);

  const handleTestConnection = async (contrato: SgpClienteStatus) => {
    setSelectedContrato(contrato);
    setDiagLoading(true);
    setDiagnostico(null);
    try {
      const res = await fetch(`/api/sgp/contratos/${contrato.contratoId}/diagnostico`, {
        headers: { 'x-user-id': currentUser.id }
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnostico(data.diagnostico);
      } else {
        const err = await res.json();
        notify(`Erro no diagnóstico: ${err.error?.message}`, 'error');
      }
    } catch (err: any) {
      notify(`Erro: ${err.message}`, 'error');
    } finally {
      setDiagLoading(false);
    }
  };

  const handleDesbloqueio = async (contratoId: string) => {
    setDesbloqueando(true);
    try {
      const res = await fetch(`/api/sgp/contratos/${contratoId}/desbloqueio-confianca`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser.id }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Falha no desbloqueio');
      }

      const data = await res.json();
      notify(data.resultado.mensagem, 'success');
      await fetchContratos();
      if (selectedContrato && selectedContrato.contratoId === contratoId) {
        setSelectedContrato(prev => prev ? { ...prev, statusConexao: 'CONECTADO', desbloqueioConfiancaDisponivel: false } : null);
      }
    } catch (err: any) {
      notify(`Erro: ${err.message}`, 'error');
    } finally {
      setDesbloqueando(false);
    }
  };

  const filteredContratos = contratos.filter(c => 
    c.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpfCnpj.includes(searchTerm) ||
    c.contratoId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.planoContratado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              Gateway SGP Provedores
            </span>
            <span className="text-xs text-slate-400">• IXC Soft / MK-Auth / Voalle</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Integração SGP &amp; Diagnóstico de Fibra</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Sincronização em tempo real de status PPPoE/IPoE, leitura de sinal óptico (dBm) e liberação emergencial por confiança.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchContratos}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer flex items-center gap-2 text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sincronizar SGP</span>
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Contratos */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Contratos Sincronizados ({filteredContratos.length})</span>
            </h3>

            {/* Busca */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar cliente, CPF ou contrato..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredContratos.map(contrato => {
              const isSelected = selectedContrato?.contratoId === contrato.contratoId;
              const isBlocked = contrato.statusConexao === 'BLOQUEADO';
              const isReduced = contrato.statusConexao === 'REDUZIDO';

              return (
                <div
                  key={contrato.contratoId}
                  onClick={() => setSelectedContrato(contrato)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-950/90 border-cyan-500 shadow-md shadow-cyan-950/20'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-white font-medium">{contrato.nomeCliente}</strong>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {contrato.provedorSgp}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {contrato.contratoId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span>CPF/CNPJ: {contrato.cpfCnpj}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-medium">{contrato.planoContratado}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border ${
                        contrato.statusConexao === 'CONECTADO'
                          ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                          : isBlocked
                          ? 'bg-rose-950/70 border-rose-600 text-rose-300'
                          : 'bg-amber-950/70 border-amber-600 text-amber-300'
                      }`}>
                        {contrato.statusConexao}
                      </span>
                      {contrato.faturasAbertas > 0 && (
                        <span className="text-[10px] text-rose-400 flex items-center gap-1 font-mono">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{contrato.faturasAbertas} fatura pendente ({contrato.diasInadimplente}d)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações de Conexão Rápida */}
                  <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-4 text-[11px] font-mono">
                      <span>IP: <strong className="text-slate-300">{contrato.ipPppoe || 'N/A'}</strong></span>
                      <span>Sinal: <strong className={contrato.sinalRxDbm && contrato.sinalRxDbm < -25 ? 'text-amber-400' : 'text-emerald-400'}>{contrato.sinalRxDbm ? `${contrato.sinalRxDbm} dBm` : 'N/A'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestConnection(contrato);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition-colors"
                      >
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Diagnóstico</span>
                      </button>

                      {contrato.desbloqueioConfiancaDisponivel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDesbloqueio(contrato.contratoId);
                          }}
                          disabled={desbloqueando}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Desbloquear 48h</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel Lateral: Diagnóstico em Tempo Real */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Painel de Diagnóstico OLT/ONT</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Telemetria óptica e teste de conectividade GPON
            </p>
          </div>

          {selectedContrato ? (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white">{selectedContrato.nomeCliente}</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Contrato: <span className="text-cyan-300">{selectedContrato.contratoId}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  MAC ONT: <span className="text-slate-300">{selectedContrato.macOnt || 'N/A'}</span>
                </div>
              </div>

              {diagLoading ? (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                  <div className="text-xs text-slate-400">Consultando OLT e testando ping PPPoE...</div>
                </div>
              ) : diagnostico ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Status Ping:</span>
                      <strong className={diagnostico.online ? 'text-emerald-400' : 'text-rose-400'}>
                        {diagnostico.online ? 'ONLINE' : 'OFFLINE'}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Latência Média:</span>
                      <span className="text-slate-200">{diagnostico.latenciaMs ? `${diagnostico.latenciaMs} ms` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Perda de Pacotes:</span>
                      <span className="text-slate-200">{diagnostico.perdaPacotes}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <span className="text-slate-400">Sinal Óptico RX:</span>
                      <span className={diagnostico.potenciaRxDbm < -25 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {diagnostico.potenciaRxDbm} dBm ({diagnostico.qualidadeOptica})
                      </span>
                    </div>
                  </div>

                  {selectedContrato.desbloqueioConfiancaDisponivel && (
                    <button
                      onClick={() => handleDesbloqueio(selectedContrato.contratoId)}
                      disabled={desbloqueando}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950 transition-colors"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Liberar Acesso em Confiança (48h)</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  Clique em &quot;Diagnóstico&quot; para enviar pacotes de teste e ler os parâmetros ópticos da ONT na OLT.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-500 space-y-2">
              <Info className="w-6 h-6 mx-auto text-slate-600" />
              <p>Selecione um contrato ao lado para visualizar a telemetria completa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
