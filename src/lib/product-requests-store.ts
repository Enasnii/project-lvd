import { del, list, put } from '@vercel/blob';
import { ProductRequest, ProductRequestInput, ProductRequestStatus } from './types';

const storagePath = 'data/product-requests.json';
const requestStoragePrefix = 'data/product-requests/';
const migrationMarkerPath = 'data/product-requests-migrated.json';

async function readJsonBlob(url: string): Promise<ProductRequest[]> {
  const separator = url.includes('?') ? '&' : '?';
  const response = await fetch(`${url}${separator}cacheBust=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Aanvragen konden niet worden gelezen (${response.status}).`);

  const parsed = await response.json();
  return Array.isArray(parsed)
    ? (parsed as ProductRequest[]).map((request) => ({ ...request, status: request.status ?? 'new' }))
    : [];
}

async function readRequests(): Promise<ProductRequest[]> {
  const requests: ProductRequest[] = [];
  const markerResult = await list({ prefix: migrationMarkerPath, limit: 1 });
  const isMigrated = markerResult.blobs.some((item) => item.pathname === migrationMarkerPath);

  if (!isMigrated) {
    const result = await list({ prefix: storagePath, limit: 1 });
    const legacyBlob = result.blobs.find((item) => item.pathname === storagePath);
    if (legacyBlob) {
      const legacyRequests = await readJsonBlob(legacyBlob.url);
      for (const request of legacyRequests) {
        await put(`${requestStoragePrefix}${request.id}.json`, JSON.stringify([request]), {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'application/json'
        });
      }

      await put(migrationMarkerPath, 'migrated', {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'text/plain'
      });
      await del(legacyBlob.url);
    }
  }

  const requestBlobs = await list({ prefix: requestStoragePrefix });
  const storedRequests = await Promise.all(
    requestBlobs.blobs.map((requestBlob) => readJsonBlob(requestBlob.url))
  );

  for (const storedRequest of storedRequests) {
    requests.push(...storedRequest);
  }

  return requests.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

async function writeRequests(requests: ProductRequest[]) {
  await put(storagePath, JSON.stringify(requests, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json'
  });
}

export async function getProductRequests(): Promise<ProductRequest[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN ontbreekt.');
  }

  return readRequests();
}

export async function createProductRequest(input: ProductRequestInput): Promise<ProductRequest> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN ontbreekt.');
  }

  const request: ProductRequest = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
    status: 'new'
  };

  await put(`${requestStoragePrefix}${request.id}.json`, JSON.stringify([request]), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json'
  });
  return request;
}

export async function updateProductRequestStatus(id: string, status: ProductRequestStatus): Promise<ProductRequest> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN ontbreekt.');
  }

  const requestBlobs = await list({ prefix: requestStoragePrefix });
  const requestBlob = requestBlobs.blobs.find((blob) => blob.pathname === `${requestStoragePrefix}${id}.json`);
  if (!requestBlob) throw new Error('Aanvraag niet gevonden.');

  const stored = await readJsonBlob(requestBlob.url);
  const request = stored[0];
  if (!request) throw new Error('Aanvraag niet gevonden.');

  const updatedRequest = { ...request, status };
  await put(requestBlob.pathname, JSON.stringify([updatedRequest]), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json'
  });
  return updatedRequest;
}

export async function deleteProductRequest(id: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN ontbreekt.');
  }

  const requestBlobs = await list({ prefix: requestStoragePrefix });
  const requestBlob = requestBlobs.blobs.find((blob) => blob.pathname === `${requestStoragePrefix}${id}.json`);
  if (requestBlob) {
    await del(requestBlob.url);
    return;
  }

  const requests = await readRequests();
  const filtered = requests.filter((request) => request.id !== id);
  if (filtered.length === requests.length) {
    throw new Error('Aanvraag niet gevonden.');
  }

  await writeRequests(filtered);
}

export async function uploadRequestImage(file: File): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN ontbreekt.');
  }

  const safeName = (file.name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '-');
  const blob = await put(`product-requests/${crypto.randomUUID()}-${safeName}`, file, {
    access: 'public',
    contentType: file.type || 'application/octet-stream'
  });

  return blob.url;
}
