import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    console.log('[PrismaService] Conectado ao banco de dados');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('[PrismaService] Desconectado do banco de dados');
  }
}
