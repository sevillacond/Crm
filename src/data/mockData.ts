import { User, InstanceConfig, Plano, Contato, Deal, AuditLog, OrdemServico } from '../types';

export const INITIAL_INSTANCE: InstanceConfig = {
  instanceId: 'inst_enlace_sp_001',
  cnpj: '42.109.876/0001-55',
  razaoSocial: 'Enlace Telecomunicações e Conectividade Ltda.',
  nomeFantasia: 'Enlace Fibra Telecom',
  cidadeSede: 'Campinas',
  uf: 'SP',
  timezone: 'America/Sao_Paulo (BRT)',
  status: 'ISOLADA_ATIVA',
  databaseEngine: 'PostgreSQL 16.2 (Dedicado)',
  sgpIntegrado: 'IXC Soft',
  totalCtos: 184,
  totalPortasDisponiveis: 1420,
  versaoMaia: 'MaIA v3.8 Flash (Tool Gateway RBAC)'
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    instanceId: 'inst_enlace_sp_001',
    name: 'Roberto Albuquerque',
    email: 'roberto@enlacefibra.com.br',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Diretoria de Operações',
    status: 'ONLINE'
  },
  {
    id: 'usr_supervisor',
    instanceId: 'inst_enlace_sp_001',
    name: 'Camila Siqueira',
    email: 'camila.vendas@enlacefibra.com.br',
    role: 'SUPERVISOR',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    department: 'Supervisão Comercial',
    status: 'ONLINE'
  },
  {
    id: 'usr_atendente_1',
    instanceId: 'inst_enlace_sp_001',
    name: 'Lucas Mendes',
    email: 'lucas.sdr@enlacefibra.com.br',
    role: 'ATENDENTE',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Vendas Varejo',
    status: 'ONLINE'
  },
  {
    id: 'usr_atendente_2',
    instanceId: 'inst_enlace_sp_001',
    name: 'Juliana Vasconcelos',
    email: 'juliana.corp@enlacefibra.com.br',
    role: 'ATENDENTE',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'Vendas Corporativas B2B',
    status: 'EM_ATENDIMENTO'
  },
  {
    id: 'usr_tecnico',
    instanceId: 'inst_enlace_sp_001',
    name: 'Marcos Ferraz',
    email: 'marcos.campo@enlacefibra.com.br',
    role: 'TECNICO',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'Infraestrutura & Campo',
    status: 'ONLINE'
  },
  {
    id: 'usr_maia',
    instanceId: 'inst_enlace_sp_001',
    name: 'MaIA (Agente IA Enlace)',
    email: 'maia@sistema.enlace.internal',
    role: 'MAIA_AGENT',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    department: 'Automação & IA',
    status: 'ONLINE'
  }
];

export const INITIAL_PLANOS: Plano[] = [
  {
    id: 'pln_400m',
    nome: 'Fibra Residencial 400 Mega',
    downloadMbps: 400,
    uploadMbps: 200,
    precoMensal: 89.90,
    adesao: 0,
    tecnologia: 'FTTH (Fibra Óptica)',
    recursos: ['Wi-Fi 5 Gigabit Dual-Band', 'Instalação Grátis no Contrato 12m', 'Suporte Técnico Local']
  },
  {
    id: 'pln_600m',
    nome: 'Fibra Gamer Turbo 600 Mega',
    downloadMbps: 600,
    uploadMbps: 300,
    precoMensal: 119.90,
    adesao: 0,
    popular: true,
    tecnologia: 'FTTH (Fibra Óptica)',
    recursos: ['Roteador Wi-Fi 6 de Baixa Latência', 'Rota Gamer Otimizada', 'IPv6 Nativo e IP Dinâmico sem CGNAT']
  },
  {
    id: 'pln_1g',
    nome: 'Fibra Ultra 1 Giga',
    downloadMbps: 1000,
    uploadMbps: 500,
    precoMensal: 169.90,
    adesao: 0,
    tecnologia: 'FTTH (Fibra Óptica)',
    recursos: ['2x Roteadores Wi-Fi 6 em Mesh', 'Prioridade de Fila 24/7', 'Aplicativos de Streaming Inclusos']
  },
  {
    id: 'pln_dedicado_500m',
    nome: 'Link Dedicado 500 Mbps Corporativo',
    downloadMbps: 500,
    uploadMbps: 500,
    precoMensal: 890.00,
    adesao: 350.00,
    tecnologia: 'Link Dedicado',
    recursos: ['Simétrico 1:1 Garantido', 'SLA de Atendimento 4 Horas (99.8%)', 'Bloco /29 IPv4 Fixo', 'Monitoramento NOC Proativo']
  }
];

