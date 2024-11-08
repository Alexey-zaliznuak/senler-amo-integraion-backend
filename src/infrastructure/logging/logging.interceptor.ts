import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CustomRequest } from '../requests';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<CustomRequest>();
    const res = httpContext.getResponse();

    this.logRequest(req);

    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        this.logResponse(req, res, startTime, data);
        return data;
      }),
    );
  }

  private logRequest(req: CustomRequest) {
    req.logger.info('Request received', this.extractLoggableData(req));
  }

  private logResponse(
    req: CustomRequest,
    res: any,
    startTime: number,
    data: any,
  ) {
    const statusCode = res.statusCode;
    const headers = res.getHeaders();
    const contentLength = headers['content-length'] || 'unknown';
    const processTime = headers['x-process-time'] || `${Date.now() - startTime} ms`;

    req.logger.info('Response sent', {
      statusCode,
      contentLength,
      headers,
      data,
      req: this.extractLoggableData(req),
      processTime,
    });
  }

  private extractLoggableData(req: CustomRequest): object {
    const { method, baseUrl, body, query, params } = req;
    return {
      method,
      baseUrl,
      body,
      query,
      params,
    };
  }
}
