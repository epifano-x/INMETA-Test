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
      console.log('✅ [PrismaService] Conectado ao banco de dados');
    } catch (err) {
      console.error('❌ [PrismaService] Erro ao conectar ao banco:', err);
      throw err; // falha rápida
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    const shutdown = async (reason: string) => {
      try {
        console.log(`⏹️ [PrismaService] ${reason} – encerrando app...`);
        await app.close();
      } finally {
        // apenas desconecta o Prisma; não chama process.exit aqui
        await this.$disconnect();
      }
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('beforeExit', async () => {
      console.log('⏹️ [PrismaService] beforeExit – desconectando Prisma...');
      await this.$disconnect();
    });

  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 [PrismaService] Desconectado do banco de dados');
  }
}
