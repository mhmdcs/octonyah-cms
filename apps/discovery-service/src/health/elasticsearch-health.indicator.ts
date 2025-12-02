import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class ElasticsearchHealthIndicator extends HealthIndicator {
  constructor(private readonly elasticsearchService: ElasticsearchService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const isHealthy = (await this.elasticsearchService.ping()) === true;
      if (isHealthy) return this.getStatus(key, true);
      throw new HealthCheckError('Elasticsearch health check failed', this.getStatus(key, false));
    } catch (error) {
      throw new HealthCheckError('Elasticsearch health check failed', this.getStatus(key, false, { message: error.message }));
    }
  }
}

