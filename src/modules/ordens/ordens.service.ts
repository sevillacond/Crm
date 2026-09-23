import { ordensRepository } from './ordens.repository.ts';
import { OrdemServico, OSStatus } from '../../types/index.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';

class OrdensService {
  async listAll(): Promise<OrdemServico[]> {
    return ordensRepository.getAll();
  }

  async getById(id: string): Promise<OrdemServico | null> {
    return ordensRepository.getById(id);
  }

  async updateStatus(
    id: string,
    status: OSStatus,
    actor: { id: string; name: string; role: any }
  ): Promise<OrdemServico | null> {
    const updated = await ordensRepository.updateStatus(id, status);
    if (updated) {
      await auditoriaService.logEvent({
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
