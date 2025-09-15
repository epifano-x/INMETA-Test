import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaDocumentTypeRepository } from 'src/infra/persistence/document-types.prisma.repository';

@Injectable()
export class CreateDocumentTypeService {
  constructor(private readonly repo: PrismaDocumentTypeRepository) {}

  async execute(input: {
    code: string;
    name: string;
    description?: string;
    validityPeriodMonths?: number;
    isMandatory: boolean;
  }) {
    try {
      return await this.repo.create(input);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Document type code must be unique.');
      }
      throw err;
    }
  }
}
