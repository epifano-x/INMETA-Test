import { ApiProperty } from '@nestjs/swagger';
import { EmployeeDocumentDto } from './employee-document.dto';

export class PaginatedEmployeeDocumentsDto {
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ type: [EmployeeDocumentDto], description: 'Employee documents' })
  items: EmployeeDocumentDto[];
}
