import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  Terminal, 
  Radio, 
  PhoneCall, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  LifeBuoy, 
  Wrench, 
  Layers, 
  Zap, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  Cpu,
  Server,
  DollarSign,
  Headphones,
  X
} from 'lucide-react';
import { notify } from '../utils/notify';

export const AjudaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GUIAS' | 'GLOSSARIO' | 'PRD' | 'FAQ' | 'ATALHOS' | 'SUPORTE'>('GUIAS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1');
  const [selectedPrdModule, setSelectedPrdModule] = useState<string | null>(null);

  // Módulos do PRD Modular (01 a 25)
  const prdModulos = [
    { id: '01', titulo: '01 — Visão do Produto', categoria: 'Estratégia', arquivo: '01-VISAO-PRODUTO.md', resumo: 'Proposta de valor, personas (SDR, Supervisor, Técnico, Admin, MaIA) e posicionamento no ecossistema ISP.' },
    { id: '02', titulo: '02 — Arquitetura de Sistema', categoria: 'Arquitetura', arquivo: '02-ARQUITETURA.md', resumo: 'Isolamento estrito single-tenant por CNPJ, backend Node/Express, Drizzle ORM e mediação da MaIA via Tool Gateway.' },
    { id: '03', titulo: '03 — Identidade e Acesso (RBAC)', categoria: 'Segurança', arquivo: '03-IDENTIDADE-E-ACESSO.md', resumo: 'Matriz de permissões (ADMIN, SUPERVISOR, ATENDENTE, TECNICO, MAIA_AGENT) e ActorContext validado por JWT.' },
    { id: '04', titulo: '04 — CRM Core', categoria: 'Negócio', arquivo: '04-CRM-CORE.md', resumo: 'Modelo de domínio de Contatos/Assinantes, Catálogo de Planos FTTH e Oportunidades comerciais (Deals).' },
    { id: '05', titulo: '05 — Funil Comercial Kanban', categoria: 'Negócio', arquivo: '05-KANBAN.md', resumo: 'Pipeline de 7 etapas da descoberta à ativação, ações rápidas de viabilidade e métricas de MRR em tempo real.' },
    { id: '06', titulo: '06 — Inbox Omnichannel', categoria: 'Atendimento', arquivo: '06-INBOX-OMNICHANNEL.md', resumo: 'Fila unificada de mensagens (WhatsApp, Webchat, E-mail, Voz), notas internas e contexto do assinante.' },
    { id: '07', titulo: '07 — WhatsApp Oficial (Meta API)', categoria: 'Atendimento', arquivo: '07-WHATSAPP.md', resumo: 'Meta Cloud API oficial, webhooks assinados HMAC-SHA256, modelos HSM e gestão de janela de 24h.' },
    { id: '08', titulo: '08 — WebChat Embutido', categoria: 'Atendimento', arquivo: '08-WEBCHAT.md', resumo: 'Widget flutuante para sites e landing pages com pré-atendimento, triagem de CEP e transbordo para humanos.' },
    { id: '09', titulo: '09 — WebPhone SIP & WebRTC', categoria: 'Telefonia', arquivo: '09-WEBPHONE.md', resumo: 'Softphone WebRTC embutido via WebSocket seguro (WSS) integrado ao Asterisk/FreePBX com DTMF e discador.' },
    { id: '10', titulo: '10 — Flow Builder', categoria: 'Automação', arquivo: '10-FLUXOS-ATENDIMENTO.md', resumo: 'Construtor visual de fluxos de navegação, URA de autoatendimento, coleta de CPF/CEP e transbordo.' },
    { id: '11', titulo: '11 — MaIA: Motor IA & Governança', categoria: 'Inteligência Artificial', arquivo: '11-MAIA.md', resumo: 'Google Gemini 2.5 Flash, níveis N0 a N4, Policy Engine, Fail-Closed, paramsHash anti-tamper e viabilidade MOCK.' },
    { id: '12', titulo: '12 — Filas, SLA & Supervisor', categoria: 'Gestão', arquivo: '12-FILAS-SLA-SUPERVISOR.md', resumo: 'Cockpit do supervisor com escuta silenciosa, sussurro, assunção de tickets e monitoria de TME/TMA.' },
    { id: '13', titulo: '13 — Base de Conhecimento & RAG', categoria: 'Inteligência Artificial', arquivo: '13-BASE-CONHECIMENTO.md', resumo: 'SOPs de telecom, manuais de LOS/PPPoE, regras de fidelidade e ingestão contextual para respostas da IA.' },
    { id: '14', titulo: '14 — Campanhas & Disparos', categoria: 'Comercial', arquivo: '14-CAMPANHAS.md', resumo: 'Segmentação por bairro/OLT, templates HSM Meta, controle de vazão (rate limiting) e opt-out automático.' },
    { id: '15', titulo: '15 — Hub de Integrações (SGP/ERP)', categoria: 'Integrações', arquivo: '15-INTEGRACOES.md', resumo: 'Adapters para IXC, MK-AUTH, HubSoft e Voalle com resposta NOT_CONFIGURED na ausência de credenciais reais.' },
    { id: '16', titulo: '16 — Cobrança, Faturas & Pix', categoria: 'Financeiro', arquivo: '16-COBRANCA.md', resumo: 'Pix instantâneo Banco Central com baixa automática via webhook e visualização de boletos bancários em PDF.' },
    { id: '17', titulo: '17 — Relatórios Gerenciais & BI', categoria: 'Gestão', arquivo: '17-RELATORIOS.md', resumo: 'Métricas de MRR, Ticket Médio, Churn, First-Time Right do campo e exportação de dados em CSV/XLSX.' },
    { id: '18', titulo: '18 — Trilha de Auditoria & LGPD', categoria: 'Segurança', arquivo: '18-AUDITORIA-LGPD.md', resumo: 'Encadeamento criptográfico linear SHA-256 com PostgreSQL Advisory Locks e exportação de dados do titular.' },
    { id: '19', titulo: '19 — Infraestrutura & Containers', categoria: 'DevOps', arquivo: '19-INFRA-CONTAINERS.md', resumo: 'Dockerfile multi-stage em Bun, execução como usuário não-root enlace, graceful shutdown de 10s e bind local.' },
    { id: '20', titulo: '20 — Segurança & Fail-Closed', categoria: 'Segurança', arquivo: '20-SEGURANCA.md', resumo: 'Startup failure para senhas fracas, isolamento cross-instance no banco e bloqueio de falhas de infraestrutura.' },
    { id: '21', titulo: '21 — Observabilidade & Backup', categoria: 'DevOps', arquivo: '21-OBSERVABILIDADE-BACKUP.md', resumo: 'Logs estruturados em JSON, liveness/readiness probes, rotinas diárias de pg_dump e Point-in-Time Recovery.' },
    { id: '22', titulo: '22 — Testes & Homologação', categoria: 'Qualidade', arquivo: '22-TESTES-HOMOLOGACAO.md', resumo: 'Suíte automatizada com 43 testes de integração, concorrência, RBAC negativo, governança MaIA e fluxo E2E.' },
    { id: '23', titulo: '23 — Deploy & Operação', categoria: 'DevOps', arquivo: '23-DEPLOY-OPERACAO.md', resumo: 'Modelos VPS com Docker Compose e Serverless Cloud Run com checklist pré-deploy e rolling updates.' },
    { id: '24', titulo: '24 — Limites do Produto', categoria: 'Estratégia', arquivo: '24-LIMITES-DO-PRODUTO.md', resumo: 'Fronteiras arquiteturais formais: não substitui ERP fiscal (NFCom 62), PBX de mídia física ou laudo óptico GIS.' },
    { id: '25', titulo: '25 — Ajuda, Glossário & SOP', categoria: 'Operação', arquivo: '25-AJUDA-SOP-OPERACIONAL.md', resumo: 'Glossário técnico (dBm, CTO, GPON, LOS, PPPoE), procedimentos de atendimento e atalhos de produtividade.' }
  ];

  // Guias Rápidos
  const guias = [
    {
      id: 'guia-1',
      icone: Zap,
      cor: 'text-amber-400 bg-amber-950/60 border-amber-800',
      titulo: '1. Atendimento Omnichannel & WhatsApp Oficial',
      tempo: '3 min de leitura',
      resumo: 'Como responder clientes pelo WhatsApp Meta Cloud API, usar mensagens prontas e alternar entre IA e humano.',
      passos: [
        'Acesse a aba "Inbox Unificado" no menu lateral.',
        'Selecione a conversa na coluna de conversas ativas.',
        'Observe as mensagens analisadas pela MaIA com sugestões de resposta em tempo real.',
        'Para enviar 2ª via Pix com QR Code instantâneo, clique no botão "Gerar Pix Copia e Cola".',
        'Se o cliente solicitar intervenção técnica complexa, assuma o chat clicando em "Assumir Conversa".'
      ]
    },
    {
      id: 'guia-2',
      icone: Layers,
      cor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800',
      titulo: '2. Funil de Vendas Comercial (Kanban)',
      tempo: '4 min de leitura',
      resumo: 'Ciclo completo de conversão de novos assinantes residenciais e corporativos da captação ao fechamento.',
      passos: [
        'Novos leads captados via WhatsApp, site ou tráfego pago entram automaticamente na coluna "Novo Lead".',
        'Abra o card para ver o Score de Qualificação gerado pelo Copiloto MaIA.',
        'Utilize o botão "Testar Viabilidade" para certificar que há porta livre na CTO mais próxima.',
        'Arraste o lead para "Proposta Comercial", selecione o plano escolhido e envie o link por WhatsApp.',
        'Ao aceitar o contrato, arraste para "Aguardando Instalação" e agende a Ordem de Serviço da equipe de campo.'
      ]
    },
    {
      id: 'guia-3',
      icone: Radio,
      cor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
      titulo: '3. Viabilidade Técnica & Cálculo de Potência Óptica',
      tempo: '5 min de leitura',
      resumo: 'Validação de cobertura FTTH por CEP/coordenadas e cálculo automático do Power Budget (ITU-T G.984).',
      passos: [
        'Acesse "Viabilidade Técnica" ou utilize a ação rápida em qualquer cliente.',
        'Digite o CEP do assinante para carregar a malha de caixas CTO no raio geográfico.',
        'Verifique a distância do cabo Drop (o padrão máximo operacional é 80 metros).',
        'Confira o cálculo de potência óptica estimada: a janela recomendada Classe B+ é de -15 dBm a -24 dBm.',
        'Clique em "Reservar Porta na CTO" para garantir a porta para o técnico antes do despacho.'
      ]
    },
    {
      id: 'guia-4',
      icone: Wrench,
      cor: 'text-purple-400 bg-purple-950/60 border-purple-800',
      titulo: '4. Ordens de Serviço (O.S.) & Ativação em Campo',
      tempo: '4 min de leitura',
      resumo: 'Passo a passo para os técnicos de campo executarem a conectorização, fusão e liberação na OLT.',
      passos: [
        'Na tela "Ordens de Serviço", visualize a grade de instalações do dia atribuídas por técnico.',
        'O técnico no aplicativo móvel confere o endereço e número da porta da CTO designada.',
        'Após a conectorização do conector verde SC/APC, mede a potência com o Power Meter e digita o valor em dBm.',
        'Escaneia ou digita o Serial Number (PON MAC) da ONU e o MAC do Roteador Wi-Fi 6 em comodato.',
        'Marca os 6 itens do checklist técnico e clica em "Concluir O.S.", ativando automaticamente o assinante no SGP e movendo o card para "Ganho".'
      ]
    },
    {
      id: 'guia-5',
      icone: DollarSign,
      cor: 'text-blue-400 bg-blue-950/60 border-blue-800',
      titulo: '5. Cobrança, Faturamento & Baixa Automática Pix',
      tempo: '3 min de leitura',
      resumo: 'Régua de cobrança preventiva, emissão de Pix Copia e Cola e desbloqueio em confiança.',
      passos: [
        'Acesse a aba "Cobrança & Financeiro" para acompanhar faturas pendentes, a vencer e vencidas.',
        'Dispare lembretes amigáveis de fatura via WhatsApp em 1 clique antes do vencimento.',
        'Quando o cliente paga via Pix Copia e Cola, o webhook bancário confirma o crédito em menos de 3 minutos.',
        'Caso o sinal do cliente esteja suspenso no Radius, o sistema reativa a conexão na OLT automaticamente após a confirmação do pagamento.'
      ]
    },
    {
      id: 'guia-6',
      icone: PhoneCall,
      cor: 'text-indigo-400 bg-indigo-950/60 border-indigo-800',
      titulo: '6. WebPhone SIP & Telefonia WebRTC Integrada',
      tempo: '3 min de leitura',
      resumo: 'Como receber e originar chamadas telefônicas diretamente no navegador sem necessidade de softphones externos.',
      passos: [
        'O ramal SIP WebRTC conecta automaticamente ao PBX Asterisk/FreePBX da sua operadora.',
        'Clique no ícone de telefone no card de qualquer cliente para discar com preenchimento instantâneo.',
        'Durante a chamada, utilize os botões de "Mudo", "Pausar/Retenção" e o teclado DTMF para navegar em URAs.',
        'Para transferir a ligação para o Suporte N2 ou Financeiro, digite o número do ramal de destino e clique em "Transferir".'
      ]
    }
  ];

  // Glossário Técnico de Telecom
  const glossario = [
    {
      termo: 'GPON (Gigabit Passive Optical Network)',
      categoria: 'Rede de Acesso',
      definicao: 'Padrão da ITU-T G.984 para redes de fibra óptica compartilhada Ponto-Multiponto, permitindo velocidades de 2.488 Gbps de downstream e 1.244 Gbps de upstream por porta PON.'
    },
    {
      termo: 'OLT (Optical Line Terminal)',
      categoria: 'Equipamento Central',
      definicao: 'Equipamento instalado no POP central do provedor que controla todas as portas ópticas PON, gerencia a banda, VLANs e comunica com as ONUs nas residências dos clientes.'
    },
    {
      termo: 'ONT / ONU (Optical Network Terminal / Unit)',
      categoria: 'Equipamento Cliente',
      definicao: 'Modem óptico instalado na residência do cliente final que converte os sinais de luz da fibra óptica em dados ethernet e Wi-Fi.'
    },
    {
      termo: 'CTO (Caixa de Terminação Óptica)',
      categoria: 'Rede Externa',
      definicao: 'Caixa instalada nos postes de distribuição contendo splitters ópticos (ex: 1:8 ou 1:16) onde o cabo drop que vai até a casa do cliente é conectorizado.'
    },
    {
      termo: 'Cabo Drop Óptico',
      categoria: 'Rede Externa',
      definicao: 'Cabo de fibra monomodo compacto com elemento de tração de aço ou dielétrico que liga a CTO do poste até a roseta óptica no interior da residência do assinante.'
    },
    {
      termo: 'Atenuação Óptica (dBm)',
      categoria: 'Métrica de Qualidade',
      definicao: 'Nível de potência óptica que chega na ONU. Para redes GPON Classe B+, a faixa ideal operacional está entre -15 dBm e -25 dBm. Valores piores que -27 dBm causam perda de pacotes e lentidão.'
    },
    {
      termo: 'LOS (Loss of Signal)',
      categoria: 'Alarme Crítico',
      definicao: 'Alarme indicado pelo LED vermelho na ONU indicando ausência total de sinal óptico, geralmente causado por rompimento de cabo drop, curvatura excessiva ou desencaixe de conector.'
    },
    {
      termo: 'PPPoE (Point-to-Point Protocol over Ethernet)',
      categoria: 'Autenticação',
      definicao: 'Protocolo de túnel utilizado para autenticar a conexão do cliente no roteador de borda (BNG/MikroTik/Huawei) através de usuário e senha validados no servidor Radius.'
    },
    {
      termo: 'SGP / ERP de Provedor',
      categoria: 'Software de Gestão',
      definicao: 'Sistema de Gestão de Provedores (como IXC Soft, MK-AUTH, HubSoft, SGP) responsável por emissão de faturas, contratos, controle de estoque e provisionamento de rede.'
    },
    {
      termo: 'First-Time Right (FTR)',
      categoria: 'KPI Operacional',
      definicao: 'Percentual de instalações concluídas com sucesso e sinal óptico validado logo na primeira visita técnica, sem necessidade de retorno da equipe de campo.'
    }
  ];

  // FAQ
  const faqs = [
    {
      id: 'faq-1',
      pergunta: 'Como proceder quando o cliente relata luz LOS vermelha piscando na ONU?',
      resposta: 'O alarme LOS significa ausência de sinal óptico. 1) Verifique no sistema se há incidente massivo ou rompimento afetando a CTO onde o cliente está conectado; 2) Oriente o cliente a verificar se o conector verde SC/APC está firmemente encaixado e se o cabo amarelo não está dobrado; 3) Se não houver problema no domicílio, abra imediatamente uma O.S. de Manutenção Externa com prioridade Alta.'
    },
    {
      id: 'faq-2',
      pergunta: 'Como a MaIA calcula a viabilidade automática na CTO?',
      resposta: 'A MaIA cruza as coordenadas de latitude e longitude do CEP do cliente com a malha georreferenciada de caixas CTO cadastradas. O algoritmo verifica a distância em linha reta, aplica o fator de curvatura de postes (1.2x), checa a existência de portas livres disponíveis no splitter e calcula a atenuação esperada baseada na distância do cabo drop.'
    },
    {
      id: 'faq-3',
      pergunta: 'Como funciona a baixa automática de pagamentos via Pix?',
      resposta: 'Quando a MaIA ou o atendente gera o Pix Copia e Cola, um payload Pix dinâmico do Banco Central com identificador único de fatura (TxID) é criado. Assim que o cliente paga em qualquer banco, o webhook é acionado, baixando a fatura em menos de 3 minutos e emitindo comando Radius para remover o corte por débito.'
    },
    {
      id: 'faq-4',
      pergunta: 'É possível usar o WebPhone SIP com qualquer central PBX Asterisk?',
      resposta: 'Sim! O Enlace CRM utiliza o protocolo padrão WebRTC SIP (RFC 7118 via WebSocket seguro wss://). Basta informar o IP do seu servidor Asterisk, FreePBX, Issabel ou Kamailio nas configurações de telefonia, além do ramal SIP e senha configurados para o operador.'
    },
    {
      id: 'faq-5',
      pergunta: 'Como cadastrar novos operadores e alterar perfis de permissão (RBAC)?',
      resposta: 'Usuários com perfil ADMINISTRADOR podem acessar as configurações de equipe para convidar operadores e definir seus papéis: Admin (acesso total), Supervisor (monitoria, auditoria e filas), Comercial/Atendente (inbox e kanban) ou Técnico de Campo (apenas ordens de serviço).'
    }
  ];

  // Atalhos de Teclado
  const atalhos = [
    { tecla: 'Alt + M', acao: 'Abrir / Fechar o Co-piloto MaIA com inteligência contextual' },
    { tecla: 'Alt + P', acao: 'Abrir / Recolher o WebPhone SIP para discagem rápida' },
    { tecla: 'Ctrl + /', acao: 'Focar na barra de busca global do CRM' },
    { tecla: 'Alt + N', acao: 'Cadastrar Novo Lead Comercial rapidamente' },
    { tecla: 'Alt + 1 a 6', acao: 'Alternar entre as abas principais (Dashboard, Inbox, Kanban, O.S., Viabilidade, Cobrança)' },
    { tecla: 'Esc', acao: 'Fechar qualquer modal aberto (MaIA, WebPhone, Viabilidade, Detalhe)' }
  ];

  const filteredFaqs = faqs.filter(f => 
    f.pergunta.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.resposta.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGlossario = glossario.filter(g =>
    g.termo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.definicao.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Módulo de Ajuda &amp; Operações ISP
            </span>
            <span className="text-xs text-slate-400">• Procedimentos Operacionais Padrão (SOP)</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Central de Ajuda, Guias &amp; Suporte Técnico</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Manuais operacionais para atendentes, supervisores e técnicos de campo. Consulte o glossário de telecomunicações, atalhos de produtividade e resoluções de problemas de rede FTTH.
          </p>
        </div>

        {/* Status SLA Card */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Status do Sistema</div>
              <div className="text-xs font-bold text-emerald-300">99.98% Disponibilidade</div>
            </div>
          </div>
          <div className="h-7 w-px bg-slate-800"></div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Suporte N3</div>
            <div className="text-xs font-bold text-cyan-400">Ativo 24/7</div>
          </div>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Pesquisar por termo, dúvida (ex: LOS, atenuação, pix, viabilidade, ramal)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl pl-11 pr-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors shadow-lg"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('GUIAS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'GUIAS'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Guias Operacionais Rápidos</span>
        </button>

        <button
          onClick={() => setActiveTab('GLOSSARIO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'GLOSSARIO'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Glossário FTTH &amp; Telecom</span>
        </button>

        <button
          onClick={() => setActiveTab('PRD')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'PRD'
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Especificação PRD (25 Módulos)</span>
        </button>

        <button
          onClick={() => setActiveTab('FAQ')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'FAQ'
              ? 'bg-purple-950 text-purple-300 border border-purple-800 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>FAQ de Dúvidas Frequentes</span>
        </button>

        <button
          onClick={() => setActiveTab('ATALHOS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ATALHOS'
              ? 'bg-amber-950 text-amber-300 border border-amber-800 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Atalhos &amp; Produtividade</span>
        </button>

        <button
          onClick={() => setActiveTab('SUPORTE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SUPORTE'
              ? 'bg-blue-950 text-blue-300 border border-blue-800 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Suporte N3 &amp; Engenharia</span>
        </button>
      </div>

      {/* TAB CONTENT: GUIAS */}
      {activeTab === 'GUIAS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {guias.map((guia) => {
            const Icon = guia.icone;
            return (
              <div 
                key={guia.id} 
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${guia.cor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                    {guia.tempo}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{guia.titulo}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{guia.resumo}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                    Passo a Passo de Execução
                  </div>
                  <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                    {guia.passos.map((p, idx) => (
                      <li key={idx} className="text-slate-300">
                        <span className="text-slate-200">{p}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: GLOSSÁRIO */}
      {activeTab === 'GLOSSARIO' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Mostrando <strong>{filteredGlossario.length}</strong> termos técnicos essenciais para a operação do provedor:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossario.map((item, idx) => (
              <div 
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs font-mono text-cyan-300">
                    {item.termo}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {item.categoria}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.definicao}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PRD MODULAR */}
      {activeTab === 'PRD' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Especificação de Engenharia &amp; PRD Modular (25 Cadernos)</span>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl">
                Arquitetura de microsserviços, governança de dados, isolamento single-tenant por CNPJ e diretrizes técnicas para desenvolvedores, auditores e homologadores. Localizados em <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-mono text-[11px]">docs/prd/</code>.
              </p>
            </div>
            <div className="text-xs font-mono text-indigo-300 bg-indigo-950/70 border border-indigo-800/80 px-3 py-1.5 rounded-xl font-bold">
              25 Módulos Homologados
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {prdModulos
              .filter(p =>
                !searchQuery ||
                p.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.resumo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.id.includes(searchQuery)
              )
              .map((mod) => (
                <div 
                  key={mod.id}
                  className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-800/80 rounded-2xl p-4 shadow-xl space-y-2.5 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/60">
                        {mod.categoria}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {mod.arquivo}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white tracking-tight">
                      {mod.titulo}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {mod.resumo}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Status: Concluído
                    </span>
                    <button
                      onClick={() => {
                        setSelectedPrdModule(mod.arquivo);
                        notify(`Visualizando caderno de engenharia: docs/prd/${mod.arquivo}`, 'info');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <span>Ver Caderno</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: FAQ */}
      {activeTab === 'FAQ' && (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = expandedFaq === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                  className="w-full text-left p-4.5 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {faq.pergunta}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs text-slate-300 bg-slate-950/50 border-t border-slate-800/80 leading-relaxed font-sans">
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 mt-2">
                      {faq.resposta}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: ATALHOS */}
      {activeTab === 'ATALHOS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>Atalhos de Teclado Globais para Operadores</span>
          </div>
          <p className="text-xs text-slate-400">
            Aumente a velocidade de atendimento no dia a dia navegando sem tirar as mãos do teclado.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {atalhos.map((at, idx) => (
              <div 
                key={idx}
                className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
              >
                <span className="text-xs text-slate-300">{at.acao}</span>
                <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] font-bold text-amber-300 shrink-0 shadow-sm">
                  {at.tecla}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SUPORTE N3 */}
      {activeTab === 'SUPORTE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Plantão de Engenharia &amp; NOC</h3>
                <p className="text-[11px] text-slate-400">Atendimento a incidentes críticos e rotas BGP</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>Central NOC (Chamadas de Emergência)</span>
                <strong className="font-mono text-cyan-300">0800 892 0044</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>E-mail do Plantão de Redes</span>
                <strong className="font-mono text-indigo-300">noc@enlacecrm.com.br</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>Tempo Médio de Resposta P1</span>
                <strong className="font-mono text-emerald-400">&lt; 15 minutos</strong>
              </div>
            </div>

            <button
              onClick={() => notify('Solicitação de atendimento enviada ao NOC com sucesso. Protocolo #ENG-941.', 'success')}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 cursor-pointer transition-colors"
            >
              Abrir Ticket Emergencial de Engenharia
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Copiloto MaIA de Diagnóstico</h3>
                <p className="text-[11px] text-slate-400">Tire dúvidas de topologia com a IA</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Você também pode perguntar qualquer questão operacional diretamente para o Copiloto MaIA no canto superior direito. A IA possui acesso a todos os manuais técnicos, normas Anatel e histórico de clientes.
            </p>

            <div className="p-3.5 bg-purple-950/40 rounded-xl border border-purple-800/60 text-xs text-purple-200">
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Exemplos de perguntas para a MaIA:</span>
              </div>
              <ul className="space-y-1 text-[11px] list-disc list-inside text-purple-300">
                <li>&quot;Qual a metragem máxima recomendada de cabo drop antes de exigir nova CTO?&quot;</li>
                <li>&quot;Como calcular o split ratio 1:64 na porta PON da OLT Huawei?&quot;</li>
                <li>&quot;O cliente está com -28.5 dBm. Qual a causa provável?&quot;</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizador do Caderno PRD */}
      {selectedPrdModule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setSelectedPrdModule(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {(() => {
              const mod = prdModulos.find(m => m.arquivo === selectedPrdModule);
              if (!mod) return null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-950 px-2.5 py-0.5 rounded border border-indigo-800">
                      {mod.categoria}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      docs/prd/{mod.arquivo}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <span>{mod.titulo}</span>
                  </h3>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
                    <div className="font-bold text-white text-xs uppercase tracking-wider text-indigo-300">
                      Resumo Executivo do Caderno:
                    </div>
                    <p>{mod.resumo}</p>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                      Diretrizes de Arquitetura &amp; Conformidade:
                    </div>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-xs">
                      <li><strong className="text-white">Isolamento Single-Tenant:</strong> Dados contidos por CNPJ com validação em nível de banco e token.</li>
                      <li><strong className="text-white">Conformidade Regulatória:</strong> Regras de negócio alinhadas com resoluções Anatel e LGPD (Lei nº 13.709/2018).</li>
                      <li><strong className="text-white">Governança da MaIA:</strong> Mediação estrita via Tool Gateway sem permissão irrestrita de escrita ou SQL.</li>
                      <li><strong className="text-white">Fail-Closed:</strong> Interrupção segura de transações críticas na ausência de banco de dados ou autenticação.</li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Especificação Ativa e Homologada
                    </span>
                    <button
                      onClick={() => setSelectedPrdModule(null)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Fechar Visualizador
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
