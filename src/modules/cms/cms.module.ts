/**
 * CMS Module
 * 
 * This file defines the Content Management System (CMS) module.
 * It serves as the main module for all CMS-related functionality.
 * 
 * The CMS module:
 * - Imports and aggregates all CMS feature modules (currently ProgramsModule)
 * - Exports these modules so they can be used by the main AppModule
 * - Provides a clear boundary for CMS functionality
 * 
 * This modular structure allows for easy extension - new CMS features
 * (like imports, taxonomy, assets) can be added as separate modules
 * and imported here.
 */

import { Module } from '@nestjs/common';
import { ProgramsModule } from './programs/programs.module';

/**
 * CMS Module Configuration
 * 
 * - imports: Includes ProgramsModule and any other CMS feature modules
 * - exports: Makes all CMS modules available to the main AppModule
 */
@Module({
  imports: [ProgramsModule],
  exports: [ProgramsModule],
})
export class CmsModule {}

