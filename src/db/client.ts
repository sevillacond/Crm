import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.ts';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: databaseUrl,
  // Reasonable timeouts for connection checks
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
});

export const db = drizzle(pool, { schema });

let isConnected = false;

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!databaseUrl) {
    console.warn('[DB] DATABASE_URL não configurado. Operando em modo de fallback.');
    isConnected = false;
    return false;
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      isConnected = true;
      return true;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.warn(`[DB] PostgreSQL indisponível (${error.message}). Operando com armazenamento resiliente.`);
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}
