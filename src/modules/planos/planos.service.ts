import { planosRepository } from './planos.repository.ts';
import { Plano } from '../../types/index.ts';

class PlanosService {
  async getAll(instanceId?: string): Promise<Plano[]> {
    return planosRepository.getAll(instanceId);
  }

  async getById(id: string, instanceId?: string): Promise<Plano | null> {
    return planosRepository.getById(id, instanceId);
  }
}

export const planosService = new PlanosService();
