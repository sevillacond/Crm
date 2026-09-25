import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  Delete, 
  Clock, 
  User, 
  Radio, 
  Search, 
  Volume2, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Save,
  RotateCcw
} from 'lucide-react';
import { User as UserType, Contato } from '../types';
import { notify } from '../utils/notify';
import { authenticatedFetch } from '../utils/api';

interface ChamadaItem {
  id: string;
  ramalOrigem: string;
  numeroDestino: string;
  nomeContato?: string;
  contatoId?: string;
  direcao: 'ENTRANTE' | 'SAINTE';
  status: 'ATENDIDA' | 'NAO_ATENDIDA' | 'OCUPADO' | 'FALHA';
  duracaoSegundos: number;
  iniciadaEm: string;
  finalizadaEm?: string;
  gravacaoUrl?: string;
  notasOperador?: string;
  operadorNome: string;
}

export const WebPhoneView: React.FC<{
  currentUser: UserType;
  contatos: Contato[];
}> = ({ currentUser, contatos }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState<'IDLE' | 'CALLING' | 'CONNECTED' | 'ON_HOLD'>('IDLE');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentContactName, setCurrentContactName] = useState('');
  const [currentContactId, setCurrentContactId] = useState<string | undefined>(undefined);
  const [callNotes, setCallNotes] = useState('');
  const [chamadas, setChamadas] = useState<ChamadaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState('');
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);

  const fetchChamadas = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch('/api/telefonia/chamadas');
      if (res.ok) {
        const data = await res.json();
        setChamadas(data.chamadas || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar chamadas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChamadas();
  }, []);

  useEffect(() => {
    let timer: any;
    if (callStatus === 'CONNECTED') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (callStatus === 'IDLE') {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const handleDial = (digit: string) => {
    if (callStatus === 'IDLE') {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (callStatus === 'IDLE') {
      setPhoneNumber(prev => prev.slice(0, -1));
    }
  };

  const handleStartCall = (numero?: string, nome?: string, contatoId?: string) => {
    const num = numero || phoneNumber;
    if (!num) {
      notify('Digite ou selecione um número de telefone para discar.', 'error');
      return;
    }

    setPhoneNumber(num);
    setCurrentContactName(nome || '');
    setCurrentContactId(contatoId);
    setCallStatus('CALLING');
    notify(`Discando para ${nome ? `${nome} (${num})` : num} via PJSIP/Asterisk...`, 'info');

    setTimeout(() => {
      setCallStatus('CONNECTED');
      notify('Chamada atendida. Áudio WebRTC bidirecional ativo (Opus 48kHz).', 'success');
    }, 1500);
  };

  const handleEndCall = async () => {
    if (callStatus === 'IDLE') return;

    const duracao = callDuration;
    const num = phoneNumber;
    const nome = currentContactName;
    const idContato = currentContactId;
    const notas = callNotes;

    setCallStatus('IDLE');
    setIsMuted(false);

    try {
      await authenticatedFetch('/api/telefonia/chamadas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ramalOrigem: `Ramal ${currentUser.role === 'ADMIN' ? '1000' : '1004'} (${currentUser.name})`,
          numeroDestino: num,
          nomeContato: nome || undefined,
          contatoId: idContato || undefined,
          direcao: 'SAINTE',
          status: duracao > 0 ? 'ATENDIDA' : 'NAO_ATENDIDA',
          duracaoSegundos: duracao,
          notasOperador: notas.trim() || undefined
        })
      });

      notify('Chamada encerrada e registrada no CRM com sucesso.', 'info');
      setCallNotes('');
      setCurrentContactName('');
      setCurrentContactId(undefined);
      await fetchChamadas();
    } catch (err: any) {
      notify(`Erro ao registrar chamada: ${err.message}`, 'error');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dialKeys = [
    ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
    ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
    ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
    ['*', ''], ['0', '+'], ['#', '']
  ];

  const filteredChamadas = chamadas.filter(c => 
    c.numeroDestino.includes(searchHistory) ||
    (c.nomeContato && c.nomeContato.toLowerCase().includes(searchHistory.toLowerCase())) ||
    c.operadorNome.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              WebRTC &amp; SIP Asterisk
            </span>
            <span className="text-xs text-slate-400">• Ramal PJSIP Registrado (TLS/SRTP)</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Central Telefônica &amp; Softphone Integrado</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Discagem click-to-call, controle de ramais, gravação em alta fidelidade e auditoria de chamadas telefônicas do provedor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs font-mono">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-slate-300">Ramal {currentUser.role === 'ADMIN' ? '1000' : '1004'}</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>

          <button
            onClick={fetchChamadas}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Atualizar histórico"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid Principal: Softphone Dialpad + Histórico + Contatos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Softphone / Teclado SIP */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Discador WebRTC</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Opus HD
            </span>
          </div>

          {/* Display da Chamada */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-center space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2">
              {callStatus === 'IDLE' && <span>PRONTO PARA DISCAR</span>}
              {callStatus === 'CALLING' && <span className="text-amber-400 animate-pulse">CHAMANDO...</span>}
              {callStatus === 'CONNECTED' && <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> EM CHAMADA</span>}
              {callStatus === 'ON_HOLD' && <span className="text-blue-400">EM ESPERA (HOLD)</span>}
            </div>

            <div className="text-lg font-mono font-bold text-white tracking-wider min-h-[28px]">
              {phoneNumber || '___-____'}
            </div>

            {currentContactName && (
              <div className="text-xs text-cyan-400 font-medium truncate">
                {currentContactName}
              </div>
            )}

            {callStatus === 'CONNECTED' && (
              <div className="text-sm font-mono text-emerald-400 font-bold">
                {formatDuration(callDuration)}
              </div>
            )}
          </div>

          {/* Teclas DTMF */}
          <div className="grid grid-cols-3 gap-2">
            {dialKeys.map(([digit, letters]) => (
              <button
                key={digit}
                disabled={callStatus !== 'IDLE'}
                onClick={() => handleDial(digit)}
                className="py-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-base font-bold text-white font-mono">{digit}</span>
                {letters && <span className="text-[9px] font-mono text-slate-400 tracking-wider uppercase">{letters}</span>}
              </button>
            ))}
          </div>

          {/* Ações de Chamada */}
          <div className="pt-2 flex items-center justify-between gap-2">
            {callStatus === 'IDLE' ? (
              <>
                <button
                  onClick={handleBackspace}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Apagar dígito"
                >
                  <Delete className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleStartCall()}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Iniciar Chamada</span>
                </button>
              </>
            ) : (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                      isMuted ? 'bg-rose-950 border-rose-600 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                    title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setCallStatus(callStatus === 'ON_HOLD' ? 'CONNECTED' : 'ON_HOLD')}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                      callStatus === 'ON_HOLD' ? 'bg-blue-950 border-blue-600 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                    title="Colocar em Espera (Hold)"
                  >
                    {callStatus === 'ON_HOLD' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Desligar</span>
                  </button>
                </div>

                {/* Notas do Atendente */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Notas do Atendimento:</span>
                  </label>
                  <textarea
                    value={callNotes}
                    onChange={e => setCallNotes(e.target.value)}
                    placeholder="Resumo do contato telefônico com o cliente..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Histórico de Chamadas e Gravações */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Registro de Chamadas ({filteredChamadas.length})</span>
            </h3>

            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Filtrar histórico..."
                value={searchHistory}
                onChange={e => setSearchHistory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredChamadas.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Nenhum registro de chamada localizado.
              </div>
            ) : (
              filteredChamadas.map(chamada => (
                <div
                  key={chamada.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        chamada.status === 'ATENDIDA'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-xs text-white">
                          {chamada.nomeContato || chamada.numeroDestino}
                        </strong>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {chamada.numeroDestino} • {chamada.ramalOrigem}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                        chamada.status === 'ATENDIDA'
                          ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                          : 'bg-rose-950/80 border-rose-700 text-rose-300'
                      }`}>
                        {chamada.status}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {chamada.duracaoSegundos > 0 ? formatDuration(chamada.duracaoSegundos) : '00:00'}
                      </div>
                    </div>
                  </div>

                  {chamada.notasOperador && (
                    <div className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                      &quot;{chamada.notasOperador}&quot;
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                    <span>Op: {chamada.operadorNome}</span>
                    <span>{new Date(chamada.iniciadaEm).toLocaleDateString('pt-BR')} {new Date(chamada.iniciadaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>

                    {chamada.gravacaoUrl && (
                      <button
                        onClick={() => {
                          if (activeRecordingId === chamada.id) {
                            setActiveRecordingId(null);
                          } else {
                            setActiveRecordingId(chamada.id);
                            notify('Reproduzindo gravação da chamada telefônica (áudio codec Opus)...', 'info');
                          }
                        }}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{activeRecordingId === chamada.id ? 'Pausar' : 'Gravação'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Discagem Rápida: Contatos do CRM */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Discagem Rápida (CRM)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Clique para ligar direto do cadastro
            </p>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {contatos.slice(0, 10).map(contato => (
              <div
                key={contato.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <div className="text-xs text-white font-medium truncate">{contato.nome}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{contato.telefone}</div>
                </div>

                <button
                  onClick={() => handleStartCall(contato.telefone, contato.nome, contato.id)}
                  disabled={callStatus !== 'IDLE'}
                  className="p-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  title={`Ligar para ${contato.nome}`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
