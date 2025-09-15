import { ApiProperty } from '@nestjs/swagger';
import { EmployeeDocumentStatus } from './employee-documents-query.dto';

export class EmployeeDocumentDto {
  @ApiProperty({ description: 'EmployeeDocument ID' })
  id: string;

  @ApiProperty({ description: 'Employee ID' })
  employeeId: string;

  @ApiProperty({ description: 'Employee name' })
  employeeName: string;

  @ApiProperty({ description: 'Document type ID' })
  documentTypeId: string;

  @ApiProperty({ description: 'Document type name' })
  documentTypeName: string;

  @ApiProperty({ description: 'Current status of the document', enum: EmployeeDocumentStatus })
  status: EmployeeDocumentStatus;

  @ApiProperty({ description: 'Due date for the document', nullable: true })
  dueDate?: string | null;

  @ApiProperty({ description: 'Expiration date of the document', nullable: true })
  expirationDate?: string | null;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}
