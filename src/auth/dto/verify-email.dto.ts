import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: '0c8d88ef-53a9-4281-8630-e4e5c2bdd779',
    description: 'User ID',
  })
  @IsUUID()
  id: string;

  @ApiProperty({ example: '123456', description: 'One-time password (OTP)' })
  otp: string;
}
