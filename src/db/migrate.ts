import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, checkDatabaseConnection } from './client.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<boolean> {
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.log('[MIGRATE] Banco PostgreSQL não disponível no momento. Pulando execução de DDL.');
    return false;
  }

  const client = await pool.connect();
  try {
    console.log('[MIGRATE] Executando migrações no PostgreSQL 16...');
    const migrationFile = path.resolve(__dirname, 'migrations', '0000_initial.sql');
    if (fs.existsSync(migrationFile)) {
      const sql = fs.readFileSync(migrationFile, 'utf8');
      await client.query(sql);
      console.log('[MIGRATE] Migrações executadas com sucesso.');
      return true;
    } else {
      console.warn('[MIGRATE] Arquivo 0000_initial.sql não encontrado.');
      return false;
    }
  } catch (error: any) {
    console.error('[MIGRATE] Erro ao executar migrações:', error.message);
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
