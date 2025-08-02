import { Injectable } from '@nestjs/common';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { ResponseUserDto } from './dto/response-user.dto';

@Injectable()
export class UsersMapper {
  toResponse(data: any): ResponseUserDto {
    const d = instanceToPlain(data);
    const response = plainToClass(ResponseUserDto, d, {
      excludeExtraneousValues: true,
    });
    return response;
  }

  toArrayResponse(data: any): ResponseUserDto[] {
    return data.map((item: any) => {
      const d = instanceToPlain(item);
      return plainToClass(ResponseUserDto, d, {
        excludeExtraneousValues: true,
      });
    });
  }
}
