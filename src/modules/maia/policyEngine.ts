import { MAIA_TOOL_REGISTRY, MaiaToolDefinition } from './toolRegistry.ts';

export type MaiaNivelAutonomia = 0 | 1 | 2 | 3 | 4;

export interface PolicyCheckResult {
  permitido: boolean;
  motivo?: string;
  requerAprovacaoHumana?: boolean;
}

export class MaiaPolicyEngine {
  private currentNivel: MaiaNivelAutonomia = 3; // Default Nivel 3 (Execução com confirmação)

  getNivel(): MaiaNivelAutonomia {
    return this.currentNivel;
  }

  setNivel(nivel: MaiaNivelAutonomia) {
    this.currentNivel = nivel;
  }

  evaluateToolExecution(toolName: string): PolicyCheckResult {
    // N0 - Desativada
    if (this.currentNivel === 0) {
      return {
        permitido: false,
        motivo: 'MaIA está desativada na política da instância (Nível 0).'
      };
    }

    const tool: MaiaToolDefinition = MAIA_TOOL_REGISTRY[toolName];
    if (!tool) {
      return {
        permitido: false,
        motivo: `Ferramenta '${toolName}' não registrada no Tool Registry seguro da MaIA.`
      };
    }

    if (this.currentNivel < tool.nivelMinimoAutonomia) {
      return {
        permitido: false,
        motivo: `Ferramenta requer nível mínimo N${tool.nivelMinimoAutonomia}. Instância configurada para N${this.currentNivel}.`
      };
    }

    // N3 requires human confirmation for write/sensitive operations
    if (this.currentNivel === 3 && tool.requerAprovacaoHumana) {
      return {
        permitido: true,
        requerAprovacaoHumana: true,
        motivo: 'Ação preparada para confirmação humana do operador (Nível 3).'
      };
    }

    return { permitido: true, requerAprovacaoHumana: false };
  }
}

export const maiaPolicyEngine = new MaiaPolicyEngine();
