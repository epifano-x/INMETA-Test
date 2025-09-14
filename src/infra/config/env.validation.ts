import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

class EnvVars {
  // originais
  @IsOptional()
  @IsInt()
  PORT?: number;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  // novos para storage
  @IsIn(['disk', 's3'])
  STORAGE_DRIVER: 'disk' | 's3';

  @IsOptional()
  @IsString()
  STORAGE_DISK_ROOT?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  UPLOAD_MAX_MB?: number;

  @IsOptional()
  @IsString()
  ALLOWED_MIME?: string;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvVars, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: true });
  if (errors.length) throw new Error(errors.toString());
  return validated;
}
