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
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { EmployeeResponseDto } from '../dto/employee-response.dto';
import { CreateEmployeeService } from '../services/create-employee.service';

@ApiTags('employees')
@ApiBearerAuth('access-token')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly createEmployee: CreateEmployeeService) {}
  
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
  @ApiBadRequestResponse({
    description: 'Invalid request data (e.g., CPF with wrong length)',
  })
  @ApiConflictResponse({
    description: 'Conflict (CPF or registration number already exists)',
  })
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
}
