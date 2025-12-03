import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createValidationPipe, setupSwagger } from '@octonyah/shared-config';
import * as path from 'path';
import * as fs from 'fs';

function findOpenApiSpec(): string {
  // Try multiple possible locations for openapi.yaml
  const possiblePaths = [
    path.join(__dirname, '../../openapi.yaml'),           // Development
    path.join(__dirname, '../../../apps/cms-service/openapi.yaml'),  // Docker compiled
    path.join(process.cwd(), 'apps/cms-service/openapi.yaml'),       // From project root
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

  app.useGlobalPipes(createValidationPipe());

  const specPath = findOpenApiSpec();
  if (specPath) {
    setupSwagger(app, { specPath, path: 'api' });
  }

  const port = process.env.CMS_PORT ?? process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`CMS service running on: http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/api`);
}
bootstrap();
