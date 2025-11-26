/**
 * Main Application Entry Point
 * 
 * This file is the entry point of the NestJS application. It bootstraps
 * the application and configures global settings.
 * 
 * Responsibilities:
 * - Creates the NestJS application instance
 * - Configures global validation pipe for automatic request validation
 * - Starts the HTTP server on the specified port (default: 3000)
 * 
 * This is the first file executed when the application starts.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstrap function that initializes and starts the NestJS application.
 * 
 * This function:
 * 1. Creates the NestJS application from AppModule
 * 2. Configures global validation pipe to automatically validate all incoming requests
 * 3. Sets up Swagger UI for API documentation and testing
 * 4. Starts the HTTP server on port 3000 (or PORT from environment)
 */
async function bootstrap() {
  // Create NestJS application instance from the root module
  const app = await NestFactory.create(AppModule);
  
  // Configure global validation pipe
  // This automatically validates all incoming request data using DTO decorators
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are sent
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  // Configure Swagger/OpenAPI documentation
  // This creates an interactive API documentation UI at /api
  const config = new DocumentBuilder()
    .setTitle('Octonyah CMS API')
    .setDescription('Content Management System API for managing video podcasts and documentaries. Includes CMS endpoints for content management and Discovery endpoints for public search and exploration.')
    .setVersion('1.0')
    .addTag('Root', 'Root endpoint for testing')
    .addTag('CMS Programs', 'Program management endpoints (internal)')
    .addTag('Discovery', 'Public search and exploration endpoints')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start the HTTP server
  // Uses PORT from environment variables, or defaults to 3000
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger UI is available at: http://localhost:${port}/api`);
}

// Execute the bootstrap function to start the application
bootstrap();
