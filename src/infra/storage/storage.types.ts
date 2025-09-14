import { Readable } from 'stream';

export type SaveFileInput = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
};

export type StoredFile = {
  id: string;
  filename: string;
  mimeType: string; 
  size: number;
  createdAt: Date;
};

export interface IStorage {
  save(input: SaveFileInput): Promise<StoredFile>;
  getStream(id: string): Promise<{ stream: Readable; size: number; mimeType: string; filename: string }>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
