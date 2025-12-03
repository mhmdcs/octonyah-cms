import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { createValidationPipe, setupSwagger, findOpenApiSpec } from '@octonyah/shared-config';
import { RmqModule } from '@octonyah/shared-events';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(createValidationPipe());

  const rmqOptions: MicroserviceOptions = RmqModule.forMicroservice();
  app.connectMicroservice(rmqOptions);

  const specPath = findOpenApiSpec({ serviceName: 'discovery-service', dirname: __dirname });
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
