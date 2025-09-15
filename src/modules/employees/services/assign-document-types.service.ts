import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeDocument, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/persistence/prisma.service';

@Injectable()
export class AssignDocumentTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(employeeId: string, documentTypeIds: string[]): Promise<EmployeeDocument[]> {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const results: EmployeeDocument[] = [];

    for (const docTypeId of documentTypeIds) {
      try {
        const assigned = await this.prisma.employeeDocument.create({
          data: {
            employeeId,
            documentTypeId: docTypeId,
          },
        });
        results.push(assigned);
      } catch (err: any) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          throw new ConflictException(`Document type ${docTypeId} already assigned to employee`);
        }
        throw err;
      }
    }

    return results;
  }
}
