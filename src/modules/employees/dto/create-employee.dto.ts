import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsEmail,
    IsOptional,
    IsString,
    Matches,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Full name of the employee',
    example: 'Maria Aparecida da Silva',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'CPF of the employee (will be normalized to 11 digits)',
    example: '123.456.789-01',
  })
  @IsString()
  @Matches(/^[\d.\-]*\d[\d.\-]*$/, {
    message: 'CPF must contain only digits and punctuation',
  })
  cpf!: string;

  @ApiPropertyOptional({
    description: 'Internal registration number (unique)',
    example: 'INT-0001',
  })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({
    description: 'Employee email address',
    example: 'maria.silva@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+55 45 99999-0000',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Birth date (ISO 8601)',
    example: '1995-08-12',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Job position',
    example: 'Software Engineer',
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({
    description: 'Hiring date (ISO 8601)',
    example: '2025-09-01',
  })
  @IsDateString()
  hiredAt!: string;
}
