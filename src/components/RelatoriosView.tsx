import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  PhoneCall, 
  MessageSquare, 
  Sparkles, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Layers,
  Filter,
  Wrench
} from 'lucide-react';
import { Deal, Contato } from '../types';
import { notify } from '../utils/notify';

interface RelatoriosViewProps {
  deals: Deal[];
  contatos: Contato[];
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({ deals, contatos }) => {
  const [periodo, setPeriodo] = useState<'HOJE' | '7D' | '30D' | 'MES_ATUAL'>('30D');
  const [categoria, setCategoria] = useState<'ATENDIMENTO' | 'MAIA' | 'COMERCIAL' | 'TELEFONIA' | 'CAMPO'>('ATENDIMENTO');

  const totalAtendimentos = 1248;
  const tmeMedio = '1m 24s';
  const tmaMedio = '7m 18s';
  const slaGlobal = 97.4;
  const maiaResolucao = 68.2; // % resolvidas sem humano
  const mrrTotal = deals.reduce((acc, d) => acc + (d.etapa !== 'PERDIDO' ? d.valorMensal : 0), 0);
  const totalGanhos = deals.filter(d => d.etapa === 'GANHO').length;
  const taxaConversao = deals.length > 0 ? Math.round((totalGanhos / deals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              PRD Seções 29 &amp; 30 • Business Intelligence &amp; Métricas
            </span>
            <span className="text-xs text-slate-400">• Dados Consolidados da Instância</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Relatórios Analíticos &amp; Performance Operacional
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Indicadores de atendimento omnichannel, resolutividade autônoma da MaIA, conversão do funil de vendas e volumetria de telefonia SIP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {[
              { id: 'HOJE', label: 'Hoje' },
              { id: '7D', label: '7 Dias' },
              { id: '30D', label: '30 Dias' },
              { id: 'MES_ATUAL', label: 'Mês Atual' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  periodo === p.id ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => notify('Exportação de relatório consolidado em formato CSV gerada com sucesso.', 'success')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setCategoria('ATENDIMENTO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            categoria === 'ATENDIMENTO'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Atendimento &amp; SLA</span>
        </button>
        <button
          onClick={() => setCategoria('MAIA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            categoria === 'MAIA'
              ? 'bg-purple-950 text-purple-300 border border-purple-800 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Inteligência MaIA</span>
        </button>
        <button
          onClick={() => setCategoria('COMERCIAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            categoria === 'COMERCIAL'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Funil Comercial &amp; Vendas</span>
        </button>
        <button
          onClick={() => setCategoria('TELEFONIA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            categoria === 'TELEFONIA'
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Telefonia SIP &amp; WebPhone</span>
        </button>
        <button
          onClick={() => setCategoria('CAMPO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            categoria === 'CAMPO'
              ? 'bg-amber-950 text-amber-300 border border-amber-800 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Instalações &amp; O.S. FTTH</span>
        </button>
      </div>

      {/* METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Volume Total</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalAtendimentos}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% vs período anterior</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Cumprimento de SLA</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{slaGlobal}%</div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Meta operacional: 95.0%
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Resolução Direta MaIA</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-300 font-mono">{maiaResolucao}%</div>
          <div className="text-[11px] text-purple-400 font-mono mt-1">
            Sem necessidade de transbordo humano
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>MRR em Oportunidades</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            R$ {mrrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Taxa de Conversão: <strong className="text-white">{taxaConversao}%</strong>
          </div>
        </div>
      </div>

      {/* DETAILED CATEGORY VIEW */}
      {categoria === 'ATENDIMENTO' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Distribuição de Conversas por Canal</span>
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>WhatsApp Oficial (Meta Cloud API)</span>
                  <span className="font-bold">894 (71.6%)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '71.6%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>WebChat Nativo no Site</span>
                  <span className="font-bold">242 (19.4%)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '19.4%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Telefonia SIP (Voz)</span>
                  <span className="font-bold">82 (6.6%)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '6.6%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>E-mail &amp; Formulários</span>
                  <span className="font-bold">30 (2.4%)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2">
                  <div className="bg-slate-500 h-2 rounded-full" style={{ width: '2.4%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Tempos Operacionais Médios (TME &amp; TMA)</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-xs text-slate-400 font-mono">TME (Tempo Médio Espera)</div>
                <div className="text-2xl font-extrabold text-white font-mono my-1">{tmeMedio}</div>
                <div className="text-[10px] text-emerald-400 font-mono">-18s vs semana anterior</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-xs text-slate-400 font-mono">TMA (Tempo Médio Atend.)</div>
                <div className="text-2xl font-extrabold text-white font-mono my-1">{tmaMedio}</div>
                <div className="text-[10px] text-cyan-400 font-mono">Dentro da meta (&lt;8m)</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono">
              <div className="font-bold text-white mb-1">Pico de Horário de Contato:</div>
              Segunda a Sexta das 09:30 às 11:45 e das 14:00 às 16:30.
            </div>
          </div>
        </div>
      )}

      {categoria === 'MAIA' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Níveis de Autonomia (N1 a N4)</span>
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between font-bold text-white">
                  <span>Nível 1 (FAQ &amp; Catálogo)</span>
                  <span className="text-purple-300">42%</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Dúvidas gerais, planos e cobertura</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between font-bold text-white">
                  <span>Nível 2 (Consultas SGP)</span>
                  <span className="text-purple-300">26%</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Faturas, status de conexão e contratos</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between font-bold text-white">
                  <span>Nível 3 (Ações &amp; Tools)</span>
                  <span className="text-purple-300">18%</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Geração de Pix e criação de leads</div>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/60">
                <div className="flex justify-between font-bold text-purple-200">
                  <span>Nível 4 (Handoff Humano)</span>
                  <span className="text-purple-300">14%</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Transferência contextualizada para operadores</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Principais Motivos de Transbordo Humano (Handoff N4)</h3>
            <div className="space-y-2.5 text-xs font-mono">
              {[
                { motivo: 'Negociação especial de desconto ou combo corporativo', perc: '41%' },
                { motivo: 'Rompimento de fibra física ou necessidade de técnico no local', perc: '29%' },
                { motivo: 'Cancelamento formal de assinatura (retenção)', perc: '18%' },
                { motivo: 'Cliente expressou preferência explícita por humano', perc: '12%' }
              ].map(m => (
                <div key={m.motivo} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">{m.motivo}</span>
                  <span className="font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                    {m.perc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {categoria === 'COMERCIAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Distribuição dos Deals por Etapa do Funil</h3>
            <div className="space-y-2 text-xs font-mono">
              {['NOVO_LEAD', 'QUALIFICACAO', 'VIABILIDADE', 'PROPOSTA', 'NEGOCIACAO', 'CONTRATO_ENVIADO', 'GANHO'].map(etapa => {
                const count = deals.filter(d => d.etapa === etapa).length;
                const mrr = deals.filter(d => d.etapa === etapa).reduce((acc, d) => acc + d.valorMensal, 0);
                return (
                  <div key={etapa} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{etapa.replace('_', ' ')}</div>
                      <div className="text-[11px] text-slate-400">{count} Oportunidades</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">R$ {mrr.toFixed(2)}/mês</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Planos Mais Contratados</h3>
            <div className="space-y-2.5 text-xs font-mono">
              {[
                { plano: 'Fibra 600 Mega Residencial (Wi-Fi 6 Mesh)', contratos: 34, mrr: 'R$ 4.416,60' },
                { plano: 'Fibra 400 Mega Residencial', contratos: 28, mrr: 'R$ 2.797,20' },
                { plano: 'Link Dedicado 1 Giga PME (IP Fixo)', contratos: 8, mrr: 'R$ 3.192,00' },
                { plano: 'Fibra 1 Giga Ultra (Wi-Fi 6 Duplo)', contratos: 6, mrr: 'R$ 1.079,40' }
              ].map(p => (
                <div key={p.plano} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{p.plano}</div>
                    <div className="text-[11px] text-slate-400">{p.contratos} Ativações</div>
                  </div>
                  <div className="text-emerald-400 font-bold">{p.mrr}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {categoria === 'TELEFONIA' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-indigo-400" />
            <span>Métricas de Chamadas WebRTC SIP Asterisk</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Total Chamadas Realizadas</div>
              <div className="text-2xl font-extrabold text-white my-1">318</div>
              <div className="text-[10px] text-emerald-400">Taxa de atendimento: 92.1%</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Duração Média das Ligações</div>
              <div className="text-2xl font-extrabold text-indigo-300 my-1">3m 45s</div>
              <div className="text-[10px] text-slate-400">Dentro da meta comercial</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Gravações SIP Armazenadas</div>
              <div className="text-2xl font-extrabold text-cyan-300 my-1">100%</div>
              <div className="text-[10px] text-emerald-400">Compliance &amp; LGPD auditado</div>
            </div>
          </div>
        </div>
      )}

      {categoria === 'CAMPO' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-center">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="text-xs text-slate-400">Taxa First-Time Right</div>
              <div className="text-2xl font-extrabold text-emerald-400 my-1">94.6%</div>
              <div className="text-[10px] text-slate-400">Sucesso na 1ª visita</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="text-xs text-slate-400">Metragem Média Drop</div>
              <div className="text-2xl font-extrabold text-cyan-300 my-1">38.5 m</div>
              <div className="text-[10px] text-slate-400">Meta: &lt; 80 metros</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="text-xs text-slate-400">Potência Óptica Média</div>
              <div className="text-2xl font-extrabold text-purple-300 my-1">-19.4 dBm</div>
              <div className="text-[10px] text-emerald-400">Dentro da janela Classe B+</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="text-xs text-slate-400">Tempo Médio Instalação</div>
              <div className="text-2xl font-extrabold text-amber-300 my-1">1h 12m</div>
              <div className="text-[10px] text-slate-400">Passagem, fusão e Wi-Fi</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white">Produtividade dos Técnicos FTTH</h3>
              <div className="space-y-2.5 text-xs font-mono">
                {[
                  { nome: 'Marcos Ferraz', os: 42, sla: '98%', nota: '4.9 ★' },
                  { nome: 'Lucas Silveira', os: 38, sla: '96%', nota: '4.8 ★' },
                  { nome: 'Gabriel Santos', os: 31, sla: '95%', nota: '4.7 ★' },
                  { nome: 'Equipe Terceirizada Alpha', os: 18, sla: '91%', nota: '4.5 ★' }
                ].map(t => (
                  <div key={t.nome} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{t.nome}</div>
                      <div className="text-[11px] text-slate-400">{t.os} Instalações Concluídas</div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        {t.sla} SLA
                      </span>
                      <span className="text-amber-400 font-bold">
                        {t.nota}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white">Bairros com Maior Volume de Ativações</h3>
              <div className="space-y-2.5 text-xs font-mono">
                {[
                  { bairro: 'Campinas (Área Central e Entorno)', cto: 'CTO-CAM-014', os: 48, pct: '38%' },
                  { bairro: 'Jd. das Américas', cto: 'CTO-JAR-008', os: 35, pct: '27%' },
                  { bairro: 'Centro Cívico', cto: 'CTO-CEN-002', os: 26, pct: '21%' },
                  { bairro: 'Vila Nova (Expansão)', cto: 'CTO-VIL-021', os: 18, pct: '14%' }
                ].map(b => (
                  <div key={b.bairro} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{b.bairro}</div>
                      <div className="text-[11px] text-slate-400">Hub: {b.cto} • {b.os} ativações</div>
                    </div>
                    <span className="font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {b.pct}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
