import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentTypeResponseDto {
  @ApiProperty({ description: 'Document type ID', example: '8d4f4d8e-4a4b-4f2a-b8f4-2b0e58bdb1c7' })
  id!: string;

  @ApiProperty({ description: 'Unique code of the document type', example: 'CPF' })
  code!: string;

  @ApiProperty({ description: 'Display name', example: 'Cadastro de Pessoa Física' })
  name!: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Brazilian taxpayer registry document' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Default validity period (months)', example: 60 })
  validityPeriodMonths?: number | null;

  @ApiProperty({ description: 'Flag indicating if mandatory by default', example: true })
  isMandatory!: boolean;

  @ApiProperty({ description: 'Created timestamp', example: '2025-09-15T12:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ description: 'Updated timestamp', example: '2025-09-15T12:30:00.000Z' })
  updatedAt!: string;
}
