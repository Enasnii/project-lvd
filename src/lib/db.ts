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
  await runSql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;`);
  await runSql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';`);
  await runSql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;`);
  await runSql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB NOT NULL DEFAULT '[]'::jsonb;`);
  await runSql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb;`);
  await runSql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS main_image_url TEXT NOT NULL DEFAULT '';`);
  await runSql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';`);
  await runSql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await runSql(`UPDATE products SET status = 'published' WHERE status IS NULL OR status = '';`);
  await runSql(`UPDATE products SET status = 'hidden' WHERE status = 'draft';`);
  await runSql(`UPDATE products SET updated_at = created_at WHERE updated_at IS NULL;`);
  await runSql(`CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique ON products (slug) WHERE slug IS NOT NULL;`);
}
