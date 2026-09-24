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

  /**
   * P0: Única fonte da verdade de leitura de autonomia.
   * Não possui fallbacks fictícios (sempre Fail-Closed se indisponível).
   */
  async loadNivelForInstance(instanceId: string): Promise<MaiaNivelAutonomia> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('MAIA_POLICY_UNAVAILABLE: instanceId é estritamente obrigatório.');
    }

    // 1. Simulação explícita de indisponibilidade para testes de segurança
    if (this.simulatedUnavailable.has(instanceId)) {
      throw new Error('MAIA_POLICY_UNAVAILABLE');
    }

    // 2. Fail-closed em produção se banco de dados estiver desconectado
    if (env.NODE_ENV === 'production' && !isDbConnected()) {
      throw new Error('MAIA_POLICY_UNAVAILABLE: Banco de dados PostgreSQL indisponível em produção.');
    }

    // 3. Cache como otimização transitória (não autoridade)
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

      // Se a instância não foi localizada no banco, fail closed
      throw new Error(`MAIA_POLICY_UNAVAILABLE: Política não configurada para a instância ${instanceId}.`);
    } catch (err: any) {
      if (err.message.includes('MAIA_POLICY_UNAVAILABLE')) {
        throw err;
      }
      throw new Error(`MAIA_POLICY_UNAVAILABLE: ${err.message}`);
    }
  }

  /**
   * Alias assíncrono para garantir que GET /maia/status e POST /maia/chat consultem a mesma fonte
   */
  async getNivel(instanceId: string): Promise<MaiaNivelAutonomia> {
    return this.loadNivelForInstance(instanceId);
  }

  /**
   * P0: Atualização consistente de política de autonomia.
   * Regra PARTE 12:
   * 1. Invalida cache preventivamente
   * 2. UPDATE PostgreSQL (Autoridade)
   * 3. Sucesso -> registrar cache atualizado
   */
  async setNivel(nivel: MaiaNivelAutonomia, instanceId: string): Promise<void> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para alterar nível de autonomia.');
    }
    if (typeof nivel !== 'number' || nivel < 0 || nivel > 4) {
      throw new Error('Nível de autonomia deve ser um número entre 0 e 4.');
    }

    // Invalidação prévia para evitar leituras inconsistentes durante mutação
    this.instancePolicyCache.delete(instanceId);

    // Persistência no PostgreSQL (Autoridade única)
    await instancesRepository.update(instanceId, { maiaNivelAutonomia: nivel });

    // Apenas após sucesso no PostgreSQL, atualizar cache de leitura
    this.instancePolicyCache.set(instanceId, { nivel, cachedAt: Date.now() });
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
