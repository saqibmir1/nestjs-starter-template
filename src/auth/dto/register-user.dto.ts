import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    example: 'John Doe',
  })
  fullName: string;

  @ApiProperty({
    example: 'johndoe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'strongpassword',
  })
  @IsNotEmpty()
  password: string;
}
