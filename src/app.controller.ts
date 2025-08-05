import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // status check
  @Get('health')
  healthCheck(): { status: string } {
    console.log('health check');
    return { status: 'ok' };
  }
}
