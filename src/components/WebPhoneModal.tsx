import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  ArrowRightLeft, 
  Delete, 
  Clock, 
  User, 
  Radio, 
  X,
  Volume2
} from 'lucide-react';
import { User as UserType } from '../types';
import { notify } from '../utils/notify';

interface WebPhoneProps {
  currentUser: UserType;
  initialNumber?: string;
  initialName?: string;
  onClose?: () => void;
  isFloating?: boolean;
}

export const WebPhoneModal: React.FC<WebPhoneProps> = ({
  currentUser,
  initialNumber = '',
  initialName = '',
  onClose,
  isFloating = false
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>(initialNumber);
  const [callStatus, setCallStatus] = useState<'IDLE' | 'CALLING' | 'CONNECTED' | 'ON_HOLD'>('IDLE');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callHistory, setCallHistory] = useState([
    { id: '1', name: 'Mariana Silva Costa', number: '(11) 98765-4321', type: 'OUT', duration: '3m 12s', time: '14:25' },
    { id: '2', name: 'Dra. Camila Siqueira', number: '(11) 97711-2233', type: 'IN', duration: '4m 45s', time: '13:50' },
    { id: '3', name: 'Carlos Eduardo Nogueira', number: '(11) 96543-2109', type: 'MISSED', duration: '0s', time: '11:15' }
  ]);

  useEffect(() => {
    let timer: any;
    if (callStatus === 'CONNECTED') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const handleDialDigit = (digit: string) => {
    if (callStatus === 'IDLE') {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const handleStartCall = () => {
    if (!phoneNumber) return;
    setCallStatus('CALLING');
    setTimeout(() => {
      setCallStatus('CONNECTED');
    }, 1800);
  };

  const handleEndCall = () => {
    if (callStatus !== 'IDLE') {
      setCallHistory(prev => [
        {
          id: String(Date.now()),
          name: initialName || 'Chamada Telefônica',
          number: phoneNumber,
          type: 'OUT',
          duration: `${Math.floor(callDuration / 60)}m ${callDuration % 60}s`,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        },
        ...prev
      ]);
    }
    setCallStatus('IDLE');
    setIsMuted(false);
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

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
      isFloating ? 'w-80 fixed bottom-6 right-6 z-50 ring-1 ring-white/10' : 'w-full max-w-md mx-auto'
    }`}>
      {/* Top Header: SIP WebRTC Status */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>WebPhone Nativo</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Ramal SIP: 1004 (Asterisk PBX)
            </div>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Call Display Screen */}
      <div className="p-5 bg-gradient-to-b from-slate-950 to-slate-900 text-center border-b border-slate-800">
        {callStatus === 'IDLE' ? (
          <div>
            <input
              type="text"
              placeholder="Digite o número ou use o teclado..."
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full text-center text-lg font-mono font-bold bg-transparent text-white placeholder-slate-600 focus:outline-none tracking-wider"
            />
            {initialName && (
              <div className="text-xs text-cyan-400 font-medium mt-1 truncate">
                {initialName}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-sm font-bold text-white truncate">
              {initialName || phoneNumber}
            </div>
            <div className="text-xs text-slate-400 font-mono">{phoneNumber}</div>
            <div className="text-lg font-mono font-bold text-cyan-400 pt-1">
              {callStatus === 'CALLING' ? (
                <span className="animate-pulse">Chamando...</span>
              ) : (
                formatDuration(callDuration)
              )}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono">
              Codec: G.711 / Opus (Áudio HD)
            </div>
          </div>
        )}
      </div>

      {/* Controls & Dialpad */}
      {callStatus === 'IDLE' ? (
        <div className="p-4 space-y-4">
          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-2">
            {dialKeys.map(([digit, letters]) => (
              <button
                key={digit}
                onClick={() => handleDialDigit(digit)}
                className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-mono transition-colors flex flex-col items-center justify-center cursor-pointer active:scale-95"
              >
                <span className="text-base font-bold leading-tight">{digit}</span>
                {letters && <span className="text-[8px] text-slate-500 uppercase">{letters}</span>}
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setPhoneNumber(prev => prev.slice(0, -1))}
              disabled={!phoneNumber}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
              title="Apagar"
            >
              <Delete className="w-5 h-5" />
            </button>

            <button
              onClick={handleStartCall}
              disabled={!phoneNumber}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Chamar via SIP</span>
            </button>
          </div>
        </div>
      ) : (
        /* In-Call Controls */
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                isMuted ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="text-[10px] font-medium">{isMuted ? 'Mutado' : 'Mudo'}</span>
            </button>

            <button
              onClick={() => setCallStatus(callStatus === 'ON_HOLD' ? 'CONNECTED' : 'ON_HOLD')}
              className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                callStatus === 'ON_HOLD' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {callStatus === 'ON_HOLD' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span className="text-[10px] font-medium">{callStatus === 'ON_HOLD' ? 'Retomar' : 'Espera'}</span>
            </button>

            <button
              onClick={() => notify('Transferência assistida para Ramal 1002 (Suporte N2) iniciada.', 'info')}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span className="text-[10px] font-medium">Transferir</span>
            </button>
          </div>

          <button
            onClick={handleEndCall}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Encerrar Chamada</span>
          </button>
        </div>
      )}

      {/* Recent CDR History Preview */}
      <div className="bg-slate-950/90 border-t border-slate-800 p-3 max-h-36 overflow-y-auto space-y-1.5">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
          Chamadas Recentes
        </div>
        {callHistory.map(call => (
          <div
            key={call.id}
            onClick={() => setPhoneNumber(call.number)}
            className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer"
          >
            <div className="truncate">
              <span className="font-medium text-slate-200 block truncate">{call.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">{call.number}</span>
            </div>
            <div className="text-right text-[10px] font-mono text-slate-400">
              <div>{call.duration}</div>
              <div className="text-slate-400">{call.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
