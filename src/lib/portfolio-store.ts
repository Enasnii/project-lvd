import { readJsonFile, writeJsonFile } from './local-storage';
import { PortfolioProject, PortfolioProjectInput } from './types';

const storagePath = 'data/portfolio-projects.json';

async function readProjects(): Promise<PortfolioProject[]> {
  const parsed = await readJsonFile(storagePath, []);
  return Array.isArray(parsed) ? parsed as PortfolioProject[] : [];
}

async function writeProjects(projects: PortfolioProject[]) {
  await writeJsonFile(storagePath, projects);
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
