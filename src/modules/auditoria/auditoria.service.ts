import { auditoriaRepository, AuditEventInput } from './auditoria.repository.ts';
import { AuditLog } from '../../types/index.ts';

class AuditoriaService {
  async listLogs(limit?: number): Promise<AuditLog[]> {
    return auditoriaRepository.list(limit);
  }

  async logEvent(input: AuditEventInput): Promise<AuditLog> {
    return auditoriaRepository.save(input);
  }
}

export const auditoriaService = new AuditoriaService();
