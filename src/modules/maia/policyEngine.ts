import { MAIA_TOOL_REGISTRY, MaiaToolDefinition } from './toolRegistry.ts';
import { instancesRepository } from '../instances/instances.repository.ts';

export type MaiaNivelAutonomia = 0 | 1 | 2 | 3 | 4;

export interface PolicyCheckResult {
  permitido: boolean;
  motivo?: string;
  requerAprovacaoHumana?: boolean;
}

export class MaiaPolicyEngine {
  private currentNivel: MaiaNivelAutonomia = 3; // Default Nivel 3
  private instanceNiveis = new Map<string, MaiaNivelAutonomia>();

  getNivel(instanceId?: string): MaiaNivelAutonomia {
    if (instanceId && this.instanceNiveis.has(instanceId)) {
      return this.instanceNiveis.get(instanceId)!;
    }
    return this.currentNivel;
  }

  async loadNivelForInstance(instanceId: string): Promise<MaiaNivelAutonomia> {
    try {
      const inst = await instancesRepository.getById(instanceId);
      if (inst && inst.maiaNivelAutonomia !== undefined) {
        const nivel = inst.maiaNivelAutonomia as MaiaNivelAutonomia;
        this.instanceNiveis.set(instanceId, nivel);
        this.currentNivel = nivel;
        return nivel;
      }
    } catch {
      // Use in-memory default
    }
    return this.getNivel(instanceId);
  }

  async setNivel(nivel: MaiaNivelAutonomia, instanceId?: string): Promise<void> {
    this.currentNivel = nivel;
    if (instanceId) {
      this.instanceNiveis.set(instanceId, nivel);
      try {
        await instancesRepository.update(instanceId, { maiaNivelAutonomia: nivel });
      } catch (err: any) {
        console.warn(`[MaiaPolicyEngine] Falha ao persistir nível de autonomia da instância ${instanceId}:`, err.message);
      }
    }
  }

  evaluateToolExecution(toolName: string, instanceId?: string): PolicyCheckResult {
    const nivel = this.getNivel(instanceId);

    // N0 - Desativada
    if (nivel === 0) {
      return {
        permitido: false,
        motivo: 'MaIA está desativada na política desta instância (Nível 0).'
      };
    }

    const tool: MaiaToolDefinition = MAIA_TOOL_REGISTRY[toolName];
    if (!tool) {
      return {
        permitido: false,
        motivo: `Ferramenta '${toolName}' não registrada no Tool Registry seguro da MaIA.`
      };
    }

    if (nivel < tool.nivelMinimoAutonomia) {
      return {
        permitido: false,
        motivo: `Ferramenta requer nível mínimo N${tool.nivelMinimoAutonomia}. Instância configurada para N${nivel}.`
      };
    }

    // N3 requires human confirmation for write/sensitive operations
    if (nivel === 3 && tool.requerAprovacaoHumana) {
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
