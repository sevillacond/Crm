import { auditoriaRepository, AuditEventInput } from './auditoria.repository.ts';
import { AuditLog } from '../../types/index.ts';

class AuditoriaService {
  async listLogs(instanceId: string, limit?: number): Promise<AuditLog[]> {
    if (!instanceId || instanceId.trim() === '') {
      throw new Error('instanceId é obrigatório para listar auditoria.');
    }
    return auditoriaRepository.list(instanceId, limit);
  }

  async logEvent(input: AuditEventInput): Promise<AuditLog> {
    return auditoriaRepository.save(input);
  }
}

export const auditoriaService = new AuditoriaService();
