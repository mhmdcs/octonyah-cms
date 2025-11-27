import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Octonyah CMS Service')
    .setDescription('Internal service for managing programs')
    .setVersion('1.0')
    .addTag('CMS Programs', 'Program management endpoints (internal)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.CMS_PORT ?? process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`CMS service running on: http://localhost:${port}`);
}
bootstrap();
