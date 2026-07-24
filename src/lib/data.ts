import { promises as fs } from 'fs';
import path from 'path';
import { Product, ProductInput } from './types';

const initialProducts: Product[] = [
  {
    id: 'sample-1',
    name: 'Premium Vinyl Sticker',
    description: 'Duurzame vinyl sticker voor verpakking en promoties.',
    price: 14.95,
    imageUrl: '',
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

  await fs.writeFile(
    localFilePath,
    JSON.stringify(products, null, 2),
    'utf8'
  );
}


/**
 * Upload image to Vercel Blob
 */
export async function uploadImageToBlob(
  file: File
): Promise<string> {

  const { put } = await import('@vercel/blob');

  const blob = await put(
    file.name,
    file,
    {
      access: 'public',
      contentType: file.type
    }
  );

  return blob.url;
}


export async function getProducts(): Promise<Product[]> {
  return readProductsFromLocalFile();
}


export async function createProduct(
  input: ProductInput
): Promise<Product> {

  const products = await getProducts();

  const product: Product = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: input.description.trim(),
    price: Number(input.price),
    imageUrl: input.imageUrl.trim(),
    createdAt: new Date().toISOString()
  };


  await writeProductsToLocalFile([
    product,
    ...products
  ]);

  return product;
}


export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<Product> {

  const products = await getProducts();

  const index = products.findIndex(
    product => product.id === id
  );

  if (index === -1) {
    throw new Error('Product niet gevonden.');
  }


  const updatedProduct = {
    ...products[index],
    name: input.name.trim(),
    description: input.description.trim(),
    price: Number(input.price),
    imageUrl: input.imageUrl.trim()
  };


  products[index] = updatedProduct;

  await writeProductsToLocalFile(products);

  return updatedProduct;
}


export async function deleteProduct(
  id: string
): Promise<void> {

  const products = await getProducts();

  const filtered = products.filter(
    product => product.id !== id
  );

  if (filtered.length === products.length) {
    throw new Error('Product niet gevonden.');
  }


  await writeProductsToLocalFile(filtered);
}