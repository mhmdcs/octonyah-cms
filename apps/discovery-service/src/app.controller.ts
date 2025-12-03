import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return { message: 'Welcome to the Octonyah Discovery API!' };
  }
}
