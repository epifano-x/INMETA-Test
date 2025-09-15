import { EmployeeProps } from '../entities/employee.entity';

export interface IEmployeeRepository {
  findByCpf(cpfDigits: string): Promise<EmployeeProps | null>;
  create(data: EmployeeProps): Promise<EmployeeProps>;
}

export type { EmployeeProps };
