import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { createValidationPipe, setupSwagger } from '@octonyah/shared-config';
import { RmqModule } from '@octonyah/shared-events';
import * as path from 'path';
import * as fs from 'fs';

function findOpenApiSpec(): string {
  // Try multiple possible locations for openapi.yaml
  const possiblePaths = [
    path.join(__dirname, '../../openapi.yaml'),           // Development
    path.join(__dirname, '../../../apps/discovery-service/openapi.yaml'),  // Docker compiled
    path.join(process.cwd(), 'apps/discovery-service/openapi.yaml'),       // From project root
  ];
  
  for (const specPath of possiblePaths) {
    if (fs.existsSync(specPath)) {
      return specPath;
    }
  }
  
  console.warn('OpenAPI spec not found, Swagger UI will not be available');
  return '';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(createValidationPipe());

  const rmqOptions: MicroserviceOptions = RmqModule.forMicroservice();

  app.connectMicroservice(rmqOptions);

  const specPath = findOpenApiSpec();
  if (specPath) {
    setupSwagger(app, { specPath, path: 'api' });
  }

  await app.startAllMicroservices();

  const port =
    configService.get<number>('DISCOVERY_PORT') ??
    configService.get<number>('PORT') ??
    3001;

  await app.listen(port);
  console.log(`Discovery service running on: http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/api`);
}

bootstrap();
