import { contatosRepository, ContatosFilter } from './contatos.repository.ts';
import { Contato } from '../../types/index.ts';
import { auditoriaService } from '../auditoria/auditoria.service.ts';

export interface CreateContatoInput {
  nome: string;
  cpfCnpj?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  status?: string;
  tags?: string[];
  origem?: string;
}

class ContatosService {
  async listContatos(filters: ContatosFilter) {
    return contatosRepository.findMany(filters);
  }

  async getContatoById(id: string, instanceId?: string): Promise<Contato | null> {
    return contatosRepository.getById(id, instanceId);
  }

  async createContato(
    input: CreateContatoInput,
    actor: { id: string; name: string; role: any; instanceId?: string }
  ): Promise<Contato> {
    const newId = `ct_${Date.now().toString().slice(-6)}`;
    const novoContato: Contato = {
      id: newId,
      nome: input.nome.trim(),
      cpfCnpj: input.cpfCnpj || '',
      telefone: input.telefone || '',
      email: input.email || '',
      cep: input.cep || '13000-000',
      logradouro: input.logradouro || '',
      numero: input.numero || '',
      complemento: input.complemento,
      bairro: input.bairro || '',
      cidade: input.cidade || 'Campinas',
      uf: input.uf || 'SP',
      status: (input.status as any) || 'NOVO',
      tags: input.tags || ['LEAD_MANUAL'],
      origem: (input.origem as any) || 'SITE',
      dataCadastro: new Date().toISOString()
    };

    const saved = await contatosRepository.create(novoContato, actor.instanceId);

    await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CONTATO_CREATED',
      entityType: 'CONTATO',
      entityId: saved.id,
      details: `Contato "${saved.nome}" cadastrado com telefone ${saved.telefone}`,
      dadosPosteriores: saved
    });

    return saved;
  }

  async updateContato(
    id: string,
    partial: Partial<Contato>,
    actor: { id: string; name: string; role: any; instanceId?: string }
  ): Promise<Contato | null> {
    const previous = await contatosRepository.getById(id, actor.instanceId);
    if (!previous) return null;

    const updated = await contatosRepository.update(id, partial, actor.instanceId);

    await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CONTATO_UPDATED',
      entityType: 'CONTATO',
      entityId: id,
      details: `Contato "${previous.nome}" atualizado`,
      dadosAnteriores: previous,
      dadosPosteriores: updated
    });

    return updated;
  }

  async deleteContato(
    id: string,
    actor: { id: string; name: string; role: any; instanceId?: string }
  ): Promise<boolean> {
    const previous = await contatosRepository.getById(id, actor.instanceId);
    if (!previous) return false;

    const deleted = await contatosRepository.softDelete(id, actor.instanceId);

    await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CONTATO_DELETED',
      entityType: 'CONTATO',
      entityId: id,
      details: `Exclusão lógica do contato "${previous.nome}" (${id})`,
      dadosAnteriores: previous
    });

    return deleted;
  }
}

export const contatosService = new ContatosService();
