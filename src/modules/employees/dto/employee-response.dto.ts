import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeResponseDto {
  @ApiProperty({ description: 'Employee unique ID', example: '7c8dbf9f-8eaa-4e1a-9a7a-b3d0af3b3b0a' })
  id!: string;

  @ApiProperty({ description: 'Full name', example: 'Maria Aparecida da Silva' })
  name!: string;

  @ApiProperty({ description: 'CPF (11 digits)', example: '12345678901' })
  cpf!: string;

  @ApiPropertyOptional({ description: 'Internal registration number', example: 'INT-0001' })
  registrationNumber?: string | null;

  @ApiPropertyOptional({ description: 'Email address', example: 'maria.silva@example.com' })
  email?: string | null;

  @ApiPropertyOptional({ description: 'Phone number', example: '+55 45 99999-0000' })
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Birth date (ISO 8601)', example: '1995-08-12T00:00:00.000Z' })
  birthDate?: string | null;

  @ApiPropertyOptional({ description: 'Job position', example: 'Software Engineer' })
  position?: string | null;

  @ApiProperty({ description: 'Hiring date (ISO 8601)', example: '2025-09-01T00:00:00.000Z' })
  hiredAt!: string;

  @ApiProperty({ description: 'Creation date', example: '2025-09-15T11:20:30.000Z' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update date', example: '2025-09-15T11:20:30.000Z' })
  updatedAt!: string;

  @ApiProperty({ description: 'Active flag', example: true })
  isActive!: boolean;
}
