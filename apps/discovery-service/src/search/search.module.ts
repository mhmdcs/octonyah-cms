import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { VideoSearchService } from './video-search.service';

@Module({
  imports: [
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
          auth: username ? { username, password: password ?? '', } : undefined,
        };
      },
    }),
  ],
  providers: [VideoSearchService],
  exports: [VideoSearchService],
})
export class SearchModule {}

