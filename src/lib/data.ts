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

const storageKey = 'stickerbedrijf-products';

function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return initialProducts;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return initialProducts;
  try {
    return JSON.parse(raw) as Product[];
  } catch {
    return initialProducts;
  }
}

function setStoredProducts(products: Product[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey, JSON.stringify(products));
  }
}

export async function getProducts(): Promise<Product[]> {
  return getStoredProducts();
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const products = getStoredProducts();
  const product: Product = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: input.description.trim(),
    price: Number(input.price),
    imageUrl: input.imageUrl.trim(),
    createdAt: new Date().toISOString()
  };
  const nextProducts = [product, ...products];
  setStoredProducts(nextProducts);
  return product;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const products = getStoredProducts();
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) throw new Error('Product niet gevonden.');
  const updated = { ...products[index], ...{ name: input.name.trim(), description: input.description.trim(), price: Number(input.price), imageUrl: input.imageUrl.trim() } };
  products[index] = updated;
  setStoredProducts(products);
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const products = getStoredProducts();
  const nextProducts = products.filter((product) => product.id !== id);
  if (nextProducts.length === products.length) throw new Error('Product niet gevonden.');
  setStoredProducts(nextProducts);
}
