/**
 * Programs Module
 * 
 * This file defines the Programs module, which encapsulates all program-related
 * functionality. Modules in NestJS organize code into cohesive units.
 * 
 * This module:
 * - Registers the Program entity with TypeORM for database access
 * - Provides ProgramsService for business logic
 * - Exposes ProgramsController for HTTP endpoints
 * - Exports ProgramsService so it can be used by other modules
 * 
 * This is a feature module that can be imported into the main CMS module.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { Program } from './entities/program.entity';

/**
 * Programs Module Configuration
 * 
 * - imports: Registers Program entity with TypeORM for this module
 * - controllers: Registers ProgramsController to handle HTTP requests
 * - providers: Registers ProgramsService for dependency injection
 * - exports: Makes ProgramsService available to other modules that import this one
 */
@Module({
  imports: [TypeOrmModule.forFeature([Program])],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService],
})
export class ProgramsModule {}

