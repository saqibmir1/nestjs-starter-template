import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: configService.get<string>('redis.host'),
      port: configService.get<number>('redis.port'),
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redisClient.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redisClient.setex(key, ttlSeconds, value);
    } else {
      await this.redisClient.set(key, value);
    }
    this.logger.debug(`Set key: ${key} with TTL: ${ttlSeconds || 'none'}`);
  }

  async get(key: string): Promise<string | null> {
    const value = await this.redisClient.get(key);
    this.logger.debug(`Get key: ${key}, found: ${!!value}`);
    return value;
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
    this.logger.debug(`Deleted key: ${key}`);
  }

  async exists(key: string): Promise<boolean> {
    const exists = await this.redisClient.exists(key);
    return exists === 1;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.redisClient.expire(key, ttlSeconds);
    this.logger.debug(`Set expiration for key: ${key}, TTL: ${ttlSeconds}`);
  }

  async ttl(key: string): Promise<number> {
    return await this.redisClient.ttl(key);
  }

  // Method for storing OTP with automatic expiration
  async setOtp(
    email: string,
    otp: string,
    ttlSeconds: number = 300,
  ): Promise<void> {
    const key = `otp:${email}`;
    await this.set(key, otp, ttlSeconds);
    this.logger.log(`OTP set for email: ${email} with TTL: ${ttlSeconds}s`);
  }

  // Method for retrieving OTP
  async getOtp(email: string): Promise<string | null> {
    const key = `otp:${email}`;
    const otp = await this.get(key);
    this.logger.log(`OTP retrieved for email: ${email}, found: ${!!otp}`);
    return otp;
  }

  // Method for deleting OTP
  async deleteOtp(email: string): Promise<void> {
    const key = `otp:${email}`;
    await this.del(key);
    this.logger.log(`OTP deleted for email: ${email}`);
  }

  // Health check method
  async ping(): Promise<string> {
    return await this.redisClient.ping();
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    await this.redisClient.quit();
    this.logger.log('Redis connection closed');
  }
}
