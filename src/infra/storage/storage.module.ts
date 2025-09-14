import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiskStorage } from './disk.storage';
import { STORAGE_TOKEN } from './storage.tokens';
import { IStorage } from './storage.types';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_TOKEN,
      useFactory: (cfg: ConfigService): IStorage => {
        const driver = cfg.get<'disk' | 's3'>('STORAGE_DRIVER');
        if (driver !== 'disk') {
          throw new Error(`Unsupported STORAGE_DRIVER=${driver}`);
        }
        const root = cfg.get<string>('STORAGE_DISK_ROOT') || '/data/docs';
        return new DiskStorage(root);
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_TOKEN],
})
export class StorageModule {}
