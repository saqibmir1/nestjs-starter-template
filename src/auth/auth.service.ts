import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import * as argon2 from 'argon2';
import { MessageDto } from 'src/common/dto/generic-message.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersMapper } from 'src/user/user.mapper';
import { UserPayload } from './dto/user-payload.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersMapper: UsersMapper,
    private readonly redisService: RedisService,
  ) {}

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: {
        email,
      },
    });
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: {
        id,
      },
    });
    return user;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.getUserByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      return null;
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _unused, ...result } = user;
    return result;
  }

  async register(registerUserDto: RegisterUserDto): Promise<MessageDto> {
    const existingUser = await this.getUserByEmail(registerUserDto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
    const newUser = this.userRepo.create(registerUserDto);
    await this.userRepo.save(newUser);
    this.logger.log(`User ${newUser.id} registered successfully`);
    await this.sendOtp(newUser.id);

    return ApiResponseDto.success(
      this.usersMapper.toResponse(newUser),
      'User registered successfully, OTP send to email.',
    );
  }

  async sendOtp(id: string) {
    const user: User | null = await this.getUserById(id);
    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000);
    await this.redisService.setOtp(user.email, otp.toString(), 300);
    await this.mailService.sendAccountVerificationOtp(
      user.email,
      otp.toString(),
    );

    this.logger.log(`OTP sent to ${user.email}`);
    return ApiResponseDto.success(null, 'OTP sent successfully');
  }

  async verifyOtp(data: VerifyEmailDto) {
    const { id, otp } = data;
    const user = await this.getUserById(id);
    if (!user) throw new NotFoundException('User not found');

    const savedOtp = await this.redisService.getOtp(user.email);
    if (savedOtp != otp) throw new UnauthorizedException('Invalid OTP');

    // verify user
    // set isVerified to true
    await this.userRepo.update(user.id, { isVerified: true });

    await this.redisService.deleteOtp(user.email);
    this.logger.log(`User ${user.id} verified successfully`);

    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
    });
    const verifiedUser = await this.getUserById(user.id);
    const mappedUser = this.usersMapper.toResponse(verifiedUser);
    return ApiResponseDto.success(
      { tokens, user: mappedUser },
      'User verified successfully',
    );
  }

  async generateTokens(user: UserPayload) {
    const payload: UserPayload = user;

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>('jwt.accessTokenExpiresIn'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>('jwt.refreshTokenExpiresIn'),
    });

    this.logger.log(`Tokens generated for user: ${user.id}`);
    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token must be provided');
    }
    const secret = this.configService.get<string>('jwt.secret');

    const payload = await this.jwtService.verifyAsync<{
      id: string;
      email: string;
    }>(refreshToken, {
      secret,
    });

    const user = await this.getUserByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
    });
    return ApiResponseDto.success(tokens, 'Token refreshed successfully');
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.getUserByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    // generate jwt token
    const token = this.jwtService.sign(
      { email: user.email, userId: user.id },
      { expiresIn: '15m' },
    );

    // generate reset link with token
    const baseUrl = this.configService.get<string>('app.baseUrl');
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

    // send email with reset link
    await this.mailService.sendPasswordResetLink(user.email, resetLink);

    this.logger.log(`Password reset Link sent to ${user.email}`);
    return ApiResponseDto.success(
      null,
      'Password reset link sent successfully',
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    // Verify the JWT token
    const payload = this.jwtService.verify(token);
    const { email, userId } = payload;

    const user = await this.userRepo.findOne({
      where: { id: userId, email: email },
    });
    if (!user) throw new NotFoundException('User not found');

    user.password = password;
    await this.userRepo.save(user);

    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
    });

    this.logger.log(`Password updated for user ${user.id}`);

    const mappedUser = this.usersMapper.toResponse(user);
    return ApiResponseDto.success(
      { tokens, user: mappedUser },
      'Password updated successfully',
    );
  }

  async googleLogin(googleUser: any): Promise<any> {
    const { email, fullName } = googleUser;

    let user = await this.getUserByEmail(email);

    if (!user) {
      // Create new user
      user = this.userRepo.create({
        email,
        fullName,
        isVerified: true, // Google users are automatically verified
        oauthProvider: 'google',
      });
      await this.userRepo.save(user);
      this.logger.log(`New Google user ${user.id} registered successfully`);
    } else {
      // Update existing user with Google provider if not set
      if (!user.oauthProvider) {
        user.oauthProvider = 'google';
        user.isVerified = true;
        await this.userRepo.save(user);
      }
    }

    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
    });

    const mappedUser = this.usersMapper.toResponse(user);
    return { tokens, user: mappedUser };
  }
}
