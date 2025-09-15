import { Injectable } from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaDocumentTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    code: string;
    name: string;
    description?: string;
    validityPeriodMonths?: number;
    isMandatory: boolean;
  }): Promise<DocumentType> {
    return await this.prisma.documentType.create({ data });
  }
}
