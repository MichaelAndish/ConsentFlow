import pg from 'pg';
import { SCHEMA_SQL } from './schema';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
    return process.env.DATABASE_URL.trim();
  }

  const host = process.env.PGHOST || process.env.DB_HOST || 'localhost';
  const port = process.env.PGPORT || process.env.DB_PORT || '5432';
  const user = process.env.PGUSER || process.env.DB_USER || 'consentflow';
  const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || 'consentflow_secret';
  const database = process.env.PGDATABASE || process.env.DB_NAME || 'consentflow_db';

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
    process.env.PGHOST ||
    process.env.DB_HOST ||
    process.env.POSTGRES_HOST
  );
}

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    const isCloudSQL = connectionString.includes('cloudsql') || process.env.INSTANCE_CONNECTION_NAME;
    const isProduction = process.env.NODE_ENV === 'production';

    // Lab/demo SSL: Cloud SQL often needs TLS. rejectUnauthorized:false is acceptable for
    // ephemeral hackathon projects only — production should use verified CA certs.
    pool = new Pool({
      connectionString,
      ssl: isCloudSQL || (isProduction && !connectionString.includes('localhost') && !connectionString.includes('db:5432'))
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.warn('[DB Pool Error]', err.message);
    });
  }

  return pool;
}

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const p = getPool();
  return p.query<T>(text, params);
}

export async function checkDatabaseHealth(): Promise<{ ok: boolean; message: string; version?: string }> {
  try {
    const res = await query('SELECT version()');
    return {
      ok: true,
      message: 'Connected to PostgreSQL / Cloud SQL',
      version: res.rows[0]?.version,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Database connection failed: ${err.message}`,
    };
  }
}

export async function initSchema(): Promise<void> {
  await query(SCHEMA_SQL);
  // Additive migrations for databases created before newer columns existed
  await query(`
    ALTER TABLE studies ADD COLUMN IF NOT EXISTS assigned_coordinator TEXT NOT NULL DEFAULT 'Unassigned';
    ALTER TABLE consistency_issues ADD COLUMN IF NOT EXISTS issue_type VARCHAR(64);
    ALTER TABLE consistency_issues ADD COLUMN IF NOT EXISTS resolution JSONB;
  `);
  console.log('[DB] Schema verified and initialized successfully.');
}
