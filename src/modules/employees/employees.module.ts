import { Module } from '@nestjs/common';
import { EmployeesController } from './controllers/employees.controller';
import { CreateEmployeeService } from './services/create-employee.service';

import { PrismaModule } from 'src/infra/persistence';
import { StorageModule } from 'src/infra/storage/storage.module';
import { PrismaEmployeeRepository } from '../../infra/persistence/employees.prisma.repository';
import { AssignDocumentTypesService } from './services/assign-document-types.service';
import { GetEmployeeDocumentsStatusService } from './services/get-employee-documents-status.service';
import { ListEmployeeDocumentsService } from './services/list-employee-documents.service';
import { UnassignDocumentTypesService } from './services/unassign-document-types.service';
import { UpdateEmployeeService } from './services/update-employee.service';
import { UploadDocumentService } from './services/upload-document.service';
import { EMPLOYEE_REPOSITORY } from './tokens';

@Module({
  imports: [
    PrismaModule,
    StorageModule, // 👈 garante que o STORAGE_TOKEN esteja disponível
  ],
  controllers: [EmployeesController],
  providers: [
    CreateEmployeeService,
    UpdateEmployeeService,
    AssignDocumentTypesService,
    UnassignDocumentTypesService,
    UploadDocumentService,
    GetEmployeeDocumentsStatusService,
    ListEmployeeDocumentsService,
    { provide: EMPLOYEE_REPOSITORY, useClass: PrismaEmployeeRepository },
  ],
})
export class EmployeesModule {}
