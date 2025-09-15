import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsEmail,
    IsOptional,
    IsString,
    Matches,
} from 'class-validator';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'Full name of the employee', example: 'Maria Aparecida da Silva' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'CPF of the employee (11 digits)', example: '123.456.789-01' })
  @IsOptional()
  @IsString()
  @Matches(/^[\d.\-]*\d[\d.\-]*$/, {
    message: 'CPF must contain only digits and punctuation',
  })
  cpf?: string;

  @ApiPropertyOptional({ description: 'Internal registration number', example: 'INT-0001' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'maria.silva@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+55 45 99999-0000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Birth date (ISO 8601)', example: '1995-08-12' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Job position', example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Hiring date (ISO 8601)', example: '2025-09-01' })
  @IsOptional()
  @IsDateString()
  hiredAt?: string;
}
