import { ordensRepository } from './ordens.repository.ts';
import { contatosRepository } from '../contatos/contatos.repository.ts';
import { dealsRepository } from '../deals/deals.repository.ts';
import { OrdemServico, OSStatus } from '../../types/index.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';

class OrdensService {
  async listAll(instanceId?: string): Promise<OrdemServico[]> {
    return ordensRepository.getAll(instanceId);
  }

  async getById(id: string, instanceId?: string): Promise<OrdemServico | null> {
    return ordensRepository.getById(id, instanceId);
  }

  async createOS(
    os: OrdemServico,
    actor: { id: string; name: string; role: any; instanceId: string }
  ): Promise<OrdemServico> {
    if (!actor || !actor.instanceId) {
      throw new Error('instanceId é obrigatório para cadastrar OS.');
    }

    // P0 PARTE 18: Validar contato na mesma instância
    const contato = await contatosRepository.getById(os.contatoId, actor.instanceId);
    if (!contato) {
      throw new Error(`Acesso negado: Contato ${os.contatoId} não encontrado na instância.`);
    }

    // Validar deal se informado
    if (os.dealId) {
      const deal = await dealsRepository.getById(os.dealId, actor.instanceId);
      if (!deal) {
        throw new Error(`Acesso negado: Negócio ${os.dealId} não encontrado na instância.`);
      }
    }

    const created = await ordensRepository.create(os, actor.instanceId);

    await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'OS_CREATED',
      entityType: 'ORDEM_SERVICO',
      entityId: created.id,
      details: `Ordem de Serviço ${created.id} gerada para ${created.clienteNome}`,
      dadosPosteriores: created
    });

    return created;
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
