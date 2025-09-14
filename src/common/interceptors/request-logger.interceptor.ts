import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { LogsService } from '../../modules/logs/logs.service';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logs: LogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const start = Date.now();

    return next.handle().pipe(
      tap(async () => {
        const res = ctx.getResponse<Response>();
        const took = Date.now() - start;

        await this.logs.emit('log', 'http_request', 'RequestLogger', {
          method: req.method,
          path: req.originalUrl || req.url,
          status: res.statusCode,
          took_ms: took,
        });
      }),
    );
    }
}
