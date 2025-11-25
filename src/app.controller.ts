/**
 * App Controller (Root Controller)
 * 
 * This file defines a simple root endpoint for basic testing and health checks.
 * It provides a "Hello World" endpoint to verify the application is running.
 * 
 * This controller is separate from the CMS functionality and serves as a
 * simple way to test that the server is up and responding to requests.
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Root Controller
 * Handles requests to the root path (/)
 */
@ApiTags('Root')
@Controller()
export class AppController {
  /**
   * GET /
   * 
   * Simple "Hello World" endpoint for testing.
   * Returns a welcome message to verify the server is running.
   * 
   * @returns A welcome message object
   */
  @Get()
  @ApiOperation({ summary: 'Hello World endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a welcome message',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Hello World! Welcome to Thmanyah CMS API' },
        status: { type: 'string', example: 'ok' },
      },
    },
  })
  getHello() {
    return {
      message: 'Hello World! Welcome to Thmanyah CMS API',
      status: 'ok',
    };
  }
}

