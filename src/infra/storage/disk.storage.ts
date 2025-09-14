import { randomUUID } from 'crypto';
import { createReadStream, promises as fsp } from 'fs';
import { dirname, extname, join, normalize } from 'path';
import { IStorage, SaveFileInput, StoredFile } from './storage.types';

function safeJoin(root: string, rel: string) {
  const resolved = normalize(join(root, rel));
  if (!resolved.startsWith(normalize(root))) throw new Error('Path traversal detected');
  return resolved;
}

export class DiskStorage implements IStorage {
  constructor(private rootDir: string) {}

  async save({ buffer, originalName, mimeType }: SaveFileInput): Promise<StoredFile> {
    const now = new Date();
    const y = String(now.getUTCFullYear());
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');

    const uuid = randomUUID().replace(/-/g, '');
    const ext = (extname(originalName) || '').toLowerCase();
    const filename = `${uuid}${ext}`;
    const rel = `${y}/${m}/${uuid.slice(0, 2)}/${filename}`; // id opaco
    const filePath = safeJoin(this.rootDir, rel);

    await fsp.mkdir(dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, buffer, { flag: 'wx' });

    return {
      id: rel,
      filename,
      mimeType,
      size: buffer.length,
      createdAt: now,
    };
  }

  async getStream(id: string) {
    const filePath = safeJoin(this.rootDir, id);
    const stat = await fsp.stat(filePath);
    const stream = createReadStream(filePath);
    
    return { stream, size: stat.size, mimeType: 'application/octet-stream', filename: id.split('/').pop() || 'file' };
  }

  async delete(id: string) {
    const filePath = safeJoin(this.rootDir, id);
    await fsp.unlink(filePath).catch(() => undefined);
  }

  async exists(id: string) {
    try {
      const filePath = safeJoin(this.rootDir, id);
      await fsp.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
