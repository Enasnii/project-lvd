import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

function getPool() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error('POSTGRES_URL is required.');
  }

  if (!pool) {
    const poolConfig: PoolConfig = {
      connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    };

    pool = new Pool(poolConfig);
  }

  return pool;
}

export async function runSql<T = any>(query: string, params: unknown[] = []) {
  const result = await getPool().query(query, params);
  return result as { rows: T[]; rowCount: number | null };
}

export async function initDatabase() {
  await runSql(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price TEXT NOT NULL,
      image_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await runSql(`ALTER TABLE products ALTER COLUMN price TYPE TEXT USING price::text;`);
}
