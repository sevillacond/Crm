import React from 'react';
import { 
  Radio, 
  Sparkles, 
  Search, 
  Menu, 
  ChevronDown,
  Building2,
  Database,
  Bell,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { User, InstanceConfig, Role } from '../types';

interface HeaderProps {
  instance: InstanceConfig;
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  activeTab: string;
  onOpenMaia: () => void;
  onNavigateTab?: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  instance,
  currentUser,
  users,
  onSelectUser,
  activeTab,
  onOpenMaia,
  onNavigateTab,
  searchQuery,
  setSearchQuery,
  onToggleMobileSidebar
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return { category: 'Visão Geral & Indicadores', title: 'Dashboard 360° (PRD Seção 30)' };
      case 'relatorios':
        return { category: 'Business Intelligence', title: 'Relatórios Analíticos & Performance Operacional' };
      case 'kanban':
        return { category: 'CRM Comercial', title: 'Funil de Vendas Kanban' };
      case 'ordens':
        return { category: 'Operações de Campo', title: 'Ordens de Serviço (O.S.) & Ativações FTTH' };
      case 'contatos':
        return { category: 'CRM Comercial', title: 'Clientes & Contatos (PF/PJ)' };
      case 'planos':
        return { category: 'CRM & Produtos', title: 'Catálogo de Produtos & Planos' };
      case 'viabilidade':
        return { category: 'Engenharia de Rede', title: 'Consulta de Viabilidade Técnica CTO (FTTH)' };
      case 'inbox':
        return { category: 'Atendimento Omnichannel', title: 'Inbox Único (WhatsApp, WebChat, E-mail)' };
      case 'supervisor':
        return { category: 'Atendimento & Governança', title: 'Supervisor de Filas, Presença & Monitoria de SLA' };
      case 'canais':
        return { category: 'Canais & Adapters', title: 'Conectividade (WhatsApp Meta/WAHA, WebChat & SGP)' };
      case 'webphone':
        return { category: 'Telefonia & Voz', title: 'WebPhone Nativo (WebRTC / SIP PBX Asterisk)' };
      case 'fluxos':
        return { category: 'Automação & Fluxos', title: 'Flow Builder — Construtor Visual de Atendimento' };
      case 'maia':
        return { category: 'Inteligência & Automação', title: 'Central MaIA Copilot (v3.8 Flash & MCP Gateway)' };
      case 'conhecimento':
        return { category: 'Inteligência & IA', title: 'Base de Conhecimento RAG da MaIA & Procedimentos' };
      case 'campanhas':
        return { category: 'Comunicação & Mensageria', title: 'Campanhas Ativas & Disparos Controlados' };
      case 'cobranca':
        return { category: 'Cobrança & Financeiro', title: 'Gestão de Faturas, Pix & Boletos' };
      case 'auditoria':
        return { category: 'Governança & Segurança', title: 'Trilha de Auditoria & LGPD' };
      case 'instancia':
        return { category: 'Arquitetura & PRD 1.0', title: 'Instância Isolada & Matriz de Requisitos' };
      case 'configuracoes':
        return { category: 'Administração & Parâmetros', title: 'Configurações da Instância, Horários & SLA' };
      case 'ajuda':
        return { category: 'Ajuda & Operações', title: 'Central de Ajuda, Guias & Glossário ISP' };
      default:
        return { category: 'Enlace CRM', title: 'Painel Geral' };
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-900/60 text-purple-300 border border-purple-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">Admin</span>;
      case 'SUPERVISOR':
        return <span className="bg-amber-900/60 text-amber-300 border border-amber-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">Supervisor</span>;
      case 'ATENDENTE':
        return <span className="bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">Comercial</span>;
      case 'TECNICO':
        return <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">Técnico</span>;
      case 'MAIA_AGENT':
        return <span className="bg-blue-900/60 text-blue-300 border border-blue-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">Agente IA</span>;
    }
  };

  const tabInfo = getTabTitle(activeTab);

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
      {/* Top Banner: Instance Isolation Notice */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 sm:px-6 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Instância Isolada:</span>
          </div>
          <span className="text-slate-200 font-semibold">{instance.nomeFantasia}</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="hidden sm:inline">CNPJ: <span className="text-slate-300 font-mono">{instance.cnpj}</span></span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="hidden md:inline font-mono text-[11px] text-slate-400">PostgreSQL 16.2 Dedicado</span>
          <span className="text-slate-600 hidden lg:inline">|</span>
          <span className="hidden lg:inline text-cyan-400 text-[11px]">SGP: {instance.sgpIntegrado}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">{instance.totalCtos} CTOs / {instance.totalPortasDisponiveis} Portas Livres</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1 text-purple-400 font-medium text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MaIA v3.8 Ativa</span>
          </div>
        </div>
      </div>

      {/* Main TopBar */}
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title / Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Abrir Menu Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold leading-none">
              {tabInfo.category}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight mt-0.5">
              {tabInfo.title}
            </h1>
          </div>
        </div>

        {/* Center: Global Omnibar Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por cliente, telefone, CPF, bairro ou CEP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Right Tools & RBAC Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Ajuda & Guias Quick Trigger */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('ajuda')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activeTab === 'ajuda'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800 font-bold shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
              }`}
              title="Central de Ajuda, Guias & Glossário"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Ajuda</span>
            </button>
          )}

          {/* MaIA Quick Trigger */}
          <button
            onClick={onOpenMaia}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md shadow-indigo-950 transition-all cursor-pointer ring-1 ring-white/15"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span className="hidden sm:inline">Co-piloto</span> MaIA
          </button>

          {/* User / Persona Switcher (Crucial for testing RBAC and PRD Role simulation) */}
          <div className="relative group">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-700"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-slate-200 leading-none truncate max-w-[110px]">
                  {currentUser.name.split(' ')[0]}
                </div>
                <div className="mt-1">{getRoleBadge(currentUser.role)}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </div>

            {/* Dropdown Menu to switch active role */}
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50">
              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 mb-1 flex items-center justify-between">
                <span>Simular Operador (RBAC)</span>
                <span className="text-[9px] font-mono text-cyan-400">FASE 0</span>
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={`w-full text-left flex items-center gap-2.5 p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    u.id === currentUser.id
                      ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-800/50'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{u.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{u.department}</div>
                  </div>
                  {getRoleBadge(u.role)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
