import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum EmployeeDocumentStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class EmployeeDocumentsQueryDto {
  @ApiPropertyOptional({ description: 'Page number (default: 1)', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (default: 10)', example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by employee ID (UUID)' })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filter by document type ID (UUID)' })
  @IsString()
  @IsOptional()
  documentTypeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: EmployeeDocumentStatus,
    example: EmployeeDocumentStatus.PENDING,
  })
  @IsEnum(EmployeeDocumentStatus)
  @IsOptional()
  status?: EmployeeDocumentStatus;

  @ApiPropertyOptional({
    description: 'Search by employee name (partial match)',
    example: 'Maria',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Order by field (updatedAt, dueDate, employeeName)',
    example: 'updatedAt',
  })
  @IsString()
  @IsOptional()
  orderBy?: string;

  @ApiPropertyOptional({
    description: 'Order direction (asc or desc)',
    example: 'desc',
  })
  @IsString()
  @IsOptional()
  order?: 'asc' | 'desc' = 'desc';
}
