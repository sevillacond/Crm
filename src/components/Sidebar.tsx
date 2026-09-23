import React from 'react';
import { 
  Radio, 
  LayoutDashboard, 
  Users, 
  Wifi, 
  Sparkles, 
  ShieldCheck, 
  Server, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  MessageSquare, 
  Database,
  Building2,
  Lock,
  PhoneCall,
  Flame,
  CheckCircle2,
  HelpCircle,
  Workflow,
  Eye,
  Layers,
  BookOpen,
  Send,
  BarChart3,
  Settings,
  Wrench
} from 'lucide-react';
import { User, InstanceConfig, Role } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  instance: InstanceConfig;
  currentUser: User;
  onOpenNewLead: () => void;
  onOpenMaia: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  instance,
  currentUser,
  onOpenNewLead,
  onOpenMaia,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const navSections = [
    {
      group: 'VISÃO GERAL',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard 360°',
          subLabel: 'Métricas & Indicadores',
          icon: LayoutDashboard,
          badge: null
        },
        {
          id: 'relatorios',
          label: 'Relatórios & BI',
          subLabel: 'Métricas & Analytics',
          icon: BarChart3,
          badge: 'BI',
          badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800'
        }
      ]
    },
    {
      group: 'CRM',
      items: [
        {
          id: 'kanban',
          label: 'Kanban',
          subLabel: 'Funil Comercial de Vendas',
          icon: LayoutDashboard,
          badge: '7 Etapas',
          badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800'
        },
        {
          id: 'ordens',
          label: 'Ordens de Serviço (O.S.)',
          subLabel: 'Instalações & Campo FTTH',
          icon: Wrench,
          badge: 'Campo',
          badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800'
        },
        {
          id: 'contatos',
          label: 'Clientes & Contatos',
          subLabel: 'PF, PJ e Histórico 360°',
          icon: Users,
          badge: null
        },
        {
          id: 'planos',
          label: 'Catálogo de Produtos',
          subLabel: 'Planos & Serviços',
          icon: Wifi,
          badge: null
        },
        {
          id: 'viabilidade',
          label: 'Viabilidade Técnica',
          subLabel: 'Cobertura & Malha FTTH',
          icon: Radio,
          badge: 'Adapter',
          badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
        }
      ]
    },
    {
      group: 'ATENDIMENTO OMNICHANNEL',
      items: [
        {
          id: 'inbox',
          label: 'Inbox Unificado',
          subLabel: 'WhatsApp, WebChat, E-mail',
          icon: MessageSquare,
          badge: 'Core',
          badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
        },
        {
          id: 'supervisor',
          label: 'Supervisor & Filas',
          subLabel: 'Monitoria ao Vivo & SLA',
          icon: Eye,
          badge: 'SLA',
          badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
        },
        {
          id: 'canais',
          label: 'Canais & Adapters',
          subLabel: 'WhatsApp, WebChat & SGP',
          icon: Layers,
          badge: 'API',
          badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
        },
        {
          id: 'webphone',
          label: 'WebPhone',
          subLabel: 'WebRTC / PBX SIP Asterisk',
          icon: PhoneCall,
          badge: 'Voz',
          badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800'
        },
        {
          id: 'fluxos',
          label: 'Fluxos (Flow Builder)',
          subLabel: 'Automação Visual Nativa',
          icon: Workflow,
          badge: 'Visual',
          badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
        }
      ]
    },
    {
      group: 'INTELIGÊNCIA & MAIA',
      items: [
        {
          id: 'maia',
          label: 'Central MaIA',
          subLabel: 'Autonomia N1-N4 & MCP Tools',
          icon: Sparkles,
          badge: 'v3.8 Flash',
          badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
        },
        {
          id: 'conhecimento',
          label: 'Base de Conhecimento',
          subLabel: 'RAG, Procedimentos & FAQ',
          icon: BookOpen,
          badge: 'RAG',
          badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
        }
      ]
    },
    {
      group: 'GESTÃO & GOVERNANÇA',
      items: [
        {
          id: 'campanhas',
          label: 'Campanhas & Disparos',
          subLabel: 'Templates HSM & Opt-out',
          icon: Send,
          badge: null
        },
        {
          id: 'cobranca',
          label: 'Cobrança & Financeiro',
          subLabel: 'Pix, Boletos & Vencimentos',
          icon: Database,
          badge: null
        },
        {
          id: 'auditoria',
          label: 'Auditoria & LGPD',
          subLabel: 'Logs Imutáveis de Ações',
          icon: ShieldCheck,
          badge: 'Segurança',
          badgeColor: 'bg-slate-800 text-slate-300 border-slate-700'
        },
        {
          id: 'instancia',
          label: 'Instância & PRD 1.0',
          subLabel: 'Uma Empresa = Uma Instância',
          icon: Server,
          badge: 'Isolado',
          badgeColor: 'bg-blue-950 text-blue-300 border-blue-800'
        },
        {
          id: 'configuracoes',
          label: 'Configurações',
          subLabel: 'Parâmetros, Horários & SLA',
          icon: Settings,
          badge: null
        }
      ]
    }
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-900/70 text-purple-300 border border-purple-700/60 text-[10px] font-semibold px-2 py-0.5 rounded-full">Admin</span>;
      case 'SUPERVISOR':
        return <span className="bg-amber-900/70 text-amber-300 border border-amber-700/60 text-[10px] font-semibold px-2 py-0.5 rounded-full">Supervisor</span>;
      case 'ATENDENTE':
        return <span className="bg-cyan-900/70 text-cyan-300 border border-cyan-700/60 text-[10px] font-semibold px-2 py-0.5 rounded-full">Comercial</span>;
      case 'TECNICO':
        return <span className="bg-emerald-900/70 text-emerald-300 border border-emerald-700/60 text-[10px] font-semibold px-2 py-0.5 rounded-full">Técnico</span>;
      case 'MAIA_AGENT':
        return <span className="bg-blue-900/70 text-blue-300 border border-blue-700/60 text-[10px] font-semibold px-2 py-0.5 rounded-full">Agente IA</span>;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#070b18] border-r border-slate-800/90 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-72'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header: Brand & Collapse Toggle */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0 bg-slate-950/70">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-950 ring-1 ring-white/10 shrink-0">
              <Radio className="w-5 h-5 text-white" />
            </div>

            {!collapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-black tracking-tight text-white leading-none">
                    ENLACE<span className="text-cyan-400 font-light ml-0.5">CRM</span>
                  </h1>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    ISP
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {instance.nomeFantasia}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white items-center justify-center transition-colors cursor-pointer shrink-0"
            title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Button: Quick Lead Creation */}
        <div className="p-3 shrink-0">
          {collapsed ? (
            <button
              onClick={onOpenNewLead}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center justify-center shadow-lg shadow-cyan-950/50 cursor-pointer transition-all"
              title="Novo Lead / Proposta Comercial"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onOpenNewLead}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all ring-1 ring-white/15"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Lead / Oportunidade</span>
            </button>
          )}
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-2 pb-1.5 text-[10px] font-mono font-semibold tracking-wider text-slate-300 uppercase">
                  {section.group}
                </div>
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full text-left rounded-xl transition-all flex items-center gap-3 cursor-pointer group relative ${
                      collapsed ? 'p-3 justify-center' : 'px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-cyan-950/80 text-white font-semibold border border-cyan-700/60 shadow-md shadow-cyan-950/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                    }`}
                    title={collapsed ? `${item.label} (${item.subLabel})` : undefined}
                  >
                    {/* Active Accent Bar when Collapsed */}
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full" />
                    )}

                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive 
                          ? 'text-cyan-400' 
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    {!collapsed && (
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                        <div className="truncate">
                          <div className="text-xs leading-none truncate">{item.label}</div>
                          <div className="text-[10px] text-slate-300 truncate mt-1">
                            {item.subLabel}
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 font-medium ${
                              item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Special Shortcut: Open MaIA Copilot Dialog */}
          <div className="pt-2 border-t border-slate-800/80">
            {collapsed ? (
              <button
                onClick={onOpenMaia}
                className="w-full p-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-300 flex items-center justify-center cursor-pointer transition-colors"
                title="Abrir Terminal MaIA Co-piloto"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
              </button>
            ) : (
              <button
                onClick={onOpenMaia}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-950/70 to-indigo-950/70 hover:from-purple-900/80 hover:to-indigo-900/80 border border-purple-800/60 text-purple-200 flex items-center gap-3 cursor-pointer transition-all shadow-md group"
              >
                <div className="p-1.5 rounded-lg bg-purple-900 text-purple-300 border border-purple-700 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Co-piloto MaIA</span>
                    <span className="text-[9px] font-mono bg-purple-900/90 text-purple-300 px-1.5 py-0.2 rounded border border-purple-700">
                      Flash
                    </span>
                  </div>
                  <div className="text-[10px] text-purple-300 truncate mt-0.5">
                    Consultar viabilidade, planos &amp; OS
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Footer: Instance & Active User Status */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 shrink-0 space-y-2.5">
          {!collapsed && (
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Instância Dedicada
                </span>
                <span className="font-mono text-[10px] text-slate-400">v1.2</span>
              </div>
              <div className="text-slate-300 font-mono text-[10px] truncate">
                CNPJ: {instance.cnpj}
              </div>
              <div className="text-cyan-400 font-mono text-[10px] truncate">
                PostgreSQL • {instance.sgpIntegrado}
              </div>
            </div>
          )}

          {/* Operator Profile Preview */}
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover border border-slate-700 ring-1 ring-cyan-500/20"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate leading-tight">
                  {currentUser.name}
                </div>
                <div className="mt-0.5">{getRoleBadge(currentUser.role)}</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
