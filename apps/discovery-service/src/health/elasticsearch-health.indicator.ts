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
      const response = await this.elasticsearchService.ping();
      const isHealthy = response === true;

      const result = this.getStatus(key, isHealthy);

      if (isHealthy) {
        return result;
      }

      throw new HealthCheckError('Elasticsearch health check failed', result);
    } catch (error) {
      throw new HealthCheckError('Elasticsearch health check failed', this.getStatus(key, false, { message: error.message }));
    }
  }
}

