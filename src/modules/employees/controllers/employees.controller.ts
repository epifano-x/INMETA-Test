import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiConsumes,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import express from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AssignDocumentTypesDto } from '../dto/assign-document-types.dto';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { EmployeeDocumentsStatusDto } from '../dto/employee-documents-status.dto';
import { EmployeeResponseDto } from '../dto/employee-response.dto';
import { UnassignDocumentTypesDto } from '../dto/unassign-document-types.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { UploadDocumentResponseDto } from '../dto/upload-document.dto';
import { AssignDocumentTypesService } from '../services/assign-document-types.service';
import { CreateEmployeeService } from '../services/create-employee.service';
import { GetEmployeeDocumentsStatusService } from '../services/get-employee-documents-status.service';
import { UnassignDocumentTypesService } from '../services/unassign-document-types.service';
import { UpdateEmployeeService } from '../services/update-employee.service';
import { UploadDocumentService } from '../services/upload-document.service';

@ApiTags('employees')
@ApiBearerAuth('access-token')
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly createEmployee: CreateEmployeeService,
    private readonly updateEmployee: UpdateEmployeeService,
    private readonly assignDocs: AssignDocumentTypesService,
    private readonly unassignDocs: UnassignDocumentTypesService,
    private readonly uploadDocument: UploadDocumentService,
    private readonly getStatus: GetEmployeeDocumentsStatusService,
  ) {}

  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'createEmployee',
    summary: 'Register new employee',
    description: 'Creates a new employee in the system. The CPF will be normalized and validated.',
  })
  @ApiBody({
    description: 'Employee data to be created',
    type: CreateEmployeeDto,
    examples: {
      default: {
        summary: 'Example',
        value: {
          name: 'Maria Aparecida da Silva',
          cpf: '123.456.789-01',
          registrationNumber: 'INT-0001',
          email: 'maria.silva@example.com',
          phone: '+55 45 99999-0000',
          birthDate: '1995-08-12',
          position: 'Software Engineer',
          hiredAt: '2025-09-01',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Employee successfully created',
    type: EmployeeResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request data (e.g., CPF with wrong length)' })
  @ApiConflictResponse({ description: 'Conflict (CPF or registration number already exists)' })
  async create(@Body() dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    const created = await this.createEmployee.execute(dto);
    return {
      ...created,
      birthDate: created.birthDate ? created.birthDate.toISOString() : null,
      hiredAt: created.hiredAt.toISOString(),
      createdAt: created.createdAt!.toISOString(),
      updatedAt: created.updatedAt!.toISOString(),
    } as EmployeeResponseDto;
  }

  @Roles('admin')
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'updateEmployee',
    summary: 'Update employee information',
    description: 'Updates an existing employee in the system. Validates CPF and handles unique constraints.',
  })
  @ApiBody({
    description: 'Employee fields to update (only send the fields you want to change)',
    type: UpdateEmployeeDto,
    examples: {
      default: {
        summary: 'Example',
        value: {
          name: 'Updated Employee Name',
          phone: '+55 45 98888-7777',
          position: 'Senior Software Engineer',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Employee successfully updated', type: EmployeeResponseDto })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiBadRequestResponse({ description: 'Invalid request data (e.g., CPF with wrong length)' })
  @ApiConflictResponse({ description: 'Conflict (CPF or registration number already exists)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const updated = await this.updateEmployee.execute(id, dto);
    return {
      ...updated,
      birthDate: updated.birthDate ? updated.birthDate.toISOString() : null,
      hiredAt: updated.hiredAt.toISOString(),
      createdAt: updated.createdAt!.toISOString(),
      updatedAt: updated.updatedAt!.toISOString(),
    } as EmployeeResponseDto;
  }


  @Roles('admin')
  @Post(':id/document-types')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'assignDocumentTypes',
    summary: 'Assign document types to an employee',
    description: 'Links one or more document types to an employee. Each document type starts as PENDING.',
  })
  @ApiBody({
    description: 'Document type IDs to assign',
    type: AssignDocumentTypesDto,
    examples: {
      default: {
        summary: 'Example',
        value: {
          documentTypeIds: [
            '8d4f4d8e-4a4b-4f2a-b8f4-2b0e58bdb1c7',
            '7e3f3e2a-1d2b-4c3d-9e4f-1234567890ab',
          ],
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Documents successfully assigned' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiConflictResponse({ description: 'One or more document types already assigned' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async assign(
    @Param('id') employeeId: string,
    @Body() dto: AssignDocumentTypesDto,
  ) {
    return await this.assignDocs.execute(employeeId, dto.documentTypeIds);
  }


  @Roles('admin')
  @Delete(':id/document-types')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'unassignDocumentTypes',
    summary: 'Unassign document types from an employee',
    description: 'Removes one or more document type links from a given employee.',
  })
  @ApiOkResponse({ description: 'Documents successfully unassigned' })
  @ApiNotFoundResponse({ description: 'Employee or document type link not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async unassign(
    @Param('id') employeeId: string,
    @Body() dto: UnassignDocumentTypesDto,
  ) {
    return await this.unassignDocs.execute(employeeId, dto.documentTypeIds);
  }

  @Roles('admin')
  @Post(':id/document-types/:docTypeId/upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'uploadDocument',
    summary: 'Upload employee document',
    description:
      'Uploads a file for a given employee and document type, stores it using configured storage (Disk or MinIO), versions it, and updates status.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload file for employee document',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Document successfully uploaded',
    type: UploadDocumentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Employee or document type not found' })
  @ApiBadRequestResponse({ description: 'Invalid file upload' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('id') employeeId: string,
    @Param('docTypeId') docTypeId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: express.Request,
  ): Promise<UploadDocumentResponseDto> {
    const user = req.user!;
    const uploaded = await this.uploadDocument.execute(
      employeeId,
      docTypeId,
      file,
      user.userId,
    );
    return {
      ...uploaded,
      uploadedAt: uploaded.uploadedAt.toISOString(),
    };
  }

  @Roles('admin')
  @Get(':id/documents/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'getEmployeeDocumentsStatus',
    summary: 'Get employee document status',
    description:
      'Retrieves the status of all document types linked to a specific employee, showing which have been sent and which are still pending.',
  })
  @ApiOkResponse({
    description: 'Employee document status retrieved successfully',
    type: EmployeeDocumentsStatusDto,
  })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  async getDocumentsStatus(
    @Param('id') employeeId: string,
  ): Promise<EmployeeDocumentsStatusDto> {
    return this.getStatus.execute(employeeId);
  }
}
