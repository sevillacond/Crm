import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Tag, 
  Eye, 
  FileText, 
  Clock, 
  FolderTree, 
  ShieldCheck, 
  Globe, 
  Lock 
} from 'lucide-react';
import { notify } from '../utils/notify';

interface Artigo {
  id: string;
  titulo: string;
  categoria: 'FAQ' | 'Produtos & Planos' | 'Procedimentos Técnicos' | 'Financeiro & Políticas';
  publicadoMaia: boolean;
  versao: string;
  autor: string;
  atualizadoEm: string;
  tags: string[];
  conteudo: string;
}

export const BaseConhecimentoView: React.FC = () => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedArtigoId, setSelectedArtigoId] = useState<string>('art-1');
  const [testQuestion, setTestQuestion] = useState<string>('');
  const [testResult, setTestResult] = useState<string | null>(null);

  const [artigos, setArtigos] = useState<Artigo[]>([
    {
      id: 'art-1',
      titulo: 'Wi-Fi 6 Mesh em Comodato: Regras de Elegibilidade e Instalação',
      categoria: 'Produtos & Planos',
      publicadoMaia: true,
      versao: 'v1.4',
      autor: 'Engenharia de Produtos',
      atualizadoEm: '20/09/2026',
      tags: ['wifi6', 'mesh', 'equipamento', 'comodato'],
      conteudo: `O plano Fibra 600 Mega e planos superiores (Giga Ultra) contemplam 1 (uma) unidade de ONU GPON com roteador Wi-Fi 6 Dual-Band em regime de comodato gratuito.
Para residências com área construída acima de 120m² ou múltiplos pavimentos, o cliente pode solicitar pontos adicionais de nó Mesh Wi-Fi 6 pelo valor promocional de R$ 19,90/mês por ponto adicional.
Adesão e taxa de instalação: Isentas no contrato de permanência de 12 meses.`
    },
    {
      id: 'art-2',
      titulo: 'Segunda Via de Fatura e Pagamento Instantâneo via Pix',
      categoria: 'Financeiro & Políticas',
      publicadoMaia: true,
      versao: 'v2.1',
      autor: 'Controladoria & Finanças',
      atualizadoEm: '18/09/2026',
      tags: ['pix', 'fatura', 'boleto', 'baixa_automatica'],
      conteudo: `O cliente pode solicitar a 2ª via da sua fatura a qualquer momento pelo WhatsApp ou WebChat informando seu CPF ou CNPJ.
A MaIA pode gerar o código Pix Copia e Cola instantâneo com valor atualizado.
Pagamentos via Pix são compensados e baixados no sistema em até 3 (três) minutos.
Para clientes suspensos por inadimplência, a confirmação do Pix reativa automaticamente o sinal na OLT/Radius.`
    },
    {
      id: 'art-3',
      titulo: 'Procedimento Padrão para Perda de Conexão (LED PON Piscando ou LOS Vermelho)',
      categoria: 'Procedimentos Técnicos',
      publicadoMaia: true,
      versao: 'v3.0',
      autor: 'NOC & Suporte N2',
      atualizadoEm: '21/09/2026',
      tags: ['suporte', 'los', 'pon', 'rompimento', 'fibra'],
      conteudo: `Quando o cliente relatar luz LOS Vermelha no modem/ONU:
1. Orientar a não dobrar o cordão óptico amarelo (drop de fibra).
2. Verificar se há manutenção programada ou rompimento massivo na CTO daquele circuito via Tool SGP.
3. Se o sinal de atenuação estiver abaixo de -27 dBm, abrir Ordem de Serviço com prioridade Normal.
4. Se houver LOS total (ausência de luz), despachar equipe de campo de plantão com prazo máximo de 4h para clientes empresariais.`
    },
    {
      id: 'art-4',
      titulo: 'Política de Mudança de Endereço e Viabilidade Técnica',
      categoria: 'FAQ',
      publicadoMaia: false,
      versao: 'v1.0 (Rascunho)',
      autor: 'Atendimento ao Cliente',
      atualizadoEm: '15/09/2026',
      tags: ['mudanca_endereco', 'viabilidade', 'taxa'],
      conteudo: `A solicitação de alteração de endereço deve ser feita com antecedência mínima de 5 (cinco) dias úteis.
A execução está sujeita à validação prévia de portas disponíveis na Caixa de Terminação Óptica (CTO) no novo endereço.
Taxa de reinstalação: Gratuita para clientes fidelizados há mais de 6 meses.`
    }
  ]);

  const activeArtigo = artigos.find(a => a.id === selectedArtigoId) || artigos[0];

  const handleTestKnowledge = () => {
    if (!testQuestion.trim()) return;
    setTestResult(`A MaIA consultou a base e encontrou correspondência no artigo "${activeArtigo.titulo}" (${activeArtigo.versao}).
Resposta sintetizada pela IA: "De acordo com nossa documentação oficial, ${activeArtigo.conteudo.slice(0, 180)}..."`);
  };

  const filteredArtigos = artigos.filter(a => {
    const matchesSearch = !search || a.titulo.toLowerCase().includes(search.toLowerCase()) || a.conteudo.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategoria === 'TODAS' || a.categoria === selectedCategoria;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              PRD Seção 24 • Base de Conhecimento RAG da MaIA
            </span>
            <span className="text-xs text-slate-400">• Conteúdo Autorizado &amp; Versionado</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Base de Conhecimento &amp; Procedimentos da Instância
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            A MaIA prioriza exclusivamente informações publicadas e homologadas nesta base, eliminando alucinações e garantindo respostas precisas sobre produtos, procedimentos e políticas.
          </p>
        </div>

        <button
          onClick={() => notify('Editor de novo artigo de conhecimento aberto para rascunho.', 'info')}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950 flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Artigo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Categories & Articles List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Pesquisar artigos e procedimentos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Categories filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none font-medium">
              {['TODAS', 'Produtos & Planos', 'Procedimentos Técnicos', 'Financeiro & Políticas', 'FAQ'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoria(cat)}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategoria === cat
                      ? 'bg-purple-950 text-purple-200 border border-purple-800 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Articles items */}
          <div className="space-y-2">
            {filteredArtigos.map(art => (
              <div
                key={art.id}
                onClick={() => setSelectedArtigoId(art.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-md ${
                  art.id === activeArtigo.id
                    ? 'bg-purple-950/40 border-purple-600 ring-1 ring-purple-600/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    {art.categoria}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-slate-500">{art.versao}</span>
                    {art.publicadoMaia ? (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-bold">
                        Publicado MaIA
                      </span>
                    ) : (
                      <span className="bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded">
                        Rascunho
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white mb-1.5">{art.titulo}</h4>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>Atualizado: {art.atualizadoEm}</span>
                  <span>Por: {art.autor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Article Reader & RAG Simulator */}
        <div className="lg:col-span-7 space-y-6">
          {/* Article View Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-purple-400 uppercase tracking-wider block mb-1">
                  {activeArtigo.categoria} • {activeArtigo.versao}
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {activeArtigo.titulo}
                </h3>
              </div>

              <button
                onClick={() => {
                  setArtigos(prev => prev.map(a => a.id === activeArtigo.id ? { ...a, publicadoMaia: !a.publicadoMaia } : a));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                  activeArtigo.publicadoMaia
                    ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {activeArtigo.publicadoMaia ? 'Publicado para MaIA' : 'Ativar para MaIA'}
              </button>
            </div>

            <div className="prose prose-invert max-w-none text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {activeArtigo.conteudo}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>Tags: {activeArtigo.tags.join(', ')}</span>
              </div>
              <span>ID: {activeArtigo.id}</span>
            </div>
          </div>

          {/* Test RAG with MaIA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Simulador de Recuperação RAG da MaIA</span>
              </h4>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                Grounding Ativo
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Faça uma pergunta para testar se a MaIA acha este artigo (ex: 'O plano 600 Mega tem Wi-Fi 6?')..."
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTestKnowledge()}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleTestKnowledge}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
              >
                Testar IA
              </button>
            </div>

            {testResult && (
              <div className="p-3 rounded-xl bg-slate-950 border border-purple-900/60 font-mono text-xs text-purple-200 whitespace-pre-wrap">
                {testResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
