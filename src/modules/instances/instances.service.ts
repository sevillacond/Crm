import { instancesRepository } from './instances.repository.ts';
import { InstanceConfig } from '../../types/index.ts';

class InstancesService {
  async getInstance(id?: string): Promise<InstanceConfig> {
    if (id) {
      const inst = await instancesRepository.getById(id);
      if (inst) return inst;
    }
    return instancesRepository.getDefault();
  }

  async updateInstance(id: string, partial: Partial<InstanceConfig>): Promise<InstanceConfig> {
    return instancesRepository.update(id, partial);
  }
}

export const instancesService = new InstancesService();
