import { planosRepository } from './planos.repository.ts';
import { Plano } from '../../types/index.ts';

class PlanosService {
  async getAll(): Promise<Plano[]> {
    return planosRepository.getAll();
  }

  async getById(id: string): Promise<Plano | null> {
    return planosRepository.getById(id);
  }
}

export const planosService = new PlanosService();
