import { instancesRepository } from '../instances/instances.repository.ts';
import { isDbConnected } from '../../db/client.ts';
import { env } from '../../config/env.ts';

export type MaiaNivelAutonomia = 0 | 1 | 2 | 3 | 4;

export interface PolicyCheckResult {
  permitido: boolean;
  motivo?: string;
  requerAprovacaoHumana?: boolean;
  nivel: MaiaNivelAutonomia;
}

interface CacheEntry {
  nivel: MaiaNivelAutonomia;
  cachedAt: number;
}

export class MaiaPolicyEngine {
  // P0: Cache estritamente por instanceId com TTL - NUNCA uma autoridade global ou fallback silencioso
  private instancePolicyCache = new Map<string, CacheEntry>();
  private CACHE_TTL_MS = 30000; // 30 segundos
  private simulatedUnavailable = new Set<string>();

  setSimulatedPolicyUnavailable(instanceId: string, unavailable: boolean): void {
    if (unavailable) {
      this.simulatedUnavailable.add(instanceId);
      this.instancePolicyCache.delete(instanceId);
    } else {
      this.simulatedUnavailable.delete(instanceId);
    }
  }

  invalidateCache(instanceId: string): void {
    this.instancePolicyCache.delete(instanceId);
  }

  getNivel(instanceId?: string): MaiaNivelAutonomia {
    if (!instanceId) {
      if (env.NODE_ENV === 'production') {
        throw new Error('MAIA_POLICY_UNAVAILABLE: instanceId é estritamente obrigatório em produção.');
      }
      return 3;
    }

    if (this.simulatedUnavailable.has(instanceId)) {
      throw new Error('MAIA_POLICY_UNAVAILABLE');
    }

    const cached = this.instancePolicyCache.get(instanceId);
    if (cached && (Date.now() - cached.cachedAt) < this.CACHE_TTL_MS) {
      return cached.nivel;
    }

    return 3;
  }

  async loadNivelForInstance(instanceId: string): Promise<MaiaNivelAutonomia> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('MAIA_POLICY_UNAVAILABLE: instanceId é estritamente obrigatório.');
    }

    // P0: Teste / Simulação de indisponibilidade
    if (this.simulatedUnavailable.has(instanceId)) {
      throw new Error('MAIA_POLICY_UNAVAILABLE');
    }

    // P0: Fail-closed em produção se banco de dados estiver indisponível
    if (env.NODE_ENV === 'production' && !isDbConnected()) {
      throw new Error('MAIA_POLICY_UNAVAILABLE');
    }

    // Verificar se existe no cache válido
    const cached = this.instancePolicyCache.get(instanceId);
    if (cached && (Date.now() - cached.cachedAt) < this.CACHE_TTL_MS) {
      return cached.nivel;
    }

    try {
      const inst = await instancesRepository.getById(instanceId);
      if (inst && inst.maiaNivelAutonomia !== undefined) {
        const nivel = inst.maiaNivelAutonomia as MaiaNivelAutonomia;
        this.instancePolicyCache.set(instanceId, { nivel, cachedAt: Date.now() });
        return nivel;
      }

      if (env.NODE_ENV === 'production') {
        throw new Error('MAIA_POLICY_UNAVAILABLE');
      }

      // Em dev/test apenas: inicializar nível padrão local
      const defaultNivel: MaiaNivelAutonomia = 3;
      this.instancePolicyCache.set(instanceId, { nivel: defaultNivel, cachedAt: Date.now() });
      return defaultNivel;
    } catch (err: any) {
      if (err.message.includes('MAIA_POLICY_UNAVAILABLE')) {
        throw err;
      }
      if (env.NODE_ENV === 'production') {
        throw new Error('MAIA_POLICY_UNAVAILABLE');
      }
      throw err;
    }
  }

  async setNivel(nivel: MaiaNivelAutonomia, instanceId: string): Promise<void> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para alterar nível de autonomia.');
    }
    this.instancePolicyCache.set(instanceId, { nivel, cachedAt: Date.now() });
    await instancesRepository.update(instanceId, { maiaNivelAutonomia: nivel });
  }

  async evaluateToolExecution(
    toolName: string,
    instanceId: string,
    toolConfig?: { nivelMinimoAutonomia: number; requerAprovacaoHumana: boolean }
  ): Promise<PolicyCheckResult> {
    const nivel = await this.loadNivelForInstance(instanceId);

    // N0 - Desativada
    if (nivel === 0) {
      return {
        permitido: false,
        motivo: 'MaIA está desativada na política desta instância (Nível 0).',
        nivel: 0
      };
    }

    const nivelMinimo = toolConfig?.nivelMinimoAutonomia ?? 1;
    const requerAprovacao = toolConfig?.requerAprovacaoHumana ?? false;

    if (nivel < nivelMinimo) {
      return {
        permitido: false,
        motivo: `Ferramenta requer nível mínimo N${nivelMinimo}. Instância configurada para N${nivel}.`,
        nivel
      };
    }

    // P0: Aprovação humana obrigatória
    if (requerAprovacao || (nivel === 3 && requerAprovacao)) {
      return {
        permitido: true,
        requerAprovacaoHumana: true,
        motivo: 'Ação requer aprovação humana prévia do operador.',
        nivel
      };
    }

    return { permitido: true, requerAprovacaoHumana: false, nivel };
  }
}

export const maiaPolicyEngine = new MaiaPolicyEngine();
