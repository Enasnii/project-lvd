import { promises as fs } from 'fs';
import path from 'path';
import { list, put } from '@vercel/blob';
import { SitePage, SitePageInput } from './types';

const blobStoragePath = 'data/site-pages.json';
const fallbackStoragePath = process.env.PAGES_STORAGE_FILE ?? path.join('/tmp', 'site-pages.json');

async function readPages(): Promise<SitePage[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await list({ prefix: blobStoragePath, limit: 1 });
    const blob = result.blobs.find((item) => item.pathname === blobStoragePath);
    if (!blob) return [];
    const response = await fetch(`${blob.url}?cacheBust=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Pagina\'s konden niet worden gelezen.');
    const parsed = await response.json();
    return Array.isArray(parsed) ? parsed : [];
  }

  try {
    const file = await fs.readFile(fallbackStoragePath, 'utf8');
    const parsed = JSON.parse(file);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePages(pages: SitePage[]) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(blobStoragePath, JSON.stringify(pages, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json'
    });
    return;
  }

  await fs.mkdir(path.dirname(fallbackStoragePath), { recursive: true });
  await fs.writeFile(fallbackStoragePath, JSON.stringify(pages, null, 2), 'utf8');
}

function sortPages(pages: SitePage[]) {
  return [...pages].sort((first, second) => first.menuOrder - second.menuOrder || first.title.localeCompare(second.title));
}

export async function getPages(includeUnpublished = false): Promise<SitePage[]> {
  const pages = await readPages();
  return sortPages(includeUnpublished ? pages : pages.filter((page) => page.published));
}

export async function getPageBySlug(slug: string, includeUnpublished = false) {
  const pages = await getPages(includeUnpublished);
  return pages.find((page) => page.slug === slug) ?? null;
}

export async function createPage(input: SitePageInput): Promise<SitePage> {
  const pages = await readPages();
  if (pages.some((page) => page.slug === input.slug)) throw new Error('Deze URL bestaat al.');
  const now = new Date().toISOString();
  const page: SitePage = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now };
  await writePages([page, ...pages]);
  return page;
}

export async function updatePage(id: string, input: SitePageInput): Promise<SitePage> {
  const pages = await readPages();
  if (pages.some((page) => page.slug === input.slug && page.id !== id)) throw new Error('Deze URL bestaat al.');
  const index = pages.findIndex((page) => page.id === id);
  if (index === -1) throw new Error('Pagina niet gevonden.');
  const updated = { ...pages[index], ...input, updatedAt: new Date().toISOString() };
  pages[index] = updated;
  await writePages(pages);
  return updated;
}

export async function deletePage(id: string) {
  const pages = await readPages();
  const filtered = pages.filter((page) => page.id !== id);
  if (filtered.length === pages.length) throw new Error('Pagina niet gevonden.');
  await writePages(filtered);
}