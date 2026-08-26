import { del, list, put } from '@vercel/blob';
import { ProductRequest, ProductRequestInput } from './types';

const storagePath = 'data/product-requests.json';
const requestStoragePrefix = 'data/product-requests/';

async function readJsonBlob(url: string): Promise<ProductRequest[]> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Aanvragen konden niet worden gelezen (${response.status}).`);

  const parsed = await response.json();
  return Array.isArray(parsed) ? parsed as ProductRequest[] : [];
}

async function readRequests(): Promise<ProductRequest[]> {
  const requests: ProductRequest[] = [];
  const result = await list({ prefix: storagePath, limit: 1 });
  const blob = result.blobs.find((item) => item.pathname === storagePath);
  if (blob) requests.push(...await readJsonBlob(blob.url));

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
    createdAt: new Date().toISOString()
  };

  await put(`${requestStoragePrefix}${request.id}.json`, JSON.stringify([request]), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json'
  });
  return request;
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
