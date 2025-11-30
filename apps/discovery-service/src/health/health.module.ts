import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis-health.indicator';
import { ElasticsearchHealthIndicator } from './elasticsearch-health.indicator';
import { RedisCacheModule } from '@octonyah/shared-cache';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TerminusModule,
    RedisCacheModule,
    ConfigModule,
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const node = config.get<string>(
          'ELASTICSEARCH_NODE',
          'http://localhost:9200',
        );
        const username = config.get<string>('ELASTICSEARCH_USERNAME');
        const password = config.get<string>('ELASTICSEARCH_PASSWORD');

        return {
          node,
          maxRetries: 5,
          requestTimeout: 60000,
          auth: username ? { username, password: password ?? '' } : undefined,
        };
      },
    }),
  ],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, ElasticsearchHealthIndicator],
})
export class HealthModule {}

