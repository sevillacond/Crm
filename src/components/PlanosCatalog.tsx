import React, { useState } from 'react';
import { Wifi, ArrowDown, ArrowUp, Check, ShieldCheck, Zap, Plus, X, Filter } from 'lucide-react';
import { Plano } from '../types';
import { notify } from '../utils/notify';

interface PlanosCatalogProps {
  planos: Plano[];
  onSelectPlano?: (plano: Plano) => void;
  onAddPlano?: (novo: Plano) => void;
}

export const PlanosCatalog: React.FC<PlanosCatalogProps> = ({ 
  planos, 
  onSelectPlano,
  onAddPlano 
}) => {
  const [filterTec, setFilterTec] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form state
  const [nome, setNome] = useState<string>('');
  const [downloadMbps, setDownloadMbps] = useState<number>(600);
  const [uploadMbps, setUploadMbps] = useState<number>(300);
  const [precoMensal, setPrecoMensal] = useState<number>(129.90);
  const [adesao, setAdesao] = useState<number>(0);
  const [tecnologia, setTecnologia] = useState<'FTTH (Fibra Óptica)' | 'Link Dedicado' | 'Rádio 5GHz'>('FTTH (Fibra Óptica)');
  const [recursosStr, setRecursosStr] = useState<string>('Wi-Fi 6 Mesh Gigabit incluso, Suporte Prioritário 24/7, IP Dinâmico');
  const [isPopular, setIsPopular] = useState<boolean>(false);

  const handleCreatePlano = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      notify('Informe o nome do plano comercial.', 'info');
      return;
    }

    const novoPlano: Plano = {
      id: `pln_${Date.now().toString().slice(-6)}`,
      nome: nome.trim(),
      downloadMbps: Number(downloadMbps) || 100,
      uploadMbps: Number(uploadMbps) || 50,
      precoMensal: Number(precoMensal) || 99.90,
      adesao: Number(adesao) || 0,
      tecnologia,
      popular: isPopular,
      recursos: recursosStr.split(',').map(r => r.trim()).filter(Boolean)
    };

    if (onAddPlano) {
      onAddPlano(novoPlano);
    }
    notify(`Plano "${novoPlano.nome}" adicionado com sucesso ao catálogo!`, 'success');
    setIsModalOpen(false);
    // Reset
    setNome('');
  };

  const filteredPlanos = planos.filter(p => {
    if (filterTec === 'FTTH' && !p.tecnologia.includes('FTTH')) return false;
    if (filterTec === 'DEDICADO' && !p.tecnologia.includes('Dedicado')) return false;
    if (filterTec === 'RADIO' && !p.tecnologia.includes('Rádio')) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              PRD SEÇÃO 07 • PRODUTOS & CATÁLOGO
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              SGP / ERP Sync
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Catálogo de Planos &amp; Conectividade</h2>
          <p className="text-xs text-slate-400 mt-1">
            Planos homologados com velocidades de download/upload, valores de adesão e recursos de valor adicionado (SVA).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter by Tech */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterTec('TODOS')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterTec === 'TODOS' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({planos.length})
            </button>
            <button
              onClick={() => setFilterTec('FTTH')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterTec === 'FTTH' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              FTTH Fibra
            </button>
            <button
              onClick={() => setFilterTec('DEDICADO')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterTec === 'DEDICADO' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Link Dedicado
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Plano</span>
          </button>
        </div>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPlanos.map((plano) => (
          <div
            key={plano.id}
            className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
              plano.popular
                ? 'bg-gradient-to-b from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            {plano.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                Mais Vendido
              </span>
            )}

            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1 font-semibold">
                {plano.tecnologia}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{plano.nome}</h3>

              <div className="flex items-baseline gap-1 my-3">
                <span className="text-xs text-slate-400 font-medium">R$</span>
                <span className="text-3xl font-extrabold text-white">
                  {plano.precoMensal.toFixed(2).split('.')[0]}
                </span>
                <span className="text-sm font-bold text-white">
                  ,{plano.precoMensal.toFixed(2).split('.')[1]}
                </span>
                <span className="text-xs text-slate-400 font-normal">/mês</span>
              </div>

              {/* Speeds */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 mb-4 font-mono">
                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 text-[10px] block">Download</span>
                    <span className="font-bold text-white">{plano.downloadMbps} Mbps</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowUp className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 text-[10px] block">Upload</span>
                    <span className="font-bold text-white">{plano.uploadMbps} Mbps</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 text-xs text-slate-300 mb-6">
                {plano.recursos.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400 mb-3 flex items-center justify-between">
                <span>Taxa de Instalação:</span>
                <span className="font-bold text-white font-mono">
                  {plano.adesao === 0 ? 'Grátis (Fidelidade)' : `R$ ${plano.adesao.toFixed(2)}`}
                </span>
              </div>

              {onSelectPlano && (
                <button
                  onClick={() => onSelectPlano(plano)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-white text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Usar em Proposta Comercial
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Cadastrar Novo Plano */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cadastrar Novo Plano Comercial</h3>
                  <p className="text-[11px] text-slate-400">Parâmetros de banda, valor de mensalidade e adesão</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlano} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Plano</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fibra Turbo 800 Mega Mesh Wi-Fi 6"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Download (Mbps)</label>
                  <input
                    type="number"
                    required
                    value={downloadMbps}
                    onChange={(e) => setDownloadMbps(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Upload (Mbps)</label>
                  <input
                    type="number"
                    required
                    value={uploadMbps}
                    onChange={(e) => setUploadMbps(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mensalidade (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={precoMensal}
                    onChange={(e) => setPrecoMensal(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Taxa de Adesão (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={adesao}
                    onChange={(e) => setAdesao(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tecnologia de Acesso</label>
                <select
                  value={tecnologia}
                  onChange={(e) => setTecnologia(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="FTTH (Fibra Óptica)">FTTH (Fibra Óptica)</option>
                  <option value="Link Dedicado">Link Dedicado (B2B Corporativo)</option>
                  <option value="Rádio 5GHz">Rádio 5GHz (Zona Rural / Temporário)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Recursos & Benefícios (separados por vírgula)</label>
                <textarea
                  rows={2}
                  value={recursosStr}
                  onChange={(e) => setRecursosStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="popularCheck"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="popularCheck" className="text-xs text-slate-300 cursor-pointer">
                  Destacar como "Mais Vendido" na vitrine comercial
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 cursor-pointer"
                >
                  Salvar Plano no Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
