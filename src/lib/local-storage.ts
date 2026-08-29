import { promises as fs } from 'fs';
import path from 'path';

export const STORAGE_ROOT = process.env.APP_STORAGE_DIR || '/app/storage';

export function getStoragePath(...segments: string[]) {
  return path.join(STORAGE_ROOT, ...segments);
}

export async function ensureStorageDir(...segments: string[]) {
  const targetPath = getStoragePath(...segments);
  await fs.mkdir(targetPath, { recursive: true });
  return targetPath;
}

export async function readJsonFile<T>(relativePath: string, fallback: T): Promise<T> {
  const filePath = getStoragePath(relativePath);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(relativePath: string, value: unknown) {
  const filePath = getStoragePath(relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

export async function deleteJsonFileIfExists(relativePath: string) {
  const filePath = getStoragePath(relativePath);
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore missing files.
  }
}

export function sanitizeFileName(name: string) {
  const base = (name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  return base || 'upload';
}

export async function saveUploadedFile(file: File, folderName: string = '') {
  const subFolders = ['uploads', ...(folderName ? [folderName] : [])];
  const targetDir = await ensureStorageDir(...subFolders);
  const safeName = sanitizeFileName(file.name || 'upload');
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const targetPath = path.join(targetDir, uniqueName);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await fs.writeFile(targetPath, Buffer.from(bytes));

  const relativePath = subFolders.join('/') + `/${uniqueName}`;
  return `/${relativePath}`;
}

export async function deleteUploadedFile(relativeUrl: string) {
  if (!relativeUrl.startsWith('/uploads/')) {
    return false;
  }

  const relativePath = relativeUrl.replace(/^\//, '');
  const filePath = getStoragePath(relativePath);

  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
