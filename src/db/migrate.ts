import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { pool, checkDatabaseConnection } from './client.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AppliedMigration {
  id: number;
  filename: string;
  checksum: string;
  applied_at: Date;
}

export async function runMigrations(): Promise<boolean> {
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.log('[MIGRATE] Banco PostgreSQL não disponível no momento. Pulando execução de DDL.');
    return false;
  }

  const client = await pool.connect();
  try {
    console.log('[MIGRATE] Inicializando engine de controle de migrações...');

    // 1. Criar tabela de controle de migrações se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Consultar migrações já aplicadas
    const { rows: appliedRows } = await client.query<AppliedMigration>(
      `SELECT id, filename, checksum, applied_at FROM schema_migrations ORDER BY id ASC;`
    );

    const appliedMap = new Map<string, string>();
    for (const row of appliedRows) {
      appliedMap.set(row.filename, row.checksum);
    }

    // 3. Ler arquivos de migração disponíveis
    const migrationsDir = path.resolve(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.warn('[MIGRATE] Diretório migrations não encontrado.');
      return false;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    let appliedCount = 0;

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      const currentChecksum = crypto.createHash('sha256').update(sqlContent, 'utf8').digest('hex');

      // Se a migração já foi aplicada, verificar integridade do checksum
      if (appliedMap.has(file)) {
        const storedChecksum = appliedMap.get(file);
        if (storedChecksum !== currentChecksum) {
          throw new Error(
            `[FATAL] Violação de integridade de migração: O arquivo ${file} já foi aplicado em produção mas seu conteúdo/checksum foi modificado. Checksum anterior: ${storedChecksum}, atual: ${currentChecksum}.`
          );
        }
        continue;
      }

      // Migração pendente: executar dentro de transação atômica
      console.log(`[MIGRATE] Aplicando migration pendente: ${file}...`);
      try {
        await client.query('BEGIN');
        await client.query(sqlContent);
        await client.query(
          `INSERT INTO schema_migrations (filename, checksum, applied_at) VALUES ($1, $2, NOW())`,
          [file, currentChecksum]
        );
        await client.query('COMMIT');
        appliedCount++;
        console.log(`[MIGRATE] Migration ${file} aplicada e registrada com sucesso.`);
      } catch (migrationErr: any) {
        await client.query('ROLLBACK');
        console.error(`[MIGRATE] Falha ao aplicar migration ${file}:`, migrationErr.message);
        throw new Error(`Falha na migration ${file}: ${migrationErr.message}`);
      }
    }

    if (appliedCount === 0) {
      console.log(`[MIGRATE] Todas as ${files.length} migrações já estão sincronizadas e íntegras.`);
    } else {
      console.log(`[MIGRATE] ${appliedCount} novas migrações aplicadas com sucesso. Total: ${files.length}.`);
    }

    return true;
  } catch (error: any) {
    console.error('[MIGRATE] Erro no pipeline de migrações:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Allow direct execution: `npx tsx src/db/migrate.ts`
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
