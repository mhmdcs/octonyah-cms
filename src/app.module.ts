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
import { ConfigModule } from '@nestjs/config';
import { CmsModule } from './modules/cms/cms.module';
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
    // Database configuration - SQLite database file named 'thmanyah.db'
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'thmanyah.db',
      entities: [Program], // Register all entities here
      synchronize: true, // Only for development - auto-creates/updates schema
    }),
    // Import CMS module which contains all CMS-related features
    CmsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
