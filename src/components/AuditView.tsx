import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  User, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  FileCheck,
  Lock
} from 'lucide-react';
import { AuditLog } from '../types';

interface AuditViewProps {
  logs: AuditLog[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      !search ||
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase());

    const matchesType = 
      filterType === 'ALL' ||
      (filterType === 'MAIA' && log.isMaiaAction) ||
      (filterType === 'HUMAN' && !log.isMaiaAction) ||
      log.entityType === filterType;

    return matchesSearch && matchesType;
  });

  const exportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Ator', 'Papel', 'Ação', 'Entidade', 'ID Entidade', 'É IA?', 'Detalhes'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.actorName}"`,
      l.actorRole,
      l.action,
      l.entityType,
      l.entityId,
      l.isMaiaAction ? 'SIM' : 'NAO',
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `enlace_crm_auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-950 border border-purple-800/80 text-purple-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Trilha de Auditoria &amp; Governança LGPD</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Imutável
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro auditável de todas as ações de usuários humanos e invocações de ferramentas pela IA MaIA.
            </p>
          </div>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Relatório LGPD (.CSV)</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Filtrar por Ator / Tipo:</span>
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'MAIA', label: 'Apenas MaIA (IA)' },
            { id: 'HUMAN', label: 'Apenas Humanos' },
            { id: 'DEAL', label: 'Negócios' },
            { id: 'VIABILIDADE', label: 'Viabilidade' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterType === f.id
                  ? 'bg-purple-900/80 text-purple-200 border border-purple-700/60'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Exibindo <span className="text-white font-bold">{filteredLogs.length}</span> registros auditados
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp &amp; ID</th>
                <th className="py-3 px-4">Ator Responsável</th>
                <th className="py-3 px-4">Ação Executada</th>
                <th className="py-3 px-4">Entidade</th>
                <th className="py-3 px-4">Detalhes da Transação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500 font-sans">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      <div>{new Date(log.timestamp).toLocaleDateString('pt-BR')}</div>
                      <div className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</div>
                      <div className="text-[9px] text-slate-600 mt-0.5">#{log.id.slice(-6)}</div>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-sans">
                        {log.isMaiaAction ? (
                          <span className="p-1 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                            <Sparkles className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-slate-800 text-slate-300">
                            <User className="w-3 h-3" />
                          </span>
                        )}
                        <div>
                          <div className="font-semibold text-slate-200 text-xs">{log.actorName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.actorRole}</div>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.isMaiaAction
                          ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      <span className="text-slate-200 font-bold">{log.entityType}</span>
                      <div className="text-[10px] text-slate-500">ID: {log.entityId}</div>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 font-sans text-xs text-slate-300 max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
