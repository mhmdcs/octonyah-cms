/**
 * App Module (Root Module)
 * 
 * This is the root module of the NestJS application. It serves as the entry point
 * and orchestrates all other modules and global configurations.
 * 
 * Responsibilities:
 * - Configures global modules (ConfigModule for environment variables)
 * - Sets up database connection (TypeORM with SQLite)
 * - Imports feature modules (CMS module)
 * - Defines application-wide settings
 * 
 * This is the top-level module that NestJS uses to bootstrap the application.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CmsModule } from './modules/cms/cms.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { AppController } from './app.controller';
import { Program } from './modules/cms/programs/entities/program.entity';

/**
 * Root Module Configuration
 * 
 * - ConfigModule: Makes environment variables available throughout the app
 * - TypeOrmModule: Configures database connection (SQLite for simplicity)
 *   - synchronize: true automatically creates/updates database schema (dev only!)
 * - CmsModule: Imports the CMS feature module with all its functionality
 */
@Module({
  imports: [
    // Global configuration module - makes .env variables available app-wide
    ConfigModule.forRoot({ isGlobal: true }),
    // Database configuration - PostgreSQL connection driven by environment variables
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: (config.get<string>('DB_TYPE') || 'postgres') as 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'octonyah'),
        entities: [Program], // Register all entities here
        synchronize: config.get<string>('NODE_ENV') !== 'production', // Auto sync only outside prod
      }),
    }),
    // Import CMS module which contains all CMS-related features
    CmsModule,
    // Import Discovery module for public search and exploration
    DiscoveryModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
