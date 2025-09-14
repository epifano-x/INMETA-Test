import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'], // habilita eventos
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ [PrismaService] Conectado ao banco de dados');
    } catch (err) {
      console.error('❌ [PrismaService] Erro ao conectar ao banco:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 [PrismaService] Desconectado do banco de dados');
  }
}
