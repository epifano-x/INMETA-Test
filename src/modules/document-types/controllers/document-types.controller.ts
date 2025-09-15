import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateDocumentTypeDto } from '../dto/create-document-type.dto';
import { DocumentTypeResponseDto } from '../dto/document-type-response.dto';
import { CreateDocumentTypeService } from '../services/create-document-type.service';

@ApiTags('document-types')
@ApiBearerAuth('access-token')
@Controller('document-types')
export class DocumentTypesController {
  constructor(private readonly createDocumentType: CreateDocumentTypeService) {}

  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'createDocumentType',
    summary: 'Register new document type',
    description: 'Creates a new document type that can be assigned to employees.',
  })
  @ApiBody({
    description: 'Document type data to be created',
    type: CreateDocumentTypeDto,
    examples: {
      default: {
        summary: 'Example',
        value: {
          code: 'CPF',
          name: 'Cadastro de Pessoa Física',
          description: 'Brazilian taxpayer registry document',
          validityPeriodMonths: 0,
          isMandatory: true,
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Document type successfully created', type: DocumentTypeResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiConflictResponse({ description: 'Conflict (code already exists)' })
  async create(@Body() dto: CreateDocumentTypeDto): Promise<DocumentTypeResponseDto> {
    const created = await this.createDocumentType.execute(dto);
    return {
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }
}
