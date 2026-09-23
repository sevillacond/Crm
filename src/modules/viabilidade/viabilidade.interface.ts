export interface ViabilidadeQuery {
  cep: string;
  numero: string;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface ViabilidadeResult {
  modoExecucao: 'MOCK_DEMO_SIMULADO' | 'INTEGRACAO_REAL_GIS';
  isEstimativaHeuristica: boolean;
  avisoLegal: string;
  cep: string;
  numero: string;
  bairro: string;
  viavel: boolean;
  ctoId?: string;
  distanciaMetros?: number;
  portasLivres?: number;
  tecnologiaDisponivel: string;
  observacao: string;
}

export interface IViabilidadeAdapter {
  consultar(query: ViabilidadeQuery): Promise<ViabilidadeResult>;
}
