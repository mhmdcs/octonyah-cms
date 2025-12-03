import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return { message: 'Hello World! Welcome to Octonyah CMS API' };
  }
}
