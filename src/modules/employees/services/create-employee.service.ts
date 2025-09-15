import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EmployeeEntity } from '../../../domain/entities/employee.entity';
import type { IEmployeeRepository } from '../../../domain/services/employee.repository';
import { EMPLOYEE_REPOSITORY } from '../tokens';

@Injectable()
export class CreateEmployeeService {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly repo: IEmployeeRepository,
  ) {}

  async execute(input: {
    name: string;
    cpf: string;
    registrationNumber?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    position?: string;
    hiredAt: string;
  }) {
    const cpfDigits = EmployeeEntity.sanitizeCpf(input.cpf);
    try {
      EmployeeEntity.assertCpf(cpfDigits);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }

    const exists = await this.repo.findByCpf(cpfDigits);
    if (exists) {
      throw new ConflictException('There is already an employee with this CPF.');
    }

    try {
      return await this.repo.create({
        name: input.name,
        cpf: cpfDigits,
        registrationNumber: input.registrationNumber ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        birthDate: input.birthDate ? new Date(input.birthDate) : null,
        position: input.position ?? null,
        hiredAt: new Date(input.hiredAt),
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[]) ?? [];
        if (target.includes('cpf')) return Promise.reject(new ConflictException('There is already an employee with this CPF.'));
        if (target.includes('registrationNumber')) return Promise.reject(new ConflictException('There is already an employee with this registration number.'));
        return Promise.reject(new ConflictException('Uniqueness violation in Employee.'));
      }
      throw err;
    }
  }
}
