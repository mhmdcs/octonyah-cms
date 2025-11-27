/**
 * Discovery Module
 * 
 * This file defines the Discovery module, which encapsulates all discovery-related
 * functionality. This module provides public-facing endpoints for searching and
 * exploring programs.
 * 
 * This module:
 * - Registers the Program entity with TypeORM for database access
 * - Provides DiscoveryService for search and exploration logic
 * - Exposes DiscoveryController for public HTTP endpoints
 * - Is separate from the CMS module to maintain clear boundaries
 * 
 * The Discovery module uses the same Program entity as CMS but provides
 * a different interface optimized for public search and exploration.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryService } from './discovery.service';
import { DiscoveryController } from './discovery.controller';
import { ProgramEventsListener } from './program-events.listener';
import { Program } from '@octonyah/shared-programs';
import { RedisCacheModule } from '../cache/redis-cache.module';

/**
 * Discovery Module Configuration
 * 
 * - imports: Registers Program entity with TypeORM for this module
 * - controllers: Registers DiscoveryController to handle HTTP requests
 * - providers: Registers DiscoveryService for dependency injection
 */
@Module({
  imports: [TypeOrmModule.forFeature([Program]), RedisCacheModule],
  controllers: [DiscoveryController, ProgramEventsListener],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}

