import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_INSTANCE,
  INITIAL_USERS,
  INITIAL_PLANOS,
  INITIAL_CONTATOS,
  INITIAL_DEALS,
  INITIAL_AUDIT_LOGS
} from './src/data/mockData.ts';
import { Contato, Deal, AuditLog, DealEtapa } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-Memory Storage scoped strictly to this ISP Instance (Single-tenant isolation)
let instanceConfig = { ...INITIAL_INSTANCE };
let users = [...INITIAL_USERS];
let planos = [...INITIAL_PLANOS];
let contatos: Contato[] = [...INITIAL_CONTATOS];
let deals: Deal[] = [...INITIAL_DEALS];
let auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

function addAuditLog(
  actorId: string,
  actorName: string,
  actorRole: any,
  action: string,
  entityType: any,
  entityId: string,
  details: string,
  isMaiaAction: boolean = false
) {
  const newLog: AuditLog = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    actorId,
    actorName,
    actorRole,
    action,
    entityType,
    entityId,
    details,
    isMaiaAction
  };
  auditLogs.unshift(newLog);
  return newLog;
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// Health & Architecture check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    instanceId: instanceConfig.instanceId,
    cnpj: instanceConfig.cnpj,
    provedor: instanceConfig.nomeFantasia,
    database: instanceConfig.databaseEngine,
    isolation: 'SINGLE_TENANT_DEDICATED',
    versaoMaia: instanceConfig.versaoMaia,
    timestamp: new Date().toISOString()
  });
});

// Instance configuration
app.get('/api/instance', (_req: Request, res: Response) => {
  res.json(instanceConfig);
});

// Users list
app.get('/api/users', (_req: Request, res: Response) => {
  res.json(users);
});

// Planos
app.get('/api/planos', (_req: Request, res: Response) => {
  res.json(planos);
});

// Contatos
app.get('/api/contatos', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase();
  const status = req.query.status as string;

  let filtered = [...contatos];
  if (query) {
    filtered = filtered.filter(
      c =>
        c.nome.toLowerCase().includes(query) ||
        c.telefone.includes(query) ||
        c.cpfCnpj.includes(query) ||
        c.cidade.toLowerCase().includes(query) ||
        c.bairro.toLowerCase().includes(query)
    );
  }
  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }

  res.json(filtered);
});

app.post('/api/contatos', (req: Request, res: Response) => {
  const data = req.body;
  const newId = `ct_${Date.now().toString().slice(-6)}`;
  const novoContato: Contato = {
    id: newId,
    nome: data.nome || 'Novo Lead',
    cpfCnpj: data.cpfCnpj || '',
    telefone: data.telefone || '',
    email: data.email || '',
    cep: data.cep || '13000-000',
    logradouro: data.logradouro || '',
    numero: data.numero || '',
    complemento: data.complemento,
    bairro: data.bairro || '',
    cidade: data.cidade || instanceConfig.cidadeSede,
    uf: data.uf || instanceConfig.uf,
    status: data.status || 'NOVO',
    tags: data.tags || ['LEAD_MANUAL'],
    origem: data.origem || 'SITE',
    dataCadastro: new Date().toISOString()
  };

  contatos.unshift(novoContato);

  addAuditLog(
    data.actorId || 'usr_atendente_1',
    data.actorName || 'Atendente',
    data.actorRole || 'ATENDENTE',
    'CONTATO_CREATED',
    'CONTATO',
    newId,
    `Contato "${novoContato.nome}" cadastrado com telefone ${novoContato.telefone}`
  );

  res.status(201).json(novoContato);
});

// Deals
app.get('/api/deals', (_req: Request, res: Response) => {
  res.json(deals);
});

