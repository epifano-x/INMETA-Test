import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeDocument } from '@prisma/client';
import { PrismaService } from '../../../infra/persistence/prisma.service';

@Injectable()
export class UnassignDocumentTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(employeeId: string, documentTypeIds: string[]): Promise<EmployeeDocument[]> {

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const removed: EmployeeDocument[] = [];

    for (const docTypeId of documentTypeIds) {
      const link = await this.prisma.employeeDocument.findUnique({
        where: { employeeId_documentTypeId: { employeeId, documentTypeId: docTypeId } },
      });

      if (!link) {
        throw new NotFoundException(
          `Document type ${docTypeId} is not assigned to employee ${employeeId}`,
        );
      }

      const deleted = await this.prisma.employeeDocument.delete({
        where: { employeeId_documentTypeId: { employeeId, documentTypeId: docTypeId } },
      });

      removed.push(deleted);
    }

    return removed;
  }
}
