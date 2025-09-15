import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/persistence/prisma.service';
import { EmployeeDocumentDto } from '../dto/employee-document.dto';
import { EmployeeDocumentsQueryDto } from '../dto/employee-documents-query.dto';
import { PaginatedEmployeeDocumentsDto } from '../dto/paginated-employee-documents.dto';

@Injectable()
export class ListEmployeeDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: EmployeeDocumentsQueryDto): Promise<PaginatedEmployeeDocumentsDto> {
    const {
      page = 1,
      limit = 10,
      employeeId,
      documentTypeId,
      status,
      search,
      orderBy = 'updatedAt',
      order = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      ...(status ? { status } : {}),
      ...(employeeId ? { employeeId } : {}),
      ...(documentTypeId ? { documentTypeId } : {}),
      ...(search
        ? {
            employee: {
              name: { contains: search, mode: 'insensitive' },
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.employeeDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: order },
        include: { employee: true, documentType: true },
      }),
      this.prisma.employeeDocument.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      items: items.map(
        (doc) =>
          ({
            id: doc.id,
            employeeId: doc.employeeId,
            employeeName: doc.employee.name,
            documentTypeId: doc.documentTypeId,
            documentTypeName: doc.documentType.name,
            status: doc.status,
            dueDate: doc.dueDate?.toISOString() ?? null,
            expirationDate: doc.expirationDate?.toISOString() ?? null,
            updatedAt: doc.updatedAt.toISOString(),
          }) as EmployeeDocumentDto,
      ),
    };
  }
}
