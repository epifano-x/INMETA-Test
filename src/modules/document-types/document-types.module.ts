import { Module } from '@nestjs/common';
import { PrismaDocumentTypeRepository } from '../../infra/persistence/document-types.prisma.repository';
import { PrismaService } from '../../infra/persistence/prisma.service';
import { DocumentTypesController } from './controllers/document-types.controller';
import { CreateDocumentTypeService } from './services/create-document-type.service';

@Module({
  controllers: [DocumentTypesController],
  providers: [PrismaService, PrismaDocumentTypeRepository, CreateDocumentTypeService],
})
export class DocumentTypesModule {}
