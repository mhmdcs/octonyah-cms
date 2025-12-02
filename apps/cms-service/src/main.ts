import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createValidationPipe, setupSwagger } from '@octonyah/shared-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(createValidationPipe());

  setupSwagger(app, {
    title: 'Octonyah CMS Service',
    description: 'Internal service for managing videos',
    version: '1.0',
    tags: [
      { name: 'CMS Video', description: 'Video management endpoints (internal)' },
    ],
    enableBearerAuth: true,
    path: 'api',
  });

  const port = process.env.CMS_PORT ?? process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`CMS service running on: http://localhost:${port}`);
}
bootstrap();
