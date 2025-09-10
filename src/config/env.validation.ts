import { plainToInstance } from 'class-transformer';
import { IsInt, IsOptional, IsString, validateSync } from 'class-validator';

class EnvVars {
  @IsOptional() @IsInt() PORT?: number;
  @IsOptional() @IsString() NODE_ENV?: string;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvVars, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: true });
  if (errors.length) throw new Error(errors.toString());
  return validated;
}
