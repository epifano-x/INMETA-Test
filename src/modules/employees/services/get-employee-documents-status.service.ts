import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/persistence/prisma.service';
import { EmployeeDocumentsStatusDto } from '../dto/employee-documents-status.dto';

@Injectable()
export class GetEmployeeDocumentsStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(employeeId: string): Promise<EmployeeDocumentsStatusDto> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        documents: {
          include: {
            documentType: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return {
      employeeId: employee.id,
      documents: employee.documents.map((ed) => ({
        documentTypeId: ed.documentTypeId,
        documentTypeName: ed.documentType.name,
        status: ed.status,
        sentAt: ed.sentAt ? ed.sentAt.toISOString() : null,
      })),
    };
  }
}