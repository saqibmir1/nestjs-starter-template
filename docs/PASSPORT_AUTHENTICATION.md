# Passport Authentication Implementation

This project now includes NestJS Passport authentication with JWT and Local strategies.

## Features

- **Local Strategy**: For email/password authentication
- **JWT Strategy**: For protecting routes with JWT tokens
- **Optional JWT Guard**: For routes that work with or without authentication
- **Current User Decorator**: Easy access to authenticated user data

## Authentication Flow

### 1. Login with Local Strategy

The login endpoint uses Passport's Local Strategy to validate credentials:

```typescript
@UseGuards(LocalAuthGuard)
@Post('auth/login')
async login(@CurrentUser() user: User, @Body() loginDto: LoginDto) {
  // User is validated by LocalAuthGuard
  const tokens = await this.authService.generateTokens({
    id: user.id,
    email: user.email,
  });
  
  return {
    success: true,
    message: 'Login successful',
    data: { tokens, user }
  };
}
```

### 2. Protected Routes with JWT

Use `JwtAuthGuard` to protect routes that require authentication:

```typescript
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return { success: true, data: user };
  }
}
```

### 3. Optional Authentication

Use `OptionalJwtAuthGuard` for routes that work with or without authentication:

```typescript
@UseGuards(OptionalJwtAuthGuard)
@Get('posts')
async getPosts(@CurrentUser() user?: User) {
  // user will be undefined if not authenticated
  // user will contain user data if authenticated
  if (user) {
    // Show user-specific content
  } else {
    // Show public content
  }
}
```

## Available Guards

1. **LocalAuthGuard**: For login endpoints
2. **JwtAuthGuard**: For protected routes requiring authentication
3. **OptionalJwtAuthGuard**: For routes that optionally use authentication

## Current User Decorator

Use `@CurrentUser()` to easily access the authenticated user:

```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

## Authentication Strategies

### LocalStrategy
- Validates email/password credentials
- Checks if user exists and password is correct
- Ensures email is verified
- Returns user object without password

### JwtStrategy
- Validates JWT tokens from Authorization header
- Checks if user still exists
- Ensures email is verified
- Returns user object without password

