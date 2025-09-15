import { Body, Controller, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { EmployeeResponseDto } from '../dto/employee-response.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { CreateEmployeeService } from '../services/create-employee.service';
import { UpdateEmployeeService } from '../services/update-employee.service';

@ApiTags('employees')
@ApiBearerAuth('access-token')
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly createEmployee: CreateEmployeeService,
    private readonly updateEmployee: UpdateEmployeeService,
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
}
