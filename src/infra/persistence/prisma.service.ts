import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('[PrismaService] ✅ Conectado ao banco de dados');
    } catch (err: any) {
      console.error('[PrismaService] ❌ Erro ao conectar no banco:');
      console.error('Mensagem:', err.message);
      console.error('Stack:', err.stack);
      console.error('Code:', err.code);
      throw err;
    }

    this.$on('error', (e) => {
      console.error('[PrismaService] Prisma Error Event:', e);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('[PrismaService] 🔌 Desconectado do banco de dados');
  }
}
