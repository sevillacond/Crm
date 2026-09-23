import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InboxView } from './components/InboxView';
import { WebPhoneModal } from './components/WebPhoneModal';
import { FlowBuilderView } from './components/FlowBuilderView';
import { SupervisorView } from './components/SupervisorView';
import { CanaisIntegracoesView } from './components/CanaisIntegracoesView';
import { BaseConhecimentoView } from './components/BaseConhecimentoView';
import { CampanhasView } from './components/CampanhasView';
import { RelatoriosView } from './components/RelatoriosView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { CobrancaView } from './components/CobrancaView';
import { KanbanBoard } from './components/KanbanBoard';
import { ContatosList } from './components/ContatosList';
import { ViabilidadeModal } from './components/ViabilidadeModal';
import { NovoLeadModal } from './components/NovoLeadModal';
import { MaiaCopilotModal } from './components/MaiaCopilotModal';
import { AuditView } from './components/AuditView';
import { InstanceView } from './components/InstanceView';
import { PlanosCatalog } from './components/PlanosCatalog';
import { OrdensServicoView } from './components/OrdensServicoView';
import { ViabilidadeView } from './components/ViabilidadeView';
import { 
  INITIAL_INSTANCE, 
  INITIAL_USERS, 
  INITIAL_PLANOS, 
  INITIAL_CONTATOS, 
  INITIAL_DEALS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_ORDENS_SERVICO
} from './data/mockData';
import { 
  User, 
  InstanceConfig, 
  Plano, 
  Contato, 
  Deal, 
  AuditLog, 
  DealEtapa, 
  ViabilidadeConsulta,
  OrdemServico
} from './types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [instance, setInstance] = useState<InstanceConfig>(INITIAL_INSTANCE);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[2]); // Lucas Mendes (Comercial)
  const [planos, setPlanos] = useState<Plano[]>(INITIAL_PLANOS);
  const [contatos, setContatos] = useState<Contato[]>(INITIAL_CONTATOS);
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>(INITIAL_ORDENS_SERVICO);

  const [activeTab, setActiveTab] = useState<string>('kanban');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Modals
  const [isNovoLeadOpen, setIsNovoLeadOpen] = useState(false);
  const [isViabilidadeOpen, setIsViabilidadeOpen] = useState(false);
  const [viabilidadeTargetContato, setViabilidadeTargetContato] = useState<Contato | null>(null);
  const [isMaiaOpen, setIsMaiaOpen] = useState(false);
  const [maiaTargetDeal, setMaiaTargetDeal] = useState<Deal | null>(null);
  const [maiaTargetContato, setMaiaTargetContato] = useState<Contato | null>(null);
  const [floatingPhone, setFloatingPhone] = useState<{ open: boolean; phone: string; name: string }>({
    open: false,
    phone: '',
    name: ''
  });

  // Toast notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const handleToastEvent = (e: any) => {
      if (e.detail?.message) {
        showToast(e.detail.message, e.detail.type || 'info');
      }
    };
    window.addEventListener('enlace-notify', handleToastEvent);
    return () => window.removeEventListener('enlace-notify', handleToastEvent);
  }, []);

  // Fetch initial data from server API
  const refreshData = async () => {
    try {
      const [resInst, resDeals, resContatos, resAudit] = await Promise.all([
        fetch('/api/instance').then(r => r.ok ? r.json() : null),
        fetch('/api/deals').then(r => r.ok ? r.json() : null),
        fetch('/api/contatos').then(r => r.ok ? r.json() : null),
        fetch('/api/audit').then(r => r.ok ? r.json() : null)
      ]);

      if (resInst) setInstance(resInst);
      if (resDeals) setDeals(resDeals);
      if (resContatos) setContatos(resContatos);
      if (resAudit) setAuditLogs(resAudit);
    } catch (e) {
      console.warn('API sync fallback to local storage state:', e);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handle Stage Movement in Kanban
  const handleMoveDealStage = async (dealId: string, targetStage: DealEtapa) => {
    try {
      const res = await fetch(`/api/deals/${dealId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etapa: targetStage,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setDeals(prev => prev.map(d => d.id === dealId ? updated : d));
        showToast(`Negócio movido para "${targetStage.replace('_', ' ')}" com sucesso!`);
        refreshData();
      } else {
        throw new Error('Falha na resposta do servidor');
      }
    } catch (err) {
      // Local fallback
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, etapa: targetStage } : d));
      showToast(`Negócio movido para "${targetStage}"`, 'info');
    }
  };

  // Handle New Lead and Initial Deal Creation
  const handleCreateNewLead = async (formData: any) => {
    try {
      const resContato = await fetch('/api/contatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role
        })
      });

      if (!resContato.ok) throw new Error('Falha ao criar contato');
      const newContato: Contato = await resContato.json();

      const planoEscolhido = planos.find(p => p.id === formData.planoId) || planos[0];
      const resDeal = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: `${planoEscolhido.nome} - ${newContato.nome}`,
          contatoId: newContato.id,
          planoId: planoEscolhido.id,
          etapa: 'NOVO_LEAD',
          valorMensal: planoEscolhido.precoMensal,
          taxaAdesao: planoEscolhido.adesao,
          responsavelId: currentUser.id,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role
        })
      });

      if (!resDeal.ok) throw new Error('Falha ao criar negócio');
      const newDeal: Deal = await resDeal.json();

      setContatos(prev => [newContato, ...prev]);
      setDeals(prev => [newDeal, ...prev]);
      setIsNovoLeadOpen(false);
      showToast(`Lead "${newContato.nome}" cadastrado e adicionado ao Kanban!`);
      refreshData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao cadastrar lead', 'error');
    }
  };

  // Handle Feasibility Result Applied
  const handleApplyViabilidade = (result: ViabilidadeConsulta, contatoId?: string) => {
    if (contatoId) {
      setContatos(prev => prev.map(c => {
        if (c.id === contatoId) {
          return {
            ...c,
            status: result.viavel ? 'VIAVEL' : 'INVIAVEL',
            scoreMaia: result.viavel ? Math.max(c.scoreMaia || 80, 90) : 35
          };
        }
        return c;
      }));

      setDeals(prev => prev.map(d => {
        if (d.contatoId === contatoId) {
          return {
            ...d,
            statusViabilidade: result.viavel ? 'VIAVEL_CTO' : 'INVIAVEL',
            ctoProxima: result.ctoId,
            distanciaMetros: result.distanciaMetros,
            etapa: result.viavel && d.etapa === 'NOVO_LEAD' ? 'VIABILIDADE' : d.etapa
          };
        }
        return d;
      }));

      showToast(result.viavel ? 'Viabilidade CTO aprovada e registrada!' : 'Endereço marcado como inviável.');
      refreshData();
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex font-sans antialiased">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
          notification.type === 'success'
            ? 'bg-emerald-950/95 border-emerald-700 text-emerald-200'
            : notification.type === 'error'
            ? 'bg-rose-950/95 border-rose-700 text-rose-200'
            : 'bg-cyan-950/95 border-cyan-700 text-cyan-200'
        }`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        instance={instance}
        currentUser={currentUser}
        onOpenNewLead={() => setIsNovoLeadOpen(true)}
        onOpenMaia={() => {
          setMaiaTargetDeal(null);
          setMaiaTargetContato(null);
          setIsMaiaOpen(true);
        }}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Workspace Wrapper (shifts right when sidebar is open/collapsed on lg screens) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}>
        {/* Main Header with Instance Isolation Bar & RBAC Switcher */}
        <Header
          instance={instance}
          currentUser={currentUser}
          users={users}
          onSelectUser={(u) => {
            setCurrentUser(u);
            showToast(`Operando agora como: ${u.name} (${u.role})`, 'info');
          }}
          activeTab={activeTab}
          onOpenMaia={() => {
            setMaiaTargetDeal(null);
            setMaiaTargetContato(null);
            setIsMaiaOpen(true);
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)}
        />

        {/* Main Workspace Content */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              deals={deals}
              contatos={contatos}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'relatorios' && (
            <RelatoriosView
              deals={deals}
              contatos={contatos}
            />
          )}

          {activeTab === 'inbox' && (
            <InboxView
              contatos={contatos}
              currentUser={currentUser}
              onOpenWebPhone={(phone, name) => {
                setFloatingPhone({ open: true, phone, name });
                showToast(`Iniciando chamada para ${name} (${phone})...`, 'info');
              }}
              onOpenViabilidade={(contato) => {
                setViabilidadeTargetContato(contato);
                setIsViabilidadeOpen(true);
              }}
              onOpenMaiaWithContext={(conv) => {
                const matched = contatos.find(c => c.id === conv.clienteId) || null;
                setMaiaTargetContato(matched);
                setIsMaiaOpen(true);
              }}
            />
          )}

          {activeTab === 'webphone' && (
            <div className="py-6">
              <WebPhoneModal currentUser={currentUser} />
            </div>
          )}

          {activeTab === 'fluxos' && (
            <FlowBuilderView />
          )}

          {activeTab === 'supervisor' && (
            <SupervisorView currentUser={currentUser} />
          )}

          {activeTab === 'canais' && (
            <CanaisIntegracoesView />
          )}

          {activeTab === 'conhecimento' && (
            <BaseConhecimentoView />
          )}

          {activeTab === 'campanhas' && (
            <CampanhasView />
          )}

          {activeTab === 'cobranca' && (
            <CobrancaView />
          )}

          {activeTab === 'kanban' && (
            <KanbanBoard
              deals={deals}
              contatos={contatos}
              planos={planos}
              users={users}
              currentUser={currentUser}
              onMoveDealStage={handleMoveDealStage}
              onOpenNewDeal={() => setIsNovoLeadOpen(true)}
              onOpenViabilidade={(contato) => {
                setViabilidadeTargetContato(contato);
                setIsViabilidadeOpen(true);
              }}
              onAskMaiaAboutDeal={(deal, contato) => {
                setMaiaTargetDeal(deal);
                setMaiaTargetContato(contato);
                setIsMaiaOpen(true);
              }}
              onOpenWebPhone={(phone, name) => {
                setFloatingPhone({ open: true, phone, name });
                showToast(`Iniciando chamada para ${name} (${phone})...`, 'info');
              }}
              onOpenOrdemServico={(deal, contato) => {
                // Check if OS exists for this deal or contact
                const existingOS = ordensServico.find(o => o.dealId === deal.id || o.contatoId === contato.id);
                if (!existingOS) {
                  const plano = planos.find(p => p.id === deal.planoId);
                  const novaOS: OrdemServico = {
                    id: `OS-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
                    dealId: deal.id,
                    contatoId: contato.id,
                    clienteNome: contato.nome,
                    telefone: contato.telefone,
                    endereco: `${contato.logradouro}, ${contato.numero}`,
                    bairro: contato.bairro,
                    tipo: 'INSTALACAO',
                    status: 'AGENDADA',
                    planoNome: plano?.nome || 'Fibra Ultra 600 Mega',
                    tecnicoId: 'usr_tecnico',
                    tecnicoNome: 'Marcos Ferraz',
                    dataAgendada: 'Hoje (23/09)',
                    periodo: 'MANHA',
                    ctoDesignada: deal.ctoProxima || 'CTO-CAM-014',
                    portaCto: 4,
                    sinalOpticoDbm: -20.8,
                    metragemDropMetros: deal.distanciaMetros || 40,
                    ontSerialGpon: `HWTC${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    roteadorWifi6Serial: `WIFI6-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                    checklist: {
                      passagemDrop: false,
                      conectorizacaoFusao: false,
                      testePotenciaOptica: false,
                      provisionamentoOLT: false,
                      speedtestValido: false,
                      assinaturaCliente: false
                    },
                    observacoes: `Instalação gerada via oportunidade do Kanban (${deal.titulo}).`
                  };
                  setOrdensServico(prev => [novaOS, ...prev]);
                  showToast(`Ordem de Serviço ${novaOS.id} gerada e agendada para ${contato.nome}!`, 'success');
                } else {
                  showToast(`Localizada O.S. ${existingOS.id} para ${contato.nome}.`, 'info');
                }
                setActiveTab('ordens');
              }}
              searchQuery={searchQuery}
            />
          )}

        {activeTab === 'ordens' && (
          <OrdensServicoView
            ordens={ordensServico}
            contatos={contatos}
            currentUser={currentUser}
            onAddOrdem={(nova) => {
              setOrdensServico(prev => [nova, ...prev]);
            }}
            onUpdateOrdem={(updated) => {
              setOrdensServico(prev => prev.map(o => o.id === updated.id ? updated : o));
              if (updated.status === 'CONCLUIDA' && updated.dealId) {
                // If installation is finished, automatically move deal to GANHO!
                handleMoveDealStage(updated.dealId, 'GANHO');
              }
            }}
            onOpenWebPhone={(phone, name) => {
              setFloatingPhone({ open: true, phone, name });
              showToast(`Iniciando chamada para ${name} (${phone})...`, 'info');
            }}
          />
        )}

        {activeTab === 'contatos' && (
          <ContatosList
            contatos={contatos}
            onOpenNovoLead={() => setIsNovoLeadOpen(true)}
            onOpenViabilidade={(contato) => {
              setViabilidadeTargetContato(contato);
              setIsViabilidadeOpen(true);
            }}
            onAskMaiaAboutContato={(contato) => {
              setMaiaTargetDeal(null);
              setMaiaTargetContato(contato);
              setIsMaiaOpen(true);
            }}
            onCreateDealForContato={(contato) => {
              setIsNovoLeadOpen(true);
            }}
            onOpenWebPhone={(phone, name) => {
              setFloatingPhone({ open: true, phone, name });
              showToast(`Iniciando chamada para ${name} (${phone})...`, 'info');
            }}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'viabilidade' && (
          <ViabilidadeView
            contatos={contatos}
            planos={planos}
            onOpenNovoLead={() => setIsNovoLeadOpen(true)}
            onOpenNovaOSParaEndereco={(dados) => {
              const novaOS: OrdemServico = {
                id: `OS-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
                contatoId: 'c1',
                clienteNome: 'Cliente Consulta Viabilidade',
                telefone: '(11) 98765-4321',
                endereco: dados.endereco,
                bairro: dados.bairro,
                tipo: 'INSTALACAO',
                status: 'AGENDADA',
                planoNome: 'Fibra Ultra 600 Mega Residencial',
                tecnicoId: 'usr_tecnico',
                tecnicoNome: 'Marcos Ferraz',
                dataAgendada: 'Hoje (23/09)',
                periodo: 'TARDE',
                ctoDesignada: dados.ctoId,
                portaCto: 2,
                sinalOpticoDbm: dados.sinalDbm,
                metragemDropMetros: dados.distanciaMetros,
                ontSerialGpon: `HWTC${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                roteadorWifi6Serial: `WIFI6-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                checklist: {
                  passagemDrop: false,
                  conectorizacaoFusao: false,
                  testePotenciaOptica: false,
                  provisionamentoOLT: false,
                  speedtestValido: false,
                  assinaturaCliente: false
                },
                observacoes: `Instalação originada da consulta de viabilidade (${dados.ctoId}, drop estimado em ${dados.distanciaMetros}m).`
              };
              setOrdensServico(prev => [novaOS, ...prev]);
              showToast(`Ordem de Serviço ${novaOS.id} agendada para ${dados.endereco}!`, 'success');
              setActiveTab('ordens');
            }}
          />
        )}

        {activeTab === 'planos' && (
          <PlanosCatalog
            planos={planos}
            onSelectPlano={(plano) => {
              setIsNovoLeadOpen(true);
            }}
            onAddPlano={(novo) => {
              setPlanos(prev => [novo, ...prev]);
            }}
          />
        )}

        {activeTab === 'maia' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center max-w-2xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-purple-950">
                <span className="text-2xl font-bold font-mono">M</span>
              </div>
              <h2 className="text-xl font-bold text-white">Central de Inteligência MaIA (v3.8 Flash)</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
                Módulo de Automação e Inteligência Artificial especializado em Provedores de Internet.
                Operando através do <strong>MCP Tool Gateway</strong> com permissões estritas, auditoria imutável e guardrails de conformidade.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMaiaTargetDeal(null);
                    setMaiaTargetContato(null);
                    setIsMaiaOpen(true);
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 cursor-pointer transition-all"
                >
                  Abrir Terminal Interativo MaIA
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'auditoria' && (
          <AuditView logs={auditLogs} />
        )}

        {activeTab === 'instancia' && (
          <InstanceView instance={instance} />
        )}

        {activeTab === 'configuracoes' && (
          <ConfiguracoesView instance={instance} />
        )}
      </main>
      </div>

      {/* Floating WebPhone when active */}
      {floatingPhone.open && (
        <WebPhoneModal
          currentUser={currentUser}
          initialNumber={floatingPhone.phone}
          initialName={floatingPhone.name}
          onClose={() => setFloatingPhone({ open: false, phone: '', name: '' })}
          isFloating={true}
        />
      )}

      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs text-white backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
          <span className="font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Fechar notificação"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modals */}
      {isNovoLeadOpen && (
        <NovoLeadModal
          planos={planos}
          currentUser={currentUser}
          onClose={() => setIsNovoLeadOpen(false)}
          onSubmit={handleCreateNewLead}
        />
      )}

      {isViabilidadeOpen && (
        <ViabilidadeModal
          contato={viabilidadeTargetContato}
          currentUser={currentUser}
          onClose={() => {
            setIsViabilidadeOpen(false);
            setViabilidadeTargetContato(null);
          }}
          onApplyResult={handleApplyViabilidade}
        />
      )}

      {isMaiaOpen && (
        <MaiaCopilotModal
          selectedDeal={maiaTargetDeal}
          selectedContato={maiaTargetContato}
          currentUser={currentUser}
          planos={planos}
          onClose={() => {
            setIsMaiaOpen(false);
            setMaiaTargetDeal(null);
            setMaiaTargetContato(null);
          }}
          onRefreshData={refreshData}
        />
      )}
    </div>
  );
}
