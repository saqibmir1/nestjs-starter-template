# Redis Module Implementation

This project now includes a dedicated Redis module for proper separation of concerns and better maintainability.

## Features

- **RedisService**: Centralized Redis operations with logging
- **OTP Management**: Dedicated methods for OTP storage and retrieval
- **Health Checks**: Redis connection monitoring
- **Graceful Shutdown**: Proper Redis connection cleanup
- **Error Handling**: Comprehensive error logging and handling

## Redis Service Methods

### Basic Operations
```typescript
// Set a key-value pair with optional TTL
await redisService.set('key', 'value', 300); // 300 seconds TTL

// Get a value
const value = await redisService.get('key');

// Delete a key
await redisService.del('key');

// Check if key exists
const exists = await redisService.exists('key');
```

### OTP-Specific Operations
```typescript
// Set OTP with 5-minute expiration (default)
await redisService.setOtp('user@example.com', '123456');

// Set OTP with custom expiration
await redisService.setOtp('user@example.com', '123456', 600); // 10 minutes

// Get OTP
const otp = await redisService.getOtp('user@example.com');

// Delete OTP after verification
await redisService.deleteOtp('user@example.com');
```

### Health Check
```typescript
// Ping Redis server
const response = await redisService.ping(); // Returns 'PONG'
```

## Usage in Auth Service

The auth service now uses the Redis service instead of direct Redis client:

```typescript
// Before (direct Redis usage)
await this.redisClient.setex(`otp:${user.email}`, 300, otp.toString());

// After (using Redis service)
await this.redisService.setOtp(user.email, otp.toString(), 300);
```

## Configuration

Redis connection is configured through the existing `redis.config.ts`:

```typescript
export default () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
});
```

## Health Monitoring

A health check endpoint is available at `/health` that monitors Redis connectivity:

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-08-01T10:00:00.000Z",
  "services": {
    "redis": "healthy"
  }
}
```

