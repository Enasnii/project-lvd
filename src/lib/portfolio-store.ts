import { promises as fs } from 'fs';
import path from 'path';
import { list, put } from '@vercel/blob';
import { PortfolioProject, PortfolioProjectInput } from './types';

const blobStoragePath = 'data/portfolio-projects.json';
const fallbackStoragePath = process.env.PORTFOLIO_STORAGE_FILE ?? path.join('/tmp', 'portfolio-projects.json');

async function readProjects(): Promise<PortfolioProject[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await list({ prefix: blobStoragePath, limit: 1 });
    const blob = result.blobs.find((item) => item.pathname === blobStoragePath);
    if (!blob) return [];
    const response = await fetch(`${blob.url}?cacheBust=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Portfolio kon niet worden gelezen.');
    const parsed = await response.json();
    return Array.isArray(parsed) ? parsed as PortfolioProject[] : [];
  }

  try {
    const file = await fs.readFile(fallbackStoragePath, 'utf8');
    const parsed = JSON.parse(file);
    return Array.isArray(parsed) ? parsed as PortfolioProject[] : [];
  } catch {
    return [];
  }
}

async function writeProjects(projects: PortfolioProject[]) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(blobStoragePath, JSON.stringify(projects, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json'
    });
    return;
  }

  await fs.mkdir(path.dirname(fallbackStoragePath), { recursive: true });
  await fs.writeFile(fallbackStoragePath, JSON.stringify(projects, null, 2), 'utf8');
}

function sortProjects(projects: PortfolioProject[]) {
  return [...projects].sort((first, second) => Number(second.featured) - Number(first.featured) || first.order - second.order || second.date.localeCompare(first.date));
}

export async function getPortfolioProjects(includeUnpublished = false) {
  const projects = await readProjects();
  return sortProjects(includeUnpublished ? projects : projects.filter((project) => project.published));
}

export async function getPortfolioProjectBySlug(slug: string, includeUnpublished = false) {
  const projects = await getPortfolioProjects(includeUnpublished);
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function createPortfolioProject(input: PortfolioProjectInput) {
  const projects = await readProjects();
  if (projects.some((project) => project.slug === input.slug)) throw new Error('Deze URL bestaat al.');
  const project: PortfolioProject = { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await writeProjects([project, ...projects]);
  return project;
}

export async function updatePortfolioProject(id: string, input: PortfolioProjectInput) {
  const projects = await readProjects();
  if (projects.some((project) => project.slug === input.slug && project.id !== id)) throw new Error('Deze URL bestaat al.');
  const index = projects.findIndex((project) => project.id === id);
  if (index === -1) throw new Error('Portfolio-project niet gevonden.');
  const project: PortfolioProject = { ...projects[index], ...input, updatedAt: new Date().toISOString() };
  projects[index] = project;
  await writeProjects(projects);
  return project;
}

export async function deletePortfolioProject(id: string) {
  const projects = await readProjects();
  const filtered = projects.filter((project) => project.id !== id);
  if (filtered.length === projects.length) throw new Error('Portfolio-project niet gevonden.');
  await writeProjects(filtered);
}
