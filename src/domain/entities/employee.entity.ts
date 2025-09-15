export interface EmployeeProps {
  id?: string;
  name: string;
  cpf: string; // somente dígitos (11)
  registrationNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  birthDate?: Date | null;
  position?: string | null;
  hiredAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

export class EmployeeEntity {
  private props: EmployeeProps;

  constructor(props: EmployeeProps) {
    this.props = {
      ...props,
      isActive: props.isActive ?? true,
    };
  }

  static sanitizeCpf(raw: string): string {
    return raw.replace(/\D/g, '');
  }

  static assertCpf(cpfDigits: string) {
    if (!/^\d{11}$/.test(cpfDigits)) {
      throw new Error('CPF must contain exactly 11 numeric digits');
    }
  }

  get data(): EmployeeProps {
    return this.props;
  }
}
