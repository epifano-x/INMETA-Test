import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class UnassignDocumentTypesDto {
  @ApiProperty({
    description: 'List of document type IDs to unassign from the employee',
    example: [
      '8d4f4d8e-4a4b-4f2a-b8f4-2b0e58bdb1c7',
      '7e3f3e2a-1d2b-4c3d-9e4f-1234567890ab',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  documentTypeIds!: string[];
}
