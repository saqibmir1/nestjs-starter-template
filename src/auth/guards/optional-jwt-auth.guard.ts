import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to not throw errors when authentication fails
  handleRequest(err: any, user: any) {
    // No error is thrown if user is not found
    // This allows the endpoint to work without authentication
    return user;
  }
}
