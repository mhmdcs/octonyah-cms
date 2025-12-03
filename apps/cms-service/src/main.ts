import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createValidationPipe, setupSwagger, findOpenApiSpec } from '@octonyah/shared-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(createValidationPipe());

  const specPath = findOpenApiSpec({ serviceName: 'cms-service', dirname: __dirname });
  if (specPath) {
    setupSwagger(app, { specPath, path: 'api' });
  }

  const port = process.env.CMS_PORT ?? process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`CMS service running on: http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/api`);
}
bootstrap();