export const INITIAL_CONTATOS: Contato[] = [
  {
    id: 'ct_001',
    nome: 'Dra. Vanessa Meirelles',
    cpfCnpj: '284.918.491-04',
    telefone: '(19) 99841-2291',
    email: 'vanessa.meirelles@clinica.med.br',
    cep: '13024-000',
    logradouro: 'Av. Coronel Silva Telles',
    numero: '450',
    complemento: 'Conjunto 42',
    bairro: 'Cambuí',
    cidade: 'Campinas',
    uf: 'SP',
    status: 'VIAVEL',
    tags: ['FIBRA_RESIDENCIAL', 'HOME_OFFICE', 'HOT_LEAD'],
    scoreMaia: 94,
    resumoMaia: 'Busca estabilidade crítica para telemedicina. Portas livres na CTO-CAM-014 a 32m.',
    origem: 'WHATSAPP',
    dataCadastro: '2026-09-20T10:15:00Z',
    ultimoContato: '2026-09-22T09:40:00Z'
  },
  {
    id: 'ct_002',
    nome: 'Logística Camp Express Ltda.',
    cpfCnpj: '08.924.112/0001-90',
    telefone: '(19) 98112-7000',
    email: 'ti@campexpress.com.br',
    cep: '13054-700',
    logradouro: 'Rua das Indústrias',
    numero: '1280',
    bairro: 'Distrito Industrial',
    cidade: 'Campinas',
    uf: 'SP',
    status: 'VIAVEL',
    tags: ['B2B', 'LINK_DEDICADO', 'ALTO_VALOR'],
    scoreMaia: 88,
    resumoMaia: 'Galpão logístico precisando de contingência e link primário de 500Mbps simétrico.',
    origem: 'SITE',
    dataCadastro: '2026-09-21T14:20:00Z',
    ultimoContato: '2026-09-22T11:05:00Z'
  },
  {
    id: 'ct_003',
    nome: 'Thiago Barcellos (Gamer)',
    cpfCnpj: '412.339.182-50',
    telefone: '(19) 99234-8811',
    email: 'thiago.barcellos@gmail.com',
    cep: '13083-850',
    logradouro: 'Rua Roxo Moreira',
    numero: '890',
    bairro: 'Barão Geraldo',
    cidade: 'Campinas',
    uf: 'SP',
    status: 'EM_QUALIFICACAO',
    tags: ['FIBRA_GAMER', 'PORTABILIDADE'],
    scoreMaia: 82,
    resumoMaia: 'Insatisfeito com latência da operadora atual (V**o). Deseja plano de 600 Mega com Wi-Fi 6.',
    origem: 'WEBCHAT',
    dataCadastro: '2026-09-22T08:30:00Z',
    ultimoContato: '2026-09-22T13:10:00Z'
  },
  {
    id: 'ct_004',
    nome: 'Padaria & Confeitaria Pão de Ouro',
    cpfCnpj: '19.482.001/0001-33',
    telefone: '(19) 3232-4499',
    email: 'contato@paodeouro.com.br',
    cep: '13010-001',
    logradouro: 'Rua Barão de Jaguara',
    numero: '610',
    bairro: 'Centro',
    cidade: 'Campinas',
    uf: 'SP',
    status: 'NOVO',
    tags: ['COMERCIO_LOCAL', 'FIBRA_TURBO'],
    scoreMaia: 75,
    resumoMaia: 'Precisa de conexão para 4 máquinas de cartão de crédito e Wi-Fi de clientes.',
    origem: 'INDICACAO',
    dataCadastro: '2026-09-22T13:45:00Z'
  },
  {
    id: 'ct_005',
    nome: 'Mariana Duarte',
    cpfCnpj: '331.890.112-98',
    telefone: '(19) 99762-3310',
    email: 'mari.duarte.arq@outlook.com',
    cep: '13092-150',
    logradouro: 'Rua Maria Monteiro',
    numero: '1120',
    complemento: 'Apto 81',
    bairro: 'Cambuí',
    cidade: 'Campinas',
    uf: 'SP',
    status: 'CLIENTE_ATIVO',
    tags: ['CLIENTE_ATIVO', 'FIBRA_600M'],
    scoreMaia: 98,
    origem: 'WHATSAPP',
    dataCadastro: '2026-08-10T16:00:00Z'
  }
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'dl_001',
    titulo: 'Fibra Residencial - Dra. Vanessa',
    contatoId: 'ct_001',
    planoId: 'pln_600m',
    etapa: 'PROPOSTA',
    valorMensal: 119.90,
    taxaAdesao: 0,
    probabilidade: 85,
    dataPrevisao: '2026-09-25',
    responsavelId: 'usr_atendente_1',
    statusViabilidade: 'VIAVEL_CTO',
    ctoProxima: 'CTO-CAM-014',
    distanciaMetros: 32,
    notas: [
      'MaIA realizou consulta de CTO automatizada: 4 portas disponíveis na CTO-CAM-014.',
      'Proposta enviada em PDF com roteador Wi-Fi 6 bonificado.'
    ],
    createdAt: '2026-09-20T10:30:00Z',
    updatedAt: '2026-09-22T09:40:00Z'
  },
  {
    id: 'dl_002',
    titulo: 'Link Dedicado 500M - Camp Express',
    contatoId: 'ct_002',
    planoId: 'pln_dedicado_500m',
    etapa: 'NEGOCIACAO',
    valorMensal: 890.00,
    taxaAdesao: 350.00,
    probabilidade: 70,
    dataPrevisao: '2026-09-28',
    responsavelId: 'usr_atendente_2',
    statusViabilidade: 'VIAVEL_CTO',
    ctoProxima: 'POP-IND-002',
    distanciaMetros: 110,
    notas: [
      'Negociação de prazo contratual de 24 meses em troca de isenção da taxa de instalação.',
      'Aguardando aprovação da diretoria financeira do cliente.'
    ],
    createdAt: '2026-09-21T15:00:00Z',
    updatedAt: '2026-09-22T11:05:00Z'
  },
  {
    id: 'dl_003',
    titulo: 'Fibra Gamer 600M - Thiago Barcellos',
    contatoId: 'ct_003',
    planoId: 'pln_600m',
    etapa: 'VIABILIDADE',
    valorMensal: 119.90,
    taxaAdesao: 0,
    probabilidade: 60,
    dataPrevisao: '2026-09-26',
    responsavelId: 'usr_atendente_1',
    statusViabilidade: 'PENDENTE',
    notas: [
      'Lead informou que o jogo favorito é Valorant e CS2.',
      'Aguardando validação de rota óptica em Barão Geraldo.'
    ],
    createdAt: '2026-09-22T08:35:00Z',
    updatedAt: '2026-09-22T13:10:00Z'
  },
  {
    id: 'dl_004',
    titulo: 'Fibra Comercial - Pão de Ouro',
    contatoId: 'ct_004',
    planoId: 'pln_400m',
    etapa: 'NOVO_LEAD',
    valorMensal: 89.90,
    taxaAdesao: 0,
    probabilidade: 40,
    dataPrevisao: '2026-09-30',
    responsavelId: 'usr_maia',
    statusViabilidade: 'PENDENTE',
    notas: [
      'Lead novo captado no balcão por indicação de cliente ativo.',
      'MaIA agendada para enviar saudação WhatsApp automática.'
    ],
    createdAt: '2026-09-22T13:50:00Z',
    updatedAt: '2026-09-22T13:50:00Z'
  },
  {
    id: 'dl_005',
    titulo: 'Fibra 1 Giga - Mariana Duarte',
    contatoId: 'ct_005',
    planoId: 'pln_1g',
    etapa: 'GANHO',
    valorMensal: 169.90,
    taxaAdesao: 0,
    probabilidade: 100,
    dataPrevisao: '2026-08-15',
    responsavelId: 'usr_atendente_1',
    statusViabilidade: 'VIAVEL_CTO',
    ctoProxima: 'CTO-CAM-008',
    distanciaMetros: 45,
    notas: [
      'Instalação concluída com sucesso em 14/08/2026 pela equipe de campo.',
      'Cliente pontuou NPS 10 com elogios à velocidade e pontualidade.'
    ],
    createdAt: '2026-08-10T16:15:00Z',
    updatedAt: '2026-08-15T18:00:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_001',
    timestamp: '2026-09-22T13:50:00Z',
    actorId: 'usr_maia',
    actorName: 'MaIA (Agente IA)',
    actorRole: 'MAIA_AGENT',
    action: 'LEAD_CREATED_FROM_INBOUND',
    entityType: 'CONTATO',
    entityId: 'ct_004',
    details: 'Novo lead "Pão de Ouro" registrado automaticamente com telefone (19) 3232-4499.',
    isMaiaAction: true
  },
  {
    id: 'aud_002',
    timestamp: '2026-09-22T11:05:00Z',
    actorId: 'usr_atendente_2',
    actorName: 'Juliana Vasconcelos',
    actorRole: 'ATENDENTE',
    action: 'DEAL_MOVED_STAGE',
    entityType: 'DEAL',
    entityId: 'dl_002',
    details: 'Negócio "Camp Express" movido de PROPOSTA para NEGOCIACAO. Probabilidade ajustada para 70%.',
    isMaiaAction: false
  },
  {
    id: 'aud_003',
    timestamp: '2026-09-22T09:40:00Z',
    actorId: 'usr_maia',
    actorName: 'MaIA (Agente IA)',
    actorRole: 'MAIA_AGENT',
    action: 'MAIA_TOOL_VIABILIDADE_EXECUTED',
    entityType: 'MAIA_TOOL',
    entityId: 'ct_001',
    details: 'Ferramenta consultar_viabilidade executada para CEP 13024-000 nº 450. Retorno: VIAVEL na CTO-CAM-014 (32m, 4 portas livres).',
    isMaiaAction: true
  },
  {
    id: 'aud_004',
    timestamp: '2026-09-22T08:35:00Z',
    actorId: 'usr_supervisor',
    actorName: 'Camila Siqueira',
    actorRole: 'SUPERVISOR',
    action: 'DEAL_ASSIGNED',
    entityType: 'DEAL',
    entityId: 'dl_003',
    details: 'Negócio Thiago Barcellos atribuído ao atendente Lucas Mendes.',
    isMaiaAction: false
  }
];

