import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Play, 
  AlertTriangle,
  RotateCw,
  Search,
  Check,
  X,
  FileCode,
  User,
  Shield,
  Zap,
  Info
} from 'lucide-react';
import { User as UserType } from '../types';
import { notify } from '../utils/notify';
import { authenticatedFetch } from '../utils/api';

interface MaiaApproval {
  id: string;
  instanceId: string;
  toolName: string;
  params: any;
  paramsHash: string;
  policyVersion?: string;
  requestedBy: {
    userId: string;
    name: string;
    role: string;
  };
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'EXECUTED' | 'FAILED';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: {
    userId: string;
    name: string;
    role: string;
  };
  rejectionReason?: string;
  executedBy?: {
    userId: string;
    name: string;
    role: string;
  };
  executionResult?: any;
  executedAt?: string;
}

interface MaiaStatus {
  nivelAutonomia: number;
  versao: string;
  status: string;
  instanceId: string;
}

export const MaiaCentralView: React.FC<{
  currentUser: UserType;
  onOpenTerminal: () => void;
}> = ({ currentUser, onOpenTerminal }) => {
  const [status, setStatus] = useState<MaiaStatus | null>(null);
  const [approvals, setApprovals] = useState<MaiaApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingNivel, setUpdatingNivel] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const canConfigure = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resStatus, resApprovals] = await Promise.all([
        authenticatedFetch('/api/maia/status'),
        authenticatedFetch('/api/maia/approvals')
      ]);

      if (resStatus.ok) {
        const statusData = await resStatus.json();
        setStatus(statusData);
      }

      if (resApprovals.ok) {
        const approvalsData = await resApprovals.json();
        setApprovals(approvalsData.approvals || []);
      }
    } catch (err: any) {
      console.error('[MaiaCentralView] Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChangeNivel = async (novoNivel: number) => {
    if (!canConfigure || updatingNivel) return;
    setUpdatingNivel(true);
    try {
      const res = await authenticatedFetch('/api/maia/autonomia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nivel: novoNivel })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Falha ao alterar nível');
      }

      const data = await res.json();
      setStatus(prev => prev ? { ...prev, nivelAutonomia: data.nivelAutonomia } : null);
      notify(`Nível de autonomia da MaIA atualizado para N${novoNivel} com sucesso!`, 'success');
    } catch (err: any) {
      notify(`Erro ao alterar autonomia: ${err.message}`, 'error');
    } finally {
      setUpdatingNivel(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await authenticatedFetch(`/api/maia/approvals/${id}/approve`, {
        method: 'POST'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Falha na aprovação');
      }

      notify('Ação aprovada com sucesso. Pronta para execução.', 'success');
      await fetchData();
    } catch (err: any) {
      notify(`Erro: ${err.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      notify('Informe o motivo da rejeição.', 'error');
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await authenticatedFetch(`/api/maia/approvals/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Falha ao rejeitar');
      }

      notify('Solicitação rejeitada com sucesso.', 'info');
      setRejectModalId(null);
      setRejectReason('');
      await fetchData();
    } catch (err: any) {
      notify(`Erro: ${err.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExecute = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await authenticatedFetch(`/api/maia/approvals/${id}/execute`, {
        method: 'POST'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Falha na execução');
      }

      notify('Ferramenta executada com sucesso!', 'success');
      await fetchData();
    } catch (err: any) {
      notify(`Erro ao executar ferramenta: ${err.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const niveisDescricao = [
    { nivel: 0, nome: 'N0: Desativada', desc: 'MaIA completamente desligada nesta instância.' },
    { nivel: 1, nome: 'N1: Informativa', desc: 'Apenas consultas de leitura e recomendação sem alterações.' },
    { nivel: 2, nome: 'N2: Assistida', desc: 'Executa qualificação de leads e tarefas leves auditadas.' },
    { nivel: 3, nome: 'N3: Human-in-the-Loop', desc: 'Operações financeiras/exceções exigem aprovação humana prévia.' },
    { nivel: 4, nome: 'N4: Autonomia Avançada', desc: 'Autonomia máxima supervisionada por regras de conformidade.' }
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Central MaIA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              Governança &amp; Policy Engine
            </span>
            <span className="text-xs text-slate-400">• MCP Tool Gateway Segura</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Central de Governança MaIA</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {status?.versao || 'MaIA v2.4 (Fail-Closed)'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Painel supervisor de controle de autonomia (N0-N4), fila de aprovações com verificação criptográfica SHA-256 e terminal operacional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Atualizar dados"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenTerminal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950 transition-all cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Abrir Co-Piloto</span>
          </button>
        </div>
      </div>

      {/* Grid: Nível de Autonomia & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nível de Autonomia da Instância */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Nível de Autonomia (Policy Engine)</span>
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
              N{status?.nivelAutonomia ?? 3}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {niveisDescricao.find(n => n.nivel === (status?.nivelAutonomia ?? 3))?.desc}
          </p>

          <div className="space-y-2 pt-1">
            {niveisDescricao.map((item) => {
              const isSelected = (status?.nivelAutonomia ?? 3) === item.nivel;
              return (
                <button
                  key={item.nivel}
                  disabled={!canConfigure || updatingNivel}
                  onClick={() => handleChangeNivel(item.nivel)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-950/30'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  } ${!canConfigure ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{item.nome}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5 line-clamp-1">
                      {item.desc}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-900/80 text-purple-200">
                      ATIVO
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!canConfigure && (
            <p className="text-[11px] text-amber-400/90 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/60 flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Apenas Administradores e Supervisores podem alterar o nível de autonomia.</span>
            </p>
          )}
        </div>

        {/* Fila de Aprovações Human-in-the-Loop */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Fila de Aprovações Pendentes (P0 Human-in-the-Loop)</span>
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              {approvals.length} Pendentes
            </span>
          </div>

          {approvals.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-white">Nenhuma solicitação pendente</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Todas as operações sensíveis da MaIA estão resolvidas ou a governança operou sem exceções que demandem alçada manual.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                        {req.toolName}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        req.status === 'APPROVED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                        req.status === 'PENDING_APPROVAL' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        req.status === 'EXECUTED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {req.status === 'APPROVED' ? 'APROVADO (PRONTO P/ EXECUÇÃO)' : req.status}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {req.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(req.createdAt).toLocaleTimeString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Detalhes dos Parâmetros & Hash */}
                  <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800/80 font-mono text-[11px] space-y-1">
                    <div className="text-slate-400 flex justify-between">
                      <span>Solicitante:</span>
                      <strong className="text-slate-200">{req.requestedBy.name} ({req.requestedBy.role})</strong>
                    </div>
                    {req.resolvedBy && (
                      <div className="text-slate-400 flex justify-between">
                        <span>Aprovado por:</span>
                        <strong className="text-cyan-300">{req.resolvedBy.name} ({req.resolvedBy.role})</strong>
                      </div>
                    )}
                    <div className="text-slate-400 flex justify-between">
                      <span>Integridade (SHA-256):</span>
                      <span className="text-cyan-400 truncate max-w-[200px]">{req.paramsHash}</span>
                    </div>
                    <div className="text-slate-400 pt-1 border-t border-slate-800 text-[10px]">
                      Parâmetros: <span className="text-amber-300">{JSON.stringify(req.params)}</span>
                    </div>
                  </div>

                  {/* Ações do Supervisor - P0: Aprovação e Execução Segregadas */}
                  {canConfigure && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {req.status === 'PENDING_APPROVAL' && (
                        <>
                          <button
                            disabled={actionLoadingId === req.id}
                            onClick={() => {
                              setRejectModalId(req.id);
                              setRejectReason('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Rejeitar</span>
                          </button>

                          <button
                            disabled={actionLoadingId === req.id}
                            onClick={() => handleApprove(req.id)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-950"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprovar</span>
                          </button>
                        </>
                      )}

                      {req.status === 'APPROVED' && (
                        <button
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleExecute(req.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-950"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Executar</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Rejeição */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Rejeitar Solicitação de Ferramenta</h3>
            <p className="text-xs text-slate-400">
              Descreva o motivo da recusa para fins de auditoria e conformidade:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Desconto fora da alçada de margem permitida pela diretoria"
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalId(null)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReject(rejectModalId)}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
