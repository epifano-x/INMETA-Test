import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LogsService } from '../../elasticsearch'; // <— AQUI

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logs: LogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request & { originalUrl?: string }>();
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logs.logHttp?.(req, Date.now() - started, 200).catch(() => {}),
        error: (err) => this.logs.logHttp?.(req, Date.now() - started, (err as any)?.status ?? 500).catch(() => {}),
      }),
    );
  }
}
