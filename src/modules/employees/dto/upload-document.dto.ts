import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentResponseDto {
  @ApiProperty({ description: 'ID of the uploaded document' })
  id!: string;

  @ApiProperty({ description: 'File name', example: 'cpf_frente.png' })
  fileName!: string;

  @ApiProperty({ description: 'MIME type', example: 'image/png' })
  mimeType!: string;

  @ApiProperty({
    description: 'Storage path or object id in storage backend',
    example: '2025/09/12/uuid.png',
  })
  storagePath!: string;

  @ApiProperty({ description: 'Document version', example: 1 })
  version!: number;

  @ApiProperty({ description: 'Upload timestamp (ISO)', example: '2025-09-15T10:30:00.000Z' })
  uploadedAt!: string;

  @ApiProperty({ description: 'Uploader identifier', example: 'admin@inmeta.com' })
  uploadedBy!: string;
}
