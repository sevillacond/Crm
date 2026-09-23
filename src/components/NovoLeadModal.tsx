import React, { useState } from 'react';
import { X, UserPlus, MapPin, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { Plano, User } from '../types';

interface NovoLeadModalProps {
  planos: Plano[];
  currentUser: User;
  onClose: () => void;
  onSubmit: (leadData: any) => void;
}

export const NovoLeadModal: React.FC<NovoLeadModalProps> = ({
  planos,
  currentUser,
  onClose,
  onSubmit
}) => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [cep, setCep] = useState('13024-000');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('Cambuí');
  const [cidade, setCidade] = useState('Campinas');
  const [planoId, setPlanoId] = useState(planos[0]?.id || '');
  const [origem, setOrigem] = useState<'WHATSAPP' | 'WEBCHAT' | 'SITE' | 'INDICACAO'>('WHATSAPP');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !telefone) return;

    onSubmit({
      nome,
      telefone,
      email,
      cpfCnpj,
      cep,
      logradouro,
      numero,
      bairro,
      cidade,
      uf: 'SP',
      planoId,
      origem,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800/80 text-cyan-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cadastrar Novo Lead de Internet</h3>
              <p className="text-[11px] text-slate-400">
                Insere contato no CRM e inicializa card na etapa &quot;Novo Lead&quot; do Kanban
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Nome Completo / Razão Social *</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva ou Padaria Esperança"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">WhatsApp / Telefone *</label>
              <input
                type="text"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(19) 99888-7766"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">CPF ou CNPJ</label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-300 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Endereço de Instalação */}
          <div className="border-t border-slate-800/80 pt-3">
            <h4 className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Endereço de Instalação (Validação de Fibra)</span>
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">CEP</label>
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="13000-000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-medium text-slate-400 mb-1">Logradouro (Rua / Av)</label>
                <input
                  type="text"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  placeholder="Av. Principal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">Número</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="123"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">Bairro</label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Centro"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Plano Pretendido & Origem */}
          <div className="border-t border-slate-800/80 pt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Plano de Interesse</label>
              <select
                value={planoId}
                onChange={(e) => setPlanoId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                {planos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — R$ {p.precoMensal.toFixed(2)}/mês
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Canal de Origem</label>
              <select
                value={origem}
                onChange={(e: any) => setOrigem(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="WHATSAPP">WhatsApp Inbound</option>
                <option value="WEBCHAT">Webchat do Site</option>
                <option value="SITE">Landing Page / Formulário</option>
                <option value="INDICACAO">Indicação de Assinante</option>
              </select>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-950 transition-colors"
            >
              Criar Lead e Inserir no Kanban
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
