import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseUserDto {
  @ApiProperty({
    type: String,
    example: '10a6456b-8c3c-4116-ab0f-70e550d4ab41',
  })
  @Expose()
  id: string;

  @Expose({ name: 'full_name' })
  @ApiProperty({
    type: String,
    example: 'John Doe',
  })
  full_name: string;

  @Expose()
  @ApiProperty({
    type: Boolean,
    example: true,
  })
  is_verified: boolean;

  @ApiProperty({
    type: String,
    example: 'johndoe@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    type: String,
    example: '1234567890',
  })
  @Expose({ name: 'phone_number' })
  phone_number: string;
}

export class ApiResponseUserDto {
  @ApiProperty({ type: String })
  message: string = 'Operation completed successfully';

  @ApiProperty({ type: ResponseUserDto })
  data: ResponseUserDto;

  @ApiProperty()
  error: any = null;
}
