import { ProductRequest, ProductRequestInput, ProductRequestStatus } from './types';
import { readJsonFile, saveUploadedFile, writeJsonFile } from './local-storage';

const storagePath = 'data/product-requests.json';

async function readRequests(): Promise<ProductRequest[]> {
  const parsed = await readJsonFile(storagePath, []);
  const requests = Array.isArray(parsed) ? parsed as ProductRequest[] : [];
  return requests.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

async function writeRequests(requests: ProductRequest[]) {
  await writeJsonFile(storagePath, requests);
}

export async function getProductRequests(): Promise<ProductRequest[]> {
  return readRequests();
}

export async function createProductRequest(input: ProductRequestInput): Promise<ProductRequest> {
  const request: ProductRequest = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
    status: 'new'
  };

  const requests = await readRequests();
  requests.unshift(request);
  await writeRequests(requests);
  return request;
}

export async function updateProductRequestStatus(id: string, status: ProductRequestStatus): Promise<ProductRequest> {
  const requests = await readRequests();
  const index = requests.findIndex((request) => request.id === id);
  if (index === -1) throw new Error('Aanvraag niet gevonden.');

  const updatedRequest = { ...requests[index], status };
  requests[index] = updatedRequest;
  await writeRequests(requests);
  return updatedRequest;
}

export async function deleteProductRequest(id: string): Promise<void> {
  const requests = await readRequests();
  const filtered = requests.filter((request) => request.id !== id);
  if (filtered.length === requests.length) {
    throw new Error('Aanvraag niet gevonden.');
  }

  await writeRequests(filtered);
}

export async function uploadRequestImage(file: File): Promise<string> {
  return saveUploadedFile(file, 'product-requests');
}
