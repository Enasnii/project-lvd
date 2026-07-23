// Test script for Vercel Blob write using @vercel/blob
const { put } = require('@vercel/blob');
require('dotenv').config();

(async () => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN not found in environment (.env.local)');
    process.exitCode = 1;
    return;
  }

  try {
    const key = `debug/test-blob-${Date.now()}.json`;
    const content = Buffer.from(JSON.stringify({ ts: new Date().toISOString() }));
    const res = await put(key, content, { access: 'public', contentType: 'application/json' });
    console.log('SUCCESS', res?.url ?? 'no-url');
  } catch (err) {
    console.error('ERROR', err && err.message ? err.message : err);
    process.exitCode = 2;
  }
})();
