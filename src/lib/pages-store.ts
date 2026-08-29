import { readJsonFile, writeJsonFile } from './local-storage';
import { SitePage, SitePageInput } from './types';

const storagePath = 'data/site-pages.json';

async function readPages(): Promise<SitePage[]> {
  const parsed = await readJsonFile(storagePath, []);
  return Array.isArray(parsed) ? parsed : [];
}

async function writePages(pages: SitePage[]) {
  await writeJsonFile(storagePath, pages);
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