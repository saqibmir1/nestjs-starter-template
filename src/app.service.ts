import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}
  getHello() {
    return {
      name: this.configService.get('app.title'),
      version: this.configService.get('app.version'),
    };
  }
}
