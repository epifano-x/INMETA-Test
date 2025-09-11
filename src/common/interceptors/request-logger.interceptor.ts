import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { LogsService } from '../../elasticsearch';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logs: LogsService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<Request & any>();
    const res = http.getResponse<Response & any>();

    const started = Date.now();
    const requestId = req.headers['x-request-id'] || randomUUID();

    if (res?.setHeader) res.setHeader('x-request-id', String(requestId));

    const base = {
      requestId,
      method: req.method,
      route: req.url,
      remoteIp:
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress,
      userId: req.user?.sub || req.user?.id || null,
    };

    return next.handle().pipe(
      tap(async () => {
        const durationMs = Date.now() - started;
        await this.logs.log({
          level: 'info',
          ...base,
          statusCode: res.statusCode,
          durationMs,
        });
      }),
      catchError((err) => {
        const durationMs = Date.now() - started;
        void this.logs.log({
          level: 'error',
          ...base,
          statusCode: res.statusCode ?? 500,
          durationMs,
          message: err?.message || 'Unhandled error',
          stack: err?.stack,
        });
        return throwError(() => err);
      }),
    );
  }
}

// (Opcional) também exportar como default para evitar problemas de import
export default RequestLoggerInterceptor;
