import { planosRepository } from './planos.repository.ts';
import { Plano } from '../../types/index.ts';

class PlanosService {
  async getAll(instanceId: string): Promise<Plano[]> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para listar planos.');
    }
    return planosRepository.getAll(instanceId);
  }

  async getById(id: string, instanceId: string): Promise<Plano | null> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para consultar plano.');
    }
    return planosRepository.getById(id, instanceId);
  }
}

export const planosService = new PlanosService();
