import React, { useState } from 'react';
import { 
  Radio, 
  Search, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Wrench, 
  Cpu, 
  Activity, 
  Zap, 
  Layers,
  ArrowRight,
  Filter,
  RefreshCw,
  Sliders,
  Server
} from 'lucide-react';
import { Contato, ViabilidadeConsulta, OrdemServico, Plano } from '../types';
import { notify } from '../utils/notify';

interface CTOData {
  id: string;
  nome: string;
  bairro: string;
  logradouro: string;
  oltNome: string;
  ponPort: string;
  tipoSplitter: '1:8' | '1:16';
  portasTotais: number;
  portasOcupadas: number;
  sinalMedioDbm: number;
  status: 'OPERACIONAL' | 'ATENCAO' | 'ESGOTADA';
  ultimaLeitura: string;
}

interface ViabilidadeViewProps {
  contatos: Contato[];
  planos: Plano[];
  onOpenNovoLead?: () => void;
  onOpenNovaOSParaEndereco?: (dados: {
    endereco: string;
    bairro: string;
    ctoId: string;
    distanciaMetros: number;
    sinalDbm: number;
  }) => void;
}

export const ViabilidadeView: React.FC<ViabilidadeViewProps> = ({
  contatos,
  planos,
  onOpenNovoLead,
  onOpenNovaOSParaEndereco
}) => {
  const [cep, setCep] = useState<string>('01310-100');
  const [numero, setNumero] = useState<string>('1500');
  const [logradouro, setLogradouro] = useState<string>('Av. Paulista');
  const [bairro, setBairro] = useState<string>('Bela Vista');
  const [isConsulting, setIsConsulting] = useState<boolean>(false);
  const [resultado, setResultado] = useState<ViabilidadeConsulta | null>(null);

  // Power Budget Calculator state
  const [comprimentoFibraKm, setComprimentoFibraKm] = useState<number>(3.5);
  const [qtdFusoes, setQtdFusoes] = useState<number>(4);
  const [qtdConectores, setQtdConectores] = useState<number>(2);
  const [splitterRatio, setSplitterRatio] = useState<'1:8' | '1:16'>('1:16');

  // CTOs Database
  const [ctos, setCtos] = useState<CTOData[]>([
    {
      id: 'CTO-CAM-014',
      nome: 'CTO-014 (Poste 44)',
      bairro: 'Campinas',
      logradouro: 'Rua das Camélias, 210',
      oltNome: 'Huawei SmartAX MA5800-X7',
      ponPort: 'PON 0/2/4',
      tipoSplitter: '1:16',
      portasTotais: 16,
      portasOcupadas: 13,
      sinalMedioDbm: -19.4,
      status: 'OPERACIONAL',
      ultimaLeitura: 'Hoje, 05:12'
    },
    {
      id: 'CTO-JAR-008',
      nome: 'CTO-008 (Poste 12)',
      bairro: 'Jd. das Américas',
      logradouro: 'Av. Coronel Francisco, 890',
      oltNome: 'ZTE C320 GPON',
      ponPort: 'PON 1/1/2',
      tipoSplitter: '1:16',
      portasTotais: 16,
      portasOcupadas: 15,
      sinalMedioDbm: -20.1,
      status: 'ATENCAO',
      ultimaLeitura: 'Hoje, 04:55'
    },
    {
      id: 'CTO-CEN-002',
      nome: 'CTO-002 (Poste 05)',
      bairro: 'Centro Cívico',
      logradouro: 'Rua XV de Novembro, 340',
      oltNome: 'Fiberhome AN5516-04',
      ponPort: 'PON 0/1/1',
      tipoSplitter: '1:8',
      portasTotais: 8,
      portasOcupadas: 6,
      sinalMedioDbm: -18.2,
      status: 'OPERACIONAL',
      ultimaLeitura: 'Hoje, 05:20'
    },
    {
      id: 'CTO-VIL-021',
      nome: 'CTO-021 (Poste 78)',
      bairro: 'Vila Nova',
      logradouro: 'Rua Paraná, 550',
      oltNome: 'Huawei SmartAX MA5800-X7',
      ponPort: 'PON 0/3/6',
      tipoSplitter: '1:16',
      portasTotais: 16,
      portasOcupadas: 16,
      sinalMedioDbm: -21.8,
      status: 'ESGOTADA',
      ultimaLeitura: 'Hoje, 03:40'
    },
    {
      id: 'CTO-BEL-009',
      nome: 'CTO-009 (Poste 18)',
      bairro: 'Bela Vista',
      logradouro: 'Av. Paulista, 1480',
      oltNome: 'Huawei SmartAX MA5800-X7',
      ponPort: 'PON 0/4/1',
      tipoSplitter: '1:16',
      portasTotais: 16,
      portasOcupadas: 10,
      sinalMedioDbm: -19.1,
      status: 'OPERACIONAL',
      ultimaLeitura: 'Hoje, 05:00'
    }
  ]);

  const [filtroBairro, setFiltroBairro] = useState<string>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  // Consulta manual
  const handleConsultar = () => {
    setIsConsulting(true);
    setTimeout(() => {
      // Find matching or closest CTO
      const ctoBairro = ctos.find(c => c.bairro.toLowerCase() === bairro.toLowerCase() && c.status !== 'ESGOTADA');
      const ctoEscolhida = ctoBairro || ctos[0];
      const distancia = Math.floor(25 + Math.random() * 65);

      setResultado({
        cep,
        numero,
        bairro,
        viavel: true,
        ctoId: ctoEscolhida.id,
        distanciaMetros: distancia,
        portasLivres: ctoEscolhida.portasTotais - ctoEscolhida.portasOcupadas,
        tecnologiaDisponivel: 'FTTH GPON Fibra Óptica (Até 1 Gbps)',
        observacao: `Endereço dentro da mancha de cobertura FTTH. CTO ${ctoEscolhida.id} localizada a ${distancia}m.`
      });
      setIsConsulting(false);
      notify(`Viabilidade confirmada na CTO ${ctoEscolhida.id} (${distancia}m de cabo drop)!`, 'success');
    }, 600);
  };

  // Optical loss calculations
  // Fiber loss: ~0.35 dB/km @ 1310nm, ~0.22 dB/km @ 1490nm
  const perdaFibra = comprimentoFibraKm * 0.35;
  const perdaFusoes = qtdFusoes * 0.05; // 0.05 dB per fusion
  const perdaConectores = qtdConectores * 0.3; // 0.3 dB per SC-APC connector
  const perdaSplitter = splitterRatio === '1:8' ? 10.5 : 13.8;
  const potenciaTxOlt = 3.0; // +3 dBm Class B+
  const potenciaRecebidaOnt = potenciaTxOlt - (perdaFibra + perdaFusoes + perdaConectores + perdaSplitter);

  const filteredCtos = ctos.filter(c => {
    if (filtroBairro !== 'TODOS' && c.bairro !== filtroBairro) return false;
    if (filtroStatus !== 'TODOS' && c.status !== filtroStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              PRD SEÇÃO 08 • PLANTA EXTERNA FTTH / GPON
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Rede Óptica Viva
            </span>
          </div>
          <h2 className="text-xl font-black text-white">Engenharia de Viabilidade & Caixas de Terminação (CTO)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Mapeamento de portas ópticas, cálculo de atenuação de cabo drop e reserva imediata de porta de splitter.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNovoLead && (
            <button
              onClick={onOpenNovoLead}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lead Comercial</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Consulta Rápida de Endereço + Calculadora de Orçamento Óptico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endereço & Viabilidade */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Consulta Rápida de Viabilidade</h3>
                <p className="text-[11px] text-slate-400">Verificar cobertura de malha FTTH por CEP e endereço</p>
              </div>
            </div>

            <button
              onClick={() => {
                setCep('01310-100');
                setNumero('1500');
                setBairro('Bela Vista');
                setLogradouro('Av. Paulista');
                setResultado(null);
              }}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Resetar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">CEP</label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-medium">Logradouro</label>
              <input
                type="text"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Número</label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Bairro</label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleConsultar}
                disabled={isConsulting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-950 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>{isConsulting ? 'Consultando OLT / CTO...' : 'Verificar Cobertura'}</span>
              </button>
            </div>
          </div>

          {/* Resultado da Consulta */}
          {resultado && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VIABILIDADE APROVADA</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                  CTO: {resultado.ctoId}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Distância Drop</div>
                  <div className="text-white font-bold text-sm mt-0.5">{resultado.distanciaMetros}m</div>
                  <div className="text-[9px] text-emerald-400">Normal (&lt; 150m)</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Portas Livres</div>
                  <div className="text-cyan-400 font-bold text-sm mt-0.5">{resultado.portasLivres} portas</div>
                  <div className="text-[9px] text-cyan-300">Splitter 1:16</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Atenuação Prevista</div>
                  <div className="text-purple-400 font-bold text-sm mt-0.5">-19.8 dBm</div>
                  <div className="text-[9px] text-purple-300">Margem Ótima</div>
                </div>
              </div>

              <div className="text-xs text-slate-300">
                {resultado.observacao}
              </div>

              {onOpenNovaOSParaEndereco && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onOpenNovaOSParaEndereco({
                      endereco: `${logradouro}, ${numero}`,
                      bairro,
                      ctoId: resultado.ctoId || 'CTO-014',
                      distanciaMetros: resultado.distanciaMetros || 40,
                      sinalDbm: -19.8
                    })}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Agendar O.S. de Instalação Imediata</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Calculadora de Power Budget GPON */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-purple-950 border border-purple-800 text-purple-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Calculadora de Atenuação Óptica</h3>
              <p className="text-[11px] text-slate-400">GPON ITU-T G.984 • Orçamento de Potência</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Distância OLT até Cliente:</span>
                <span className="text-white font-mono">{comprimentoFibraKm} km</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.5"
                value={comprimentoFibraKm}
                onChange={(e) => setComprimentoFibraKm(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Emendas de Fusão no Enlace:</span>
                <span className="text-white font-mono">{qtdFusoes} fusões (0.05 dB un)</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={qtdFusoes}
                onChange={(e) => setQtdFusoes(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Splitter de Distribuição:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSplitterRatio('1:8')}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors cursor-pointer ${
                    splitterRatio === '1:8'
                      ? 'bg-purple-950 text-purple-300 border border-purple-700 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  1:8 (-10.5 dB)
                </button>
                <button
                  onClick={() => setSplitterRatio('1:16')}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors cursor-pointer ${
                    splitterRatio === '1:16'
                      ? 'bg-purple-950 text-purple-300 border border-purple-700 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  1:16 (-13.8 dB)
                </button>
              </div>
            </div>

            {/* Resultado do Cálculo */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Potência RX na ONT:</span>
                <span className={`font-mono font-bold text-sm ${
                  potenciaRecebidaOnt >= -25 && potenciaRecebidaOnt <= -15
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}>
                  {potenciaRecebidaOnt.toFixed(2)} dBm
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    potenciaRecebidaOnt >= -25 && potenciaRecebidaOnt <= -15 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, (1 - (Math.abs(potenciaRecebidaOnt) - 15) / 15) * 100))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Ideal: -18 a -24 dBm</span>
                <span className={potenciaRecebidaOnt >= -25 && potenciaRecebidaOnt <= -15 ? 'text-emerald-400' : 'text-amber-400'}>
                  {potenciaRecebidaOnt >= -25 && potenciaRecebidaOnt <= -15 ? 'Margem Excelente' : 'Atenção ao Enlace'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTOs Planta Óptica Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Inventário de Caixas de Terminação Óptica (CTOs)</h3>
            <p className="text-xs text-slate-400">Monitoramento de portas livres, ocupação e atenuação média</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filtroBairro}
              onChange={(e) => setFiltroBairro(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              <option value="TODOS">Todos os Bairros</option>
              <option value="Campinas">Campinas</option>
              <option value="Jd. das Américas">Jd. das Américas</option>
              <option value="Centro Cívico">Centro Cívico</option>
              <option value="Vila Nova">Vila Nova</option>
              <option value="Bela Vista">Bela Vista</option>
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="OPERACIONAL">Operacional</option>
              <option value="ATENCAO">Quase Esgotada</option>
              <option value="ESGOTADA">Esgotada</option>
            </select>
          </div>
        </div>

        {/* Tabela de CTOs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">CTO / Identificação</th>
                <th className="py-3 px-4">Bairro / Local</th>
                <th className="py-3 px-4">OLT / Porta PON</th>
                <th className="py-3 px-4">Ocupação das Portas</th>
                <th className="py-3 px-4">Sinal Médio</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredCtos.map(c => {
                const percentOcupada = Math.round((c.portasOcupadas / c.portasTotais) * 100);
                const portasLivres = c.portasTotais - c.portasOcupadas;

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white font-mono">
                      <div>{c.id}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{c.nome}</div>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-300">
                      <div>{c.bairro}</div>
                      <div className="text-[10px] text-slate-500">{c.logradouro}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div className="text-white font-medium">{c.ponPort}</div>
                      <div className="text-[10px] text-slate-500">{c.oltNome}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              percentOcupada >= 100
                                ? 'bg-rose-500'
                                : percentOcupada >= 85
                                ? 'bg-amber-500'
                                : 'bg-cyan-500'
                            }`}
                            style={{ width: `${percentOcupada}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-300">
                          {c.portasOcupadas}/{c.portasTotais} ({portasLivres} livres)
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-purple-300 font-bold">{c.sinalMedioDbm} dBm</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'OPERACIONAL'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : c.status === 'ATENCAO'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {c.status === 'OPERACIONAL' ? 'Operacional' : c.status === 'ATENCAO' ? 'Quase Cheia' : 'Esgotada'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => notify(`Leitura óptica de telemetria da ${c.id} atualizada: ${c.sinalMedioDbm} dBm. Nenhuma atenuação anômala detectada.`, 'info')}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-sans font-medium transition-colors cursor-pointer"
                      >
                        Testar Sinal
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
