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
import { AppModule } from './app.module';

/**
 * Bootstrap function that initializes and starts the NestJS application.
 * 
 * This function:
 * 1. Creates the NestJS application from AppModule
 * 2. Configures global validation pipe to automatically validate all incoming requests
 * 3. Starts the HTTP server on port 3000 (or PORT from environment)
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

  // Start the HTTP server
  // Uses PORT from environment variables, or defaults to 3000
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
}

// Execute the bootstrap function to start the application
bootstrap();
