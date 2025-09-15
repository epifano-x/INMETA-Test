import { Module } from '@nestjs/common';
import { EmployeesController } from './controllers/employees.controller';
import { CreateEmployeeService } from './services/create-employee.service';

import { PrismaEmployeeRepository } from '../../infra/persistence/employees.prisma.repository';
import { AssignDocumentTypesService } from './services/assign-document-types.service';
import { UpdateEmployeeService } from './services/update-employee.service';
import { EMPLOYEE_REPOSITORY } from './tokens';

@Module({
  controllers: [EmployeesController],
  providers: [
    CreateEmployeeService,
    UpdateEmployeeService,
    AssignDocumentTypesService,
    { provide: EMPLOYEE_REPOSITORY, useClass: PrismaEmployeeRepository },
  ],
})
export class EmployeesModule {}
