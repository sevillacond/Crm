import { ordensRepository } from './ordens.repository.ts';
import { OrdemServico, OSStatus } from '../../types/index.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';

class OrdensService {
  async listAll(instanceId?: string): Promise<OrdemServico[]> {
    return ordensRepository.getAll(instanceId);
  }

  async getById(id: string, instanceId?: string): Promise<OrdemServico | null> {
    return ordensRepository.getById(id, instanceId);
  }

  async updateStatus(
    id: string,
    status: OSStatus,
    actor: { id: string; name: string; role: any; instanceId?: string }
  ): Promise<OrdemServico | null> {
    const updated = await ordensRepository.updateStatus(id, status, actor.instanceId);
    if (updated) {
      await auditoriaService.logEvent({
        instanceId: actor.instanceId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'OS_STATUS_UPDATED',
        entityType: 'ORDEM_SERVICO',
        entityId: id,
        details: `Ordem de Serviço ${id} atualizada para ${status}`,
        dadosPosteriores: { status }
      });
    }
    return updated;
  }
}

export const ordensService = new OrdensService();
