import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export interface SwaggerConfigOptions {
  title: string;
  description: string;
  version?: string;
  tags?: Array<{ name: string; description?: string }>;
  enableBearerAuth?: boolean;
  path?: string;
}

export function setupSwagger(app: INestApplication, options: SwaggerConfigOptions): void {
  const config = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion(options.version || '1.0');

  options.tags?.forEach((tag) => config.addTag(tag.name, tag.description));
  if (options.enableBearerAuth) config.addBearerAuth();

  SwaggerModule.setup(options.path || 'api', app, SwaggerModule.createDocument(app, config.build()));
}

