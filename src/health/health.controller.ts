import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(private readonly redisService: RedisService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    try {
      // Check Redis connection
      const redisPing = await this.redisService.ping();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          redis: redisPing === 'PONG' ? 'healthy' : 'unhealthy',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        services: {
          redis: 'unhealthy',
        },
        error: error.message,
      };
    }
  }
}
