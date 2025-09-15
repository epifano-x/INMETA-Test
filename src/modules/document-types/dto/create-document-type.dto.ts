import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateDocumentTypeDto {
  @ApiProperty({
    description: 'Unique code for the document type (e.g., CPF, CTPS, CNH)',
    example: 'CPF',
  })
  @IsString()
  code!: string;

  @ApiProperty({
    description: 'Display name for the document type',
    example: 'Cadastro de Pessoa Física',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional description of the document type',
    example: 'Brazilian individual taxpayer registry document',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Default validity period in months',
    example: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityPeriodMonths?: number;

  @ApiProperty({
    description: 'Flag indicating if this document is mandatory by default',
    example: true,
    default: true,
  })
  @IsBoolean()
  isMandatory!: boolean;
}
