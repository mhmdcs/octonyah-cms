/**
 * Discovery App Controller
 *
 * Provides a basic health-check endpoint for the discovery microservice.
 * Allows quick verification that the service is running and reachable.
 */

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  /**
   * GET /
   *
   * Simple hello endpoint for smoke testing the discovery service.
   *
   * @returns An acknowledgement payload.
   */
  @Get()
  @ApiOperation({ summary: 'Discovery service heartbeat' })
  @ApiResponse({
    status: 200,
    description: 'Returns a welcome message for the discovery service',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Hello! Welcome to the Octonyah Discovery API',
        },
        status: { type: 'string', example: 'ok' },
      },
    },
  })
  getHello() {
    return {
      message: 'Hello! Welcome to the Octonyah Discovery API',
      status: 'ok',
    };
  }
}

