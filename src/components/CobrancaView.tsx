import React, { useState } from 'react';
import { 
  DollarSign, 
  Search, 
  QrCode, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  Send
} from 'lucide-react';
import { notify } from '../utils/notify';

interface Fatura {
  id: string;
  clienteNome: string;
  documento: string;
  plano: string;
  valor: number;
  vencimento: string;
  status: 'PAGO' | 'PENDENTE' | 'VENCIDO';
  pixCopiaCola: string;
  codigoBarras: string;
}

export const CobrancaView: React.FC = () => {
  const [search, setSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const faturas: Fatura[] = [
    {
      id: 'fat-9801',
      clienteNome: 'Mariana Silva Costa',
      documento: 'CPF: 123.456.789-00',
      plano: 'Fibra 600 Mega Residencial',
      valor: 119.90,
      vencimento: '10/10/2026',
      status: 'PAGO',
      pixCopiaCola: '00020126580014br.gov.bcb.pix0136enlace-telecom-pix-98015204000053039865405119.905802BR',
      codigoBarras: '23793.38128 60000.000004 01000.000002 1 98010000011990'
    },
    {
      id: 'fat-9802',
      clienteNome: 'Mercado Central do Bairro Ltda',
      documento: 'CNPJ: 12.345.678/0001-90',
      plano: 'Link Dedicado Corporativo 800M',
      valor: 489.90,
      vencimento: '25/09/2026',
      status: 'PENDENTE',
      pixCopiaCola: '00020126580014br.gov.bcb.pix0136enlace-telecom-pix-98025204000053039865405489.905802BR',
      codigoBarras: '23793.38128 60000.000004 01000.000002 1 98020000048990'
    },
    {
      id: 'fat-9803',
      clienteNome: 'Carlos Eduardo Nogueira',
      documento: 'CPF: 987.654.321-11',
      plano: 'Fibra 400 Mega Essencial',
      valor: 99.90,
      vencimento: '20/09/2026',
      status: 'VENCIDO',
      pixCopiaCola: '00020126580014br.gov.bcb.pix0136enlace-telecom-pix-98035204000053039865405099.905802BR',
      codigoBarras: '23793.38128 60000.000004 01000.000002 1 98030000009990'
    },
    {
      id: 'fat-9804',
      clienteNome: 'Dra. Camila Siqueira',
      documento: 'CPF: 456.789.123-22',
      plano: 'Fibra 1 Giga Ultra Gamer',
      valor: 149.90,
      vencimento: '05/10/2026',
      status: 'PENDENTE',
      pixCopiaCola: '00020126580014br.gov.bcb.pix0136enlace-telecom-pix-98045204000053039865405149.905802BR',
      codigoBarras: '23793.38128 60000.000004 01000.000002 1 98040000014990'
    }
  ];

  const handleCopyPix = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filtered = faturas.filter(f => 
    !search || 
    f.clienteNome.toLowerCase().includes(search.toLowerCase()) || 
    f.documento.includes(search) ||
    f.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              PRD Seção 28 • Camada de Cobrança
            </span>
            <span className="text-xs text-slate-400">• Abstração de Pagamentos</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Gestão de Cobranças, Boletos &amp; Pix Dinâmico
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Emissão de 2ª via, geração de links de pagamento instantâneo e sincronização de liquidação via webhooks autorizados.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por cliente, CPF ou fatura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Faturas Grid / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Fatura &amp; Vencimento</th>
                <th className="py-3 px-4">Assinante / Razão Social</th>
                <th className="py-3 px-4">Plano Contratado</th>
                <th className="py-3 px-4">Valor Mensal</th>
                <th className="py-3 px-4">Situação</th>
                <th className="py-3 px-4 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filtered.map(f => (
                <tr key={f.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-white">{f.id.toUpperCase()}</div>
                    <div className="text-[11px] text-slate-400">Vencimento: {f.vencimento}</div>
                  </td>

                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-white">{f.clienteNome}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{f.documento}</div>
                  </td>

                  <td className="py-3.5 px-4 font-sans text-slate-300">
                    {f.plano}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-white">
                    R$ {f.valor.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      f.status === 'PAGO'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : f.status === 'PENDENTE'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {f.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 font-sans">
                      <button
                        onClick={() => handleCopyPix(f.id, f.pixCopiaCola)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                        title="Copiar Código Pix Copia e Cola"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{copiedId === f.id ? 'Pix Copiado!' : 'Pix'}</span>
                      </button>

                      <button
                        onClick={() => notify(`Boleto PDF da fatura ${f.id} baixado com sucesso. Código de barras registrado.`, 'success')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                        title="Baixar Boleto PDF"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Boleto</span>
                      </button>

                      <button
                        onClick={() => notify(`Régua de cobrança enviada via WhatsApp para ${f.clienteNome} com chave Pix Copia e Cola e link de pagamento.`, 'success')}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                        title="Enviar notificação com Pix Copia e Cola no WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
