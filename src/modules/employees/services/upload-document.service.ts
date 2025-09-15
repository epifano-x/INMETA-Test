import {
    Inject,
    Injectable,
    NotFoundException,
    UnsupportedMediaTypeException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../../infra/persistence/prisma.service';
import { STORAGE_TOKEN } from '../../../infra/storage/storage.tokens';
import * as storageTypes from '../../../infra/storage/storage.types';

@Injectable()
export class UploadDocumentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_TOKEN) private readonly storage: storageTypes.IStorage,
  ) {}

  async execute(
    employeeId: string,
    documentTypeId: string,
    file: Express.Multer.File,
    uploadedBy: string,
  ) {
    if (!file) throw new UnsupportedMediaTypeException('File is required');

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const empDoc = await this.prisma.employeeDocument.findUnique({
      where: { employeeId_documentTypeId: { employeeId, documentTypeId } },
      include: { documents: true },
    });
    if (!empDoc) {
      throw new NotFoundException('Employee is not assigned to this document type');
    }

    const version = empDoc.documents.length + 1;

    const stored = await this.storage.save({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });

    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    const created = await this.prisma.document.create({
      data: {
        employeeDocumentId: empDoc.id,
        fileName: stored.filename,
        mimeType: stored.mimeType,
        storagePath: stored.id,
        checksum,
        version,
        uploadedBy,
      },
    });

    await this.prisma.employeeDocument.update({
      where: { id: empDoc.id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    return created;
  }
}