app.post('/api/deals', (req: Request, res: Response) => {
  const data = req.body;
  const newId = `dl_${Date.now().toString().slice(-6)}`;
  const novoDeal: Deal = {
    id: newId,
    titulo: data.titulo || 'Novo Negócio',
    contatoId: data.contatoId,
    planoId: data.planoId || planos[0].id,
    etapa: data.etapa || 'NOVO_LEAD',
    valorMensal: Number(data.valorMensal) || 99.90,
    taxaAdesao: Number(data.taxaAdesao) || 0,
    probabilidade: Number(data.probabilidade) || 50,
    dataPrevisao: data.dataPrevisao || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    responsavelId: data.responsavelId || 'usr_atendente_1',
    statusViabilidade: data.statusViabilidade || 'PENDENTE',
    notas: data.nota ? [data.nota] : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  deals.unshift(novoDeal);

  addAuditLog(
    data.actorId || 'usr_atendente_1',
    data.actorName || 'Atendente Comercial',
    data.actorRole || 'ATENDENTE',
    'DEAL_CREATED',
    'DEAL',
    newId,
    `Negócio "${novoDeal.titulo}" criado no valor de R$ ${novoDeal.valorMensal.toFixed(2)}/mês`
  );

  res.status(201).json(novoDeal);
});

app.patch('/api/deals/:id/stage', (req: Request, res: Response) => {
  const { id } = req.params;
  const { etapa, actorId, actorName, actorRole } = req.body;

  const dealIndex = deals.findIndex(d => d.id === id);
  if (dealIndex === -1) {
    res.status(404).json({ error: 'Negócio não encontrado' });
    return;
  }

  const oldStage = deals[dealIndex].etapa;
  deals[dealIndex].etapa = etapa as DealEtapa;
  deals[dealIndex].updatedAt = new Date().toISOString();

  // Probability adjustment based on stage
  const stageProbabilities: Record<DealEtapa, number> = {
    NOVO_LEAD: 20,
    VIABILIDADE: 40,
    PROPOSTA: 60,
    NEGOCIACAO: 80,
    INSTALACAO: 95,
    GANHO: 100,
    PERDIDO: 0
  };

  if (stageProbabilities[etapa as DealEtapa] !== undefined) {
    deals[dealIndex].probabilidade = stageProbabilities[etapa as DealEtapa];
  }

  addAuditLog(
    actorId || 'usr_supervisor',
    actorName || 'Supervisor',
    actorRole || 'SUPERVISOR',
    'DEAL_STAGE_UPDATED',
    'DEAL',
    id,
    `Negócio "${deals[dealIndex].titulo}" movido de [${oldStage}] para [${etapa}]. Probabilidade ajustada para ${deals[dealIndex].probabilidade}%.`
  );

  res.json(deals[dealIndex]);
});

// Feasibility / Viabilidade Técnica Endpoint (Simulação de CTOs da rede de fibra)
app.post('/api/viabilidade/consultar', (req: Request, res: Response) => {
  const { cep, numero, bairro, contatoId, actorId, actorName, actorRole, isMaia } = req.body;

  const cleanCep = (cep || '').replace(/\D/g, '');
  // Deterministic calculation based on CEP and house number to produce realistic results
  const hash = (cleanCep + (numero || '1')).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const isViavel = hash % 5 !== 0; // 80% viavel
  const dist = isViavel ? 20 + (hash % 85) : 340; // metros
  const ctoId = isViavel ? `CTO-${(bairro || 'CAM').substring(0, 3).toUpperCase()}-${String(hash % 99).padStart(3, '0')}` : undefined;
  const portas = isViavel ? 2 + (hash % 10) : 0;

  const result = {
    cep,
    numero,
    bairro: bairro || 'Centro',
    viavel: isViavel,
    ctoId,
    distanciaMetros: dist,
    portasLivres: portas,
    tecnologiaDisponivel: isViavel ? 'FTTH GPON (Fibra Óptica)' : 'Sem viabilidade óptica imediata',
    observacao: isViavel
      ? `Viabilidade 100% aprovada. CTO ${ctoId} a ${dist}m de distância com ${portas} portas ópticas livres.`
      : 'Necessário projeto de extensão de rede ou atendimento via Rádio enlace dedicado.'
  };

  // If deal or contact associated, update feasibility status
  if (contatoId) {
    const contato = contatos.find(c => c.id === contatoId);
    if (contato) {
      contato.status = isViavel ? 'VIAVEL' : 'INVIAVEL';
    }
    const deal = deals.find(d => d.contatoId === contatoId);
    if (deal) {
      deal.statusViabilidade = isViavel ? 'VIAVEL_CTO' : 'INVIAVEL';
      if (ctoId) deal.ctoProxima = ctoId;
      deal.distanciaMetros = dist;
    }
  }

  addAuditLog(
    actorId || (isMaia ? 'usr_maia' : 'usr_atendente_1'),
    actorName || (isMaia ? 'MaIA (Agente IA)' : 'Atendente'),
    actorRole || (isMaia ? 'MAIA_AGENT' : 'ATENDENTE'),
    isMaia ? 'MAIA_TOOL_VIABILIDADE_EXECUTED' : 'VIABILIDADE_CONSULTADA',
    'VIABILIDADE',
    ctoId || 'GEO_SEARCH',
    `Consulta de viabilidade CEP ${cep}, nº ${numero}. Resultado: ${isViavel ? 'VIÁVEL' : 'INVIÁVEL'} (Dist: ${dist}m, Portas: ${portas}).`,
    !!isMaia
  );

  res.json(result);
});

// Audit Logs
app.get('/api/audit', (_req: Request, res: Response) => {
  res.json(auditLogs);
});

// MaIA AI Co-Pilot & Autonomous Tool Execution
app.post('/api/maia/chat', async (req: Request, res: Response) => {
  const { prompt, dealId, contatoId, context } = req.body;

  const targetContato = contatoId ? contatos.find(c => c.id === contatoId) : null;
  const targetDeal = dealId ? deals.find(d => d.id === dealId) : null;

  const systemContext = `
Você é a MaIA (Módulo de Automação e Inteligência Artificial) do Enlace-CRM, um CRM especializado para Provedores Regionais de Internet (ISPs) e Operadoras de Telecomunicações.
Instância atual: ${instanceConfig.nomeFantasia} (CNPJ: ${instanceConfig.cnpj}, Cidade Sede: ${instanceConfig.cidadeSede}-${instanceConfig.uf}).
Total de CTOs na rede: ${instanceConfig.totalCtos}, Portas Livres: ${instanceConfig.totalPortasDisponiveis}.

Regras Obrigatórias de Governança da MaIA (PRD item 8):
1. Você opera sob governança estrita e princípio do menor privilégio.
2. Seu tom é profissional, assertivo, especializado em telecomunicações (banda larga, FTTH, latência, CTO, Wi-Fi 6, SLA, BGP, links dedicados).
3. Todas as suas ações de ferramentas são registradas na trilha de auditoria para o supervisor.
4. Quando o usuário pedir para qualificar um lead, consultar viabilidade técnica ou recomendar um plano, use dados concretos dos planos da operadora:
${planos.map(p => `- ${p.nome}: R$ ${p.precoMensal.toFixed(2)}/mês (${p.downloadMbps}M down / ${p.uploadMbps}M up) - ${p.tecnologia}`).join('\n')}

Se houver contato/deal selecionado:
${targetContato ? `Contato atual: ${targetContato.nome}, Tel: ${targetContato.telefone}, Endereço: ${targetContato.logradouro}, ${targetContato.numero} - ${targetContato.bairro}, CEP: ${targetContato.cep}, Status: ${targetContato.status}` : 'Nenhum contato específico selecionado.'}
${targetDeal ? `Negócio atual: ${targetDeal.titulo}, Etapa: ${targetDeal.etapa}, Valor: R$ ${targetDeal.valorMensal}/mês, Viabilidade: ${targetDeal.statusViabilidade}` : ''}
`;

  try {
    let aiResponseText = '';
    let toolActionExecuted: any = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI();
        // Use gemini-2.5-flash as the primary recommended standard model
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: `${systemContext}\n\nSolicitação do Operador/Supervisor: ${prompt}` }] }
          ]
        });
        aiResponseText = response.text || 'Processamento concluído pela MaIA.';
      } catch (geminiError: any) {
        console.warn('Gemini model request encountered limit or error, using telecom heuristic engine:', geminiError?.message);
      }
    }

    if (!aiResponseText) {
      // Robust domain-expert fallback when API key is unavailable or quota limited
      const p = (prompt || '').toLowerCase();
      if (p.includes('viabilidade') || p.includes('cep') || p.includes('cto')) {
        aiResponseText = `[MaIA Telecom] Analisei o endereço e a topologia óptica. A região possui cobertura via fibra FTTH GPON com CTO próxima a menos de 45 metros. Portas disponíveis: 4. Recomendo avançar para apresentação de proposta com o plano Fibra 600 Mega Gamer.`;
        toolActionExecuted = {
          name: 'consultar_viabilidade',
          cep: targetContato?.cep || '13024-000',
          numero: targetContato?.numero || '450',
          resultado: 'VIÁVEL_CTO'
        };
      } else if (p.includes('proposta') || p.includes('plano') || p.includes('preço')) {
        aiResponseText = `[MaIA Telecom] Analisando o perfil do cliente, o plano ideal é o **Fibra Gamer Turbo 600 Mega** (R$ 119,90/mês). Oferece Wi-Fi 6 de baixa latência e rota otimizada, excelente relação custo-benefício para reter o cliente sem concessão desnecessária de desconto.`;
        toolActionExecuted = {
          name: 'recomendar_plano',
          plano: 'Fibra Gamer Turbo 600 Mega',
          mrrEstimado: 119.90
        };
      } else if (p.includes('qualificar') || p.includes('score')) {
        const score = 92;
        if (targetContato) {
          targetContato.scoreMaia = score;
          targetContato.resumoMaia = 'Lead com alta propensão de fechamento e interesse imediato em portabilidade.';
        }
        aiResponseText = `[MaIA Telecom] Lead qualificado com **Score 92/100** (Alta Prioridade / Hot Lead). Necessidade crítica de estabilidade identificada, viabilidade técnica confirmada e sem restrições cadastrais. Recomendo agendar instalação em até 48h.`;
        toolActionExecuted = {
          name: 'qualificar_lead',
          score: 92,
          temperatura: 'QUENTE'
        };
      } else {
        aiResponseText = `[MaIA v3.8] Compreendi sua solicitação operacional. Analisei os parâmetros da instância ${instanceConfig.nomeFantasia}. Estou pronta para executar verificações de CTO, qualificação de leads, sugestão de planos ou envio de propostas autorizadas.`;
      }
    }

    const auditLog = addAuditLog(
      'usr_maia',
      'MaIA (Agente IA)',
      'MAIA_AGENT',
      'MAIA_INTERACTION_PROCESSED',
      'MAIA_TOOL',
      dealId || contatoId || 'GENERAL',
      `Prompt processado: "${prompt.substring(0, 70)}...". Ação: ${toolActionExecuted ? toolActionExecuted.name : 'ANÁLISE_CONVERSACIONAL'}`,
      true
    );

    res.json({
      resposta: aiResponseText,
      toolExecutada: toolActionExecuted?.name,
      parametrosTool: toolActionExecuted,
      auditId: auditLog.id
    });
  } catch (error: any) {
    console.error('Erro na MaIA:', error);
    res.status(500).json({ error: error.message || 'Falha no processamento da MaIA' });
  }
});

// -------------------------------------------------------------
// VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Enlace-CRM] Servidor ativo na porta ${PORT} | Instância: ${instanceConfig.instanceId}`);
  });
}

startServer().catch(err => {
  console.error('Falha ao iniciar Enlace-CRM:', err);
});
