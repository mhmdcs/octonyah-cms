import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {

  @Get()
  getHello() {
    return {
      message: 'Welcome to the Octonyah Discovery API!'
    };
  }
}

