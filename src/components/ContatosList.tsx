import React, { useState } from 'react';
import { 
  UserPlus, 
  MapPin, 
  Phone, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Tag, 
  Briefcase,
  ExternalLink,
  MessageCircle,
  Filter,
  Download,
  X,
  User,
  ShieldAlert
} from 'lucide-react';
import { Contato, ContatoStatus } from '../types';
import { notify } from '../utils/notify';

interface ContatosListProps {
  contatos: Contato[];
  onOpenNovoLead: () => void;
  onOpenViabilidade: (contato: Contato) => void;
  onAskMaiaAboutContato: (contato: Contato) => void;
  onCreateDealForContato: (contato: Contato) => void;
  onOpenWebPhone?: (phone: string, name: string) => void;
  searchQuery: string;
}

export const ContatosList: React.FC<ContatosListProps> = ({
  contatos,
  onOpenNovoLead,
  onOpenViabilidade,
  onAskMaiaAboutContato,
  onCreateDealForContato,
  onOpenWebPhone,
  searchQuery
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedContatoDetail, setSelectedContatoDetail] = useState<Contato | null>(null);

  const handleExportCSV = () => {
    if (contatos.length === 0) {
      notify('Nenhum contato disponível para exportação.', 'info');
      return;
    }

    const headers = ['ID', 'Nome', 'CPF_CNPJ', 'Telefone', 'Email', 'CEP', 'Logradouro', 'Numero', 'Bairro', 'Cidade', 'UF', 'Status', 'Origem', 'Score_MaIA'];
    const rows = contatos.map(c => [
      c.id,
      `"${c.nome.replace(/"/g, '""')}"`,
      `"${c.cpfCnpj || ''}"`,
      `"${c.telefone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.cep || ''}"`,
      `"${c.logradouro || ''}"`,
      `"${c.numero || ''}"`,
      `"${c.bairro || ''}"`,
      `"${c.cidade || ''}"`,
      `"${c.uf || ''}"`,
      c.status,
      c.origem,
      c.scoreMaia || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clientes_enlace_crm_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify(`${contatos.length} contatos exportados com sucesso em CSV!`, 'success');
  };

  const filteredContatos = contatos.filter((c) => {
    const matchesSearch = 
      !searchQuery ||
      c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.telefone.includes(searchQuery) ||
      c.cpfCnpj.includes(searchQuery) ||
      c.bairro.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cidade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cep.includes(searchQuery);

    const matchesStatus = selectedStatus === 'TODOS' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ContatoStatus) => {
    switch (status) {
      case 'VIAVEL':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-full text-xs font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Viável CTO
          </span>
        );
      case 'INVIAVEL':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3 text-rose-400" />
            Inviável
          </span>
        );
      case 'EM_QUALIFICACAO':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3 text-amber-400" />
            Qualificando
          </span>
        );
      case 'CLIENTE_ATIVO':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-950/80 text-blue-300 border border-blue-800/80 px-2 py-0.5 rounded-full text-xs font-medium">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            Assinante Ativo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            Novo Lead
          </span>
        );
    }
  };

  const cleanPhone = (phone: string) => phone.replace(/\D/g, '');

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Filtrar por Status:</span>
          {['TODOS', 'NOVO', 'EM_QUALIFICACAO', 'VIAVEL', 'INVIAVEL', 'CLIENTE_ATIVO'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedStatus === st
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {st === 'TODOS' ? 'Todos' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition-all cursor-pointer"
            title="Exportar base filtrada para CSV"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenNovoLead}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Lead / Contato</span>
          </button>
        </div>
      </div>

      {/* Contatos Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Nome & CPF/CNPJ</th>
                <th className="py-3 px-4">Contato & WhatsApp</th>
                <th className="py-3 px-4">Endereço & CEP (Fibra)</th>
                <th className="py-3 px-4">Status & Score MaIA</th>
                <th className="py-3 px-4">Tags & Origem</th>
                <th className="py-3 px-4 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredContatos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Nenhum contato encontrado com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredContatos.map((contato) => (
                  <tr key={contato.id} className="hover:bg-slate-800/50 transition-colors group">
                    {/* Nome & CPF */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setSelectedContatoDetail(contato)}
                        className="text-left font-semibold text-white hover:text-cyan-400 transition-colors cursor-pointer group-hover:underline flex items-center gap-1.5"
                        title="Ver perfil 360° do cliente"
                      >
                        <span>{contato.nome}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                      </button>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {contato.cpfCnpj || 'Não informado'}
                      </div>
                    </td>

                    {/* Telefone & WhatsApp & WebPhone */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        {contato.telefone && onOpenWebPhone ? (
                          <button
                            onClick={() => onOpenWebPhone(contato.telefone, contato.nome)}
                            className="p-1 rounded hover:bg-slate-800 text-cyan-400 hover:text-emerald-400 transition-colors cursor-pointer"
                            title={`Ligar para ${contato.nome} via WebPhone VoIP`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                        <span className="font-mono">{contato.telefone}</span>
                        {contato.telefone && (
                          <a
                            href={`https://wa.me/55${cleanPhone(contato.telefone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 p-0.5"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                        <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{contato.email || '—'}</span>
                      </div>
                    </td>

                    {/* Endereço & CEP */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{contato.logradouro}, {contato.numero}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {contato.bairro} — {contato.cidade}/{contato.uf} (CEP {contato.cep})
                      </div>
                    </td>

                    {/* Status & Score MaIA */}
                    <td className="py-3.5 px-4">
                      <div className="mb-1.5">{getStatusBadge(contato.status)}</div>
                      {contato.scoreMaia !== undefined && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span className="text-slate-400">Score MaIA:</span>
                          <span className={`font-bold font-mono ${
                            contato.scoreMaia >= 85 ? 'text-emerald-400' : contato.scoreMaia >= 60 ? 'text-amber-400' : 'text-slate-400'
                          }`}>
                            {contato.scoreMaia}/100
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Tags & Origem */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {contato.tags.map((tg, idx) => (
                          <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                            #{tg}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Origem: {contato.origem}
                      </div>
                    </td>

                    {/* Ações Rápidas */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {contato.telefone && onOpenWebPhone && (
                          <button
                            onClick={() => onOpenWebPhone(contato.telefone, contato.nome)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-xs transition-colors cursor-pointer"
                            title="Ligar via WebPhone VoIP"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Ligar</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenViabilidade(contato)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 flex items-center gap-1 text-xs transition-colors cursor-pointer"
                          title="Checar viabilidade de CTO"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>CTO</span>
                        </button>

                        <button
                          onClick={() => onAskMaiaAboutContato(contato)}
                          className="px-2 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 hover:text-indigo-200 flex items-center gap-1 text-xs transition-colors cursor-pointer"
                          title="Qualificar com MaIA"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>MaIA</span>
                        </button>

                        <button
                          onClick={() => onCreateDealForContato(contato)}
                          className="px-2 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-white flex items-center gap-1 text-xs transition-colors cursor-pointer"
                          title="Criar Negócio no Kanban"
                        >
                          <Briefcase className="w-3 h-3" />
                          <span>Negócio</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Perfil 360° do Cliente */}
      {selectedContatoDetail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold font-mono">
                  {selectedContatoDetail.nome.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{selectedContatoDetail.nome}</span>
                    {getStatusBadge(selectedContatoDetail.status)}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    ID: {selectedContatoDetail.id} • CPF/CNPJ: {selectedContatoDetail.cpfCnpj || 'Não cadastrado'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContatoDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Canais de Comunicação */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                  Canais de Comunicação
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-mono">{selectedContatoDetail.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 truncate">
                    <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{selectedContatoDetail.email || 'Não informado'}</span>
                  </div>
                </div>
              </div>

              {/* Endereço & Rede Óptica */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                    Endereço de Instalação FTTH
                  </div>
                  <button
                    onClick={() => {
                      const c = selectedContatoDetail;
                      setSelectedContatoDetail(null);
                      onOpenViabilidade(c);
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Testar CTO</span>
                  </button>
                </div>
                <p className="text-slate-200">
                  {selectedContatoDetail.logradouro}, {selectedContatoDetail.numero} {selectedContatoDetail.complemento ? `(${selectedContatoDetail.complemento})` : ''}
                </p>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>Bairro: <strong className="text-slate-300">{selectedContatoDetail.bairro}</strong></span>
                  <span>CEP: <strong className="text-slate-300 font-mono">{selectedContatoDetail.cep}</strong></span>
                  <span>{selectedContatoDetail.cidade}/{selectedContatoDetail.uf}</span>
                </div>
              </div>

              {/* Inteligência MaIA */}
              <div className="bg-purple-950/30 p-3.5 rounded-xl border border-purple-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Inteligência Artificial MaIA</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-700">
                    Score: {selectedContatoDetail.scoreMaia || 85}/100
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/90 leading-relaxed">
                  {selectedContatoDetail.resumoMaia || 'Perfil qualificado para planos FTTH residenciais ou link dedicado, sem registros de inadimplência cadastral.'}
                </p>
              </div>

              {/* Tags */}
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1">
                  Tags & Segmentações
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedContatoDetail.tags.map((t, idx) => (
                    <span key={idx} className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded-lg border border-slate-700 font-mono">
                      #{t}
                    </span>
                  ))}
                  <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] px-2 py-0.5 rounded-lg">
                    Origem: {selectedContatoDetail.origem}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedContatoDetail.telefone && onOpenWebPhone && (
                  <button
                    onClick={() => {
                      const tel = selectedContatoDetail.telefone;
                      const nom = selectedContatoDetail.nome;
                      setSelectedContatoDetail(null);
                      onOpenWebPhone(tel, nom);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Ligar VoIP</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const c = selectedContatoDetail;
                    setSelectedContatoDetail(null);
                    onAskMaiaAboutContato(c);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Copiloto MaIA</span>
                </button>
              </div>

              <button
                onClick={() => {
                  const c = selectedContatoDetail;
                  setSelectedContatoDetail(null);
                  onCreateDealForContato(c);
                }}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 cursor-pointer flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Gerar Proposta Comercial</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
