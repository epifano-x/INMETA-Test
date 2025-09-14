import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { HealthController } from './modules/health/controllers/health.controller';
import { LogsModule } from './modules/logs/logs.module';

import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { RolesGuard } from './modules/auth/roles.guard';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const node = cfg.get<string>('ELASTICSEARCH_NODE');
        const username = cfg.get<string>('ELASTICSEARCH_USERNAME');
        const password = cfg.get<string>('ELASTICSEARCH_PASSWORD');
        const rejectStr = cfg.get<string>('ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED');
        const rejectUnauthorized =
          rejectStr === undefined ? true : rejectStr.toString().toLowerCase() !== 'false';

        return {
          node,
          auth: username && password ? { username, password } : undefined,
          tls: { rejectUnauthorized },
        };
      },
    }),

    LogsModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
