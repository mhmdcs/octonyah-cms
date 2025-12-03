import { SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export interface SwaggerConfigOptions {
  /**
   * Path to the OpenAPI YAML specification file
   */
  specPath: string;
  /**
   * URL path where Swagger UI will be served (default: 'api')
   */
  path?: string;
}

/**
 * Sets up Swagger UI using an external OpenAPI YAML specification file.
 * This keeps API documentation separate from application code for cleaner controllers.
 *
 * @param app - The NestJS application instance
 * @param options - Configuration options including the path to the YAML spec
 *
 * @example
 * ```typescript
 * setupSwagger(app, {
 *   specPath: path.join(__dirname, 'openapi.yaml'),
 *   path: 'api',
 * });
 * ```
 */
export function setupSwagger(
  app: INestApplication,
  options: SwaggerConfigOptions,
): void {
  const specFile = fs.readFileSync(options.specPath, 'utf8');
  const document = yaml.load(specFile) as OpenAPIObject;

  SwaggerModule.setup(options.path || 'api', app, document);
}
