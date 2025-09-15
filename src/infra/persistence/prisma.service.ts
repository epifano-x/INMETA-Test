// src/infra/persistence/prisma.service.ts
import {
  INestApplication,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const isDev = process.env.NODE_ENV !== 'production';
    super({
      log: (isDev ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']) as Prisma.LogLevel[],
    } as Prisma.PrismaClientOptions);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ [PrismaService] Connected to the database');
    } catch (err) {
      console.error('❌ [PrismaService] Error connecting to the bank:', err);
      throw err; 
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    const shutdown = async (reason: string) => {
      try {
        console.log(`⏹️ [PrismaService] ${reason} – closing app...`);
        await app.close();
      } finally {
        await this.$disconnect();
      }
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('beforeExit', async () => {
      console.log('⏹️ [PrismaService] beforeExit – Disconnected Prisma...');
      await this.$disconnect();
    });

  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 [PrismaService] Disconnected from database');
  }
}
