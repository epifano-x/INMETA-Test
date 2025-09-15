import { ApiProperty } from '@nestjs/swagger';

export class DocumentStatusItemDto {
  @ApiProperty({ example: '8d4f4d8e-4a4b-4f2a-b8f4-2b0e58bdb1c7' })
  documentTypeId!: string;

  @ApiProperty({ example: 'CPF' })
  documentTypeName!: string;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'SENT'] })
  status!: string;

  @ApiProperty({ example: '2025-09-15T12:34:56.000Z', nullable: true })
  sentAt!: string | null;
}

export class EmployeeDocumentsStatusDto {
  @ApiProperty({ example: 'd92f1d0c-3b87-4a0f-94a0-123456789abc' })
  employeeId!: string;

  @ApiProperty({ type: [DocumentStatusItemDto] })
  documents!: DocumentStatusItemDto[];
}
