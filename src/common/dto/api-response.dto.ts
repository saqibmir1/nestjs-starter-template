import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ example: null, nullable: true })
  data: T | null;

  @ApiProperty({ example: null, nullable: true })
  error: string | null;

  constructor(partial?: Partial<ApiResponseDto<T>>) {
    this.message = partial?.message ?? 'Operation completed successfully';
    this.data = partial?.data ?? null;
    this.error = partial?.error ?? null;
  }

  static success<T>(data?: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto<T>({
      message: message ?? 'Operation completed successfully',
      data: data ?? null,
      error: null,
    });
  }

  static error<T>(message: string, error?: string): ApiResponseDto<T> {
    return new ApiResponseDto<T>({
      message,
      data: null,
      error: error ?? message,
    });
  }
}
