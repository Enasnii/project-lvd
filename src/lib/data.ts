import { Product, ProductInput } from './types';
import {
  createProduct as createStoredProduct,
  deleteProduct as deleteStoredProduct,
  getProducts as getStoredProducts,
  updateProduct as updateStoredProduct
} from './products-store';

export async function uploadImageToBlob(file: File): Promise<string> {
  const { put } = await import('@vercel/blob');

  const blob = await put(file.name, file, {
    access: 'public',
    contentType: file.type
  });

  return blob.url;
}

export async function getProducts(): Promise<Product[]> {
  return getStoredProducts();
}

export async function createProduct(input: ProductInput): Promise<Product> {
  return createStoredProduct(input);
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  return updateStoredProduct(id, input);
}

export async function deleteProduct(id: string): Promise<void> {
  return deleteStoredProduct(id);
}