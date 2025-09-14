import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

import { LogsService } from '../../logs/logs.service';

import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { HealthElasticsearchErrorResponse } from '../dto/health-elasticsearch-error-response.dto';
import { HealthElasticsearchOkResponse } from '../dto/health-elasticsearch-ok-response.dto';
import { HealthOkResponse } from '../dto/health-ok-response.dto';

import { ApiBearerAuth } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { HealthDatabaseErrorResponse } from '../dto/health-database-error-response.dto';
import { HealthDatabaseOkResponse } from '../dto/health-database-ok-response.dto';

import { HealthFilesErrorResponse } from '../dto/health-files-error-response.dto';
import { HealthFilesOkResponse } from '../dto/health-files-ok-response.dto';
@ApiTags('health')
@ApiExtraModels(
  HealthOkResponse,
  HealthElasticsearchOkResponse,
  HealthElasticsearchErrorResponse,
  HealthDatabaseOkResponse,
  HealthDatabaseErrorResponse,
  HealthFilesOkResponse,
  HealthFilesErrorResponse,
)
@ApiBearerAuth('access-token')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly prisma = new PrismaClient();

  constructor(
    private readonly es: ElasticsearchService,
    private readonly logs: LogsService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'API Health Check',
    description:
      'Checks if the API is running and returns status 200 when it is available. Useful for basic monitoring.',
  })
  @ApiOkResponse({
    description: 'API is healthy and operational',
    type: HealthOkResponse,
    schema: {
      example: { ok: true },
    },
  })
  async ok() {
    this.logger.log('GET /health');
    await this.logs.emit('log', 'health.ok', HealthController.name);
    return { ok: true };
  }

  @Roles('admin')
  @Get('elasticsearch')
  @ApiOperation({
    summary: 'Elasticsearch Health Check',
    description:
      'Checks if the Elasticsearch cluster is reachable and returns basic information such as node name, cluster name, and version. ' +
      'If the service is unavailable, returns HTTP 503.',
  })
  @ApiOkResponse({
    description: 'Elasticsearch is healthy and operational',
    type: HealthElasticsearchOkResponse,
    schema: {
      example: {
        ok: true,
        name: 'es-node-1',
        cluster_name: 'my-cluster',
        version: '8.10.2',
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Elasticsearch is unavailable',
    type: HealthElasticsearchErrorResponse,
    schema: {
      example: {
        statusCode: 503,
        message: 'connect ECONNREFUSED 127.0.0.1:9200',
        error: 'Service Unavailable',
      },
    },
  })
  async elasticsearch() {
    this.logger.log('GET /health/elasticsearch - checking Elasticsearch');
    try {
      const info: any = await this.es.info();
      const name = info?.name;
      const cluster_name = info?.cluster_name;
      const version = info?.version?.number ?? info?.version;

      await this.logs.emit(
        'log',
        'health.elasticsearch.ok',
        HealthController.name,
        { name, cluster_name, version },
      );

      return { ok: true, name, cluster_name, version };
    } catch (err: any) {
      const message = err?.message ?? String(err);
      await this.logs.emit(
        'warn',
        'health.elasticsearch.error',
        HealthController.name,
        { error: message },
      );
      throw new ServiceUnavailableException(message);
    }
  }

  @Roles('admin')
  @Get('database')
  @ApiOperation({
    summary: 'Database Health Check',
    description:
      'Checks if the PostgreSQL database is reachable and responsive. Returns current timestamp if available.',
  })
  @ApiOkResponse({
    description: 'Database is healthy and operational',
    type: HealthDatabaseOkResponse,
    schema: {
      example: {
        ok: true,
        now: '2025-09-14T12:34:56.789Z',
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Database is unavailable',
    type: HealthDatabaseErrorResponse,
    schema: {
      example: {
        statusCode: 503,
        message: 'Database connection failed',
        error: 'Service Unavailable',
      },
    },
  })
  async database() {
    this.logger.log('GET /health/database - checking Database');
    try {
      const result = await this.prisma.$queryRawUnsafe(
        'SELECT NOW() as now',
      ) as Array<{ now: Date }>;


      const now = result[0]?.now?.toISOString() ?? new Date().toISOString();

      await this.logs.emit(
        'log',
        'health.database.ok',
        HealthController.name,
        { now },
      );

      return { ok: true, now };
    } catch (err: any) {
      const message = err?.message ?? String(err);
      await this.logs.emit(
        'warn',
        'health.database.error',
        HealthController.name,
        { error: message },
      );
      throw new ServiceUnavailableException(message);
    }
  }


  @Roles('admin')
  @Get('files')
  @ApiOperation({
    summary: 'Files Storage Health Check',
    description:
      'Checks if the file storage is accessible. Tries to write and remove a temp file in the configured storage path.',
  })
  @ApiOkResponse({
    description: 'File storage is healthy and operational',
    type: HealthFilesOkResponse,
    schema: {
      example: {
        ok: true,
        path: '/app/uploads',
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'File storage is unavailable',
    type: HealthFilesErrorResponse,
    schema: {
      example: {
        statusCode: 503,
        message: 'EACCES: permission denied, mkdir \'/app/uploads\'',
        error: 'Service Unavailable',
      },
    },
  })
  async files() {
    this.logger.log('GET /health/files - checking Files Storage');

    const storagePath =
      process.env.FILES_STORAGE_PATH || path.resolve('./uploads');
    const testFile = path.join(storagePath, 'health-check.tmp');

    try {
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
      }

      fs.writeFileSync(testFile, 'health-check');
      fs.unlinkSync(testFile);

      await this.logs.emit(
        'log',
        'health.files.ok',
        HealthController.name,
        { path: storagePath },
      );

      return { ok: true, path: storagePath };
    } catch (err: any) {
      const message = err?.message ?? String(err);

      await this.logs.emit(
        'warn',
        'health.files.error',
        HealthController.name,
        { error: message },
      );

      throw new ServiceUnavailableException(message);
    }
  }
}
