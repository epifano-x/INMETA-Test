import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LogsService } from '../../modules/logs/logs.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logs: LogsService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = {
      method: req.method,
      path: req.originalUrl || req.url,
      ip: req.ip,
      query: req.query,
      params: req.params,
      body: sanitizeBody(req.body),
    };

    const errObj =
      exception instanceof Error
        ? { name: exception.name, message: exception.message, stack: exception.stack }
        : { message: String(exception) };

    // loga no ES (não quebra fluxo)
    await this.logs.emit('error', 'Unhandled exception', 'AllExceptionsFilter', {
      status,
      request: payload,
      error: errObj,
    });

    const response = isHttp
      ? (exception as HttpException).getResponse()
      : { statusCode: status, message: 'Internal server error' };

    res.status(status).json(response);
  }
}

function sanitizeBody(body: any) {
  // evita logar senhas/credenciais por acidente; ajuste se necessário
  if (!body || typeof body !== 'object') return body;
  const clone = { ...body };
  for (const key of Object.keys(clone)) {
    if (/(password|pass|secret|token|authorization)/i.test(key)) {
      clone[key] = '[redacted]';
    }
  }
  return clone;
}
