import * as path from 'path';
import * as fs from 'fs';

export interface OpenApiSpecFinderOptions {
  /** The service name (e.g., 'cms-service', 'discovery-service') */
  serviceName: string;
  /** The __dirname from the calling module */
  dirname: string;
}

/**
 * Finds the OpenAPI specification file for a service.
 * Tries multiple possible locations to support both development and Docker environments.
 *
 * @returns Path to the spec file if found, empty string otherwise
 */
export function findOpenApiSpec(options: OpenApiSpecFinderOptions): string {
  const { serviceName, dirname } = options;
  
  const possiblePaths = [
    path.join(dirname, '../../openapi.yaml'),                    // Development
    path.join(dirname, `../../../apps/${serviceName}/openapi.yaml`), // Docker compiled
    path.join(process.cwd(), `apps/${serviceName}/openapi.yaml`),    // From project root
  ];

  for (const specPath of possiblePaths) {
    if (fs.existsSync(specPath)) {
      return specPath;
    }
  }

  console.warn('OpenAPI spec not found, Swagger UI will not be available');
  return '';
}

