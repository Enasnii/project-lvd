import { put } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';
import { Product, ProductInput } from './types';

const initialProducts: Product[] = [
  {
    id: 'sample-1',
    name: 'Premium Vinyl Sticker',
    description: 'Duurzame vinyl sticker voor verpakking en promoties.',
    price: 14.95,
    imageUrl: 'https://images.unsplash.com/photo-1582053433976-25c00369fc93?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-2',
    name: 'Matte Label Set',
    description: 'Set van 10 matte labels voor producten en verpakkingen.',
    price: 24.5,
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-3',
    name: 'Event Promo Sticker',
    description: 'Opvallende sticker voor beurs-, festival- en launch-events.',
    price: 9.95,
    imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date().toISOString()
  }
];

const storageKey = 'products.json';
const localFilePath = path.join(process.cwd(), '.data', storageKey);

async function ensureLocalDataDir() {
  await fs.mkdir(path.dirname(localFilePath), { recursive: true });
}

async function readProductsFromLocalFile(): Promise<Product[]> {
  try {
    await ensureLocalDataDir();
    const file = await fs.readFile(localFilePath, 'utf8');
    const parsed = JSON.parse(file);
    return Array.isArray(parsed) ? parsed : initialProducts;
  } catch {
    return initialProducts;
  }
}

async function writeProductsToLocalFile(products: Product[]) {
  await ensureLocalDataDir();
  await fs.writeFile(localFilePath, JSON.stringify(products, null, 2), 'utf8');
}

async function readProductsFromBlob(): Promise<Product[]> {
  try {
    const response = await fetch(`https://blob.vercel-storage.com/${storageKey}`);
    if (!response.ok) return initialProducts;
    const text = await response.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : initialProducts;
  } catch {
    return initialProducts;
  }
}

async function writeProductsToBlob(products: Product[]) {
  await put(storageKey, JSON.stringify(products, null, 2), {
    access: 'public',
    contentType: 'application/json'
  });
}

async function getProductsFromStorage(): Promise<Product[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      return await readProductsFromBlob();
    } catch {
      return initialProducts;
    }
  }

  return readProductsFromLocalFile();
}

async function setProductsInStorage(products: Product[]) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await writeProductsToBlob(products);
    return;
  }

  await writeProductsToLocalFile(products);
}

export async function getProducts(): Promise<Product[]> {
  return getProductsFromStorage();
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const products = await getProductsFromStorage();
  const product: Product = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: input.description.trim(),
    price: Number(input.price),
    imageUrl: input.imageUrl.trim(),
    createdAt: new Date().toISOString()
  };

  const nextProducts = [product, ...products];
  await setProductsInStorage(nextProducts);
  return product;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const products = await getProductsFromStorage();
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) throw new Error('Product niet gevonden.');

  const updated = {
    ...products[index],
    name: input.name.trim(),
    description: input.description.trim(),
    price: Number(input.price),
    imageUrl: input.imageUrl.trim(),
    createdAt: products[index].createdAt
  };

  products[index] = updated;
  await setProductsInStorage(products);
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await getProductsFromStorage();
  const nextProducts = products.filter((product) => product.id !== id);
  if (nextProducts.length === products.length) throw new Error('Product niet gevonden.');
  await setProductsInStorage(nextProducts);
}
