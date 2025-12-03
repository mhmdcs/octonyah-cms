import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createValidationPipe, setupSwagger } from '@octonyah/shared-config';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(createValidationPipe());

  setupSwagger(app, {
    specPath: path.join(__dirname, '../../openapi.yaml'),
    path: 'api',
  });

  const port = process.env.CMS_PORT ?? process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`CMS service running on: http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/api`);
}
bootstrap();