export const INITIAL_ORDENS_SERVICO: OrdemServico[] = [
  {
    id: 'OS-2026-0041',
    dealId: 'dl_004',
    contatoId: 'ct_004',
    clienteNome: 'Mariana Silva Costa',
    telefone: '(19) 98765-4321',
    endereco: 'Rua das Camélias, 120, Parque das Rosas',
    bairro: 'Parque das Rosas',
    tipo: 'INSTALACAO',
    status: 'EM_EXECUCAO',
    planoNome: 'Fibra Ultra 600 Mega + Wi-Fi 6',
    tecnicoId: 'usr_tecnico',
    tecnicoNome: 'Marcos Ferraz',
    dataAgendada: 'Hoje (23/09)',
    periodo: 'MANHA',
    ctoDesignada: 'CTO-CAM-014',
    portaCto: 5,
    sinalOpticoDbm: -21.4,
    metragemDropMetros: 38,
    ontSerialGpon: 'ZTEG9876214A',
    roteadorWifi6Serial: 'HWTWIFI6-4029',
    checklist: {
      passagemDrop: true,
      conectorizacaoFusao: true,
      testePotenciaOptica: true,
      provisionamentoOLT: true,
      speedtestValido: false,
      assinaturaCliente: false
    },
    observacoes: 'Cliente solicitou fixação da ONT próxima ao rack do home office.'
  },
  {
    id: 'OS-2026-0042',
    dealId: 'dl_002',
    contatoId: 'ct_002',
    clienteNome: 'Camp Express Logística Eireli',
    telefone: '(19) 3234-9800',
    endereco: 'Av. Engenheiro Antônio Francisco, 1020',
    bairro: 'Distrito Industrial',
    tipo: 'INSTALACAO',
    status: 'AGENDADA',
    planoNome: 'Link Dedicado Fibra 1 Giga B2B',
    tecnicoId: 'usr_tecnico',
    tecnicoNome: 'Marcos Ferraz',
    dataAgendada: 'Amanhã (24/09)',
    periodo: 'MANHA',
    ctoDesignada: 'CEO-IND-003 / CTO-008',
    portaCto: 2,
    sinalOpticoDbm: -19.8,
    metragemDropMetros: 95,
    ontSerialGpon: 'HWTC8829104F',
    roteadorWifi6Serial: 'CISCO-ISR-1100',
    checklist: {
      passagemDrop: false,
      conectorizacaoFusao: false,
      testePotenciaOptica: false,
      provisionamentoOLT: false,
      speedtestValido: false,
      assinaturaCliente: false
    },
    observacoes: 'Instalação em sala de servidores (DG). Necessário crachá de visitante na portaria.'
  },
  {
    id: 'OS-2026-0039',
    dealId: 'dl_005',
    contatoId: 'ct_005',
    clienteNome: 'Mercado Bom Preço',
    telefone: '(19) 3211-4455',
    endereco: 'Rua Barão de Jaguara, 890',
    bairro: 'Centro',
    tipo: 'UPGRADE_PLANO',
    status: 'CONCLUIDA',
    planoNome: 'Fibra PME 800 Mega',
    tecnicoId: 'usr_tecnico',
    tecnicoNome: 'Marcos Ferraz',
    dataAgendada: '22/09/2026',
    periodo: 'TARDE',
    ctoDesignada: 'CTO-CEN-002',
    portaCto: 7,
    sinalOpticoDbm: -20.1,
    metragemDropMetros: 22,
    ontSerialGpon: 'HWTC44551122',
    roteadorWifi6Serial: 'HWTWIFI6-1188',
    checklist: {
      passagemDrop: true,
      conectorizacaoFusao: true,
      testePotenciaOptica: true,
      provisionamentoOLT: true,
      speedtestValido: true,
      assinaturaCliente: true
    },
    observacoes: 'Substituição de ONT antiga por Wi-Fi 6 Gigabit. Speedtest aferiu 810 Mbps down / 412 Mbps up.'
  }
];

