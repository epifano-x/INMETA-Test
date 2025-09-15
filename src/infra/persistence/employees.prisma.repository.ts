import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { EmployeeProps } from '../../domain/entities/employee.entity';
import type { IEmployeeRepository } from '../../domain/services/employee.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaEmployeeRepository implements IEmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCpf(cpfDigits: string): Promise<EmployeeProps | null> {
    const row = await this.prisma.employee.findUnique({ where: { cpf: cpfDigits } });
    return row
      ? {
          id: row.id,
          name: row.name,
          cpf: row.cpf,
          registrationNumber: row.registrationNumber,
          email: row.email,
          phone: row.phone,
          birthDate: row.birthDate,
          position: row.position,
          hiredAt: row.hiredAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          isActive: row.isActive,
        }
      : null;
  }

  async create(data: EmployeeProps): Promise<EmployeeProps> {
    try {
      const row = await this.prisma.employee.create({
        data: {
          name: data.name,
          cpf: data.cpf,
          registrationNumber: data.registrationNumber ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          birthDate: data.birthDate ?? null,
          position: data.position ?? null,
          hiredAt: data.hiredAt,
        },
      });

      return {
        id: row.id,
        name: row.name,
        cpf: row.cpf,
        registrationNumber: row.registrationNumber,
        email: row.email,
        phone: row.phone,
        birthDate: row.birthDate,
        position: row.position,
        hiredAt: row.hiredAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        isActive: row.isActive,
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) throw err;
      throw err;
    }
  }
}
