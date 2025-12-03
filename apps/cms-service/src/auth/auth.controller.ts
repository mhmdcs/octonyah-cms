import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ThrottleAuth } from '@octonyah/shared-throttler';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ThrottleAuth() // 5 requests per minute - prevent brute force
  @ApiOperation({ summary: 'Login and retrieve JWT access token' })
  @ApiResponse({
    status: 200,
    description: 'JWT access token',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts. Please wait before retrying.',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}

