import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EmployeeEntity } from '../../../domain/entities/employee.entity';
import type { IEmployeeRepository } from '../../../domain/services/employee.repository';
import { EMPLOYEE_REPOSITORY } from '../tokens';

@Injectable()
export class UpdateEmployeeService {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly repo: IEmployeeRepository,
  ) {}

  async execute(id: string, input: any) {

    if (input.cpf) {
      const cpfDigits = EmployeeEntity.sanitizeCpf(input.cpf);
      try {
        EmployeeEntity.assertCpf(cpfDigits);
      } catch (e: any) {
        throw new BadRequestException(e.message);
      }
      input.cpf = cpfDigits;
    }

    try {
      const updated = await (this.repo as any).update(id, {
        ...input,
        birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
        hiredAt: input.hiredAt ? new Date(input.hiredAt) : undefined,
      });

      if (!updated) {
        throw new NotFoundException('Employee not found');
      }

      return updated;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[]) ?? [];
        if (target.includes('cpf')) throw new ConflictException('Another employee already has this CPF.');
        if (target.includes('registrationNumber')) throw new ConflictException('Another employee already has this registration number.');
        throw new ConflictException('Unique constraint violation on Employee.');
      }
      throw err;
    }
  }
}
