import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../user/entities/user.entity';
import { MailModule } from '../../mail/mail.module';
import { UsersMapper } from '../../user/user.mapper';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forFeature([User]),
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: () => ({
            secret: 'test-secret',
          }),
        }),
        MailModule,
      ],
      providers: [
        LocalStrategy,
        AuthService,
        UsersMapper,
        {
          provide: 'UserRepository',
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate user with correct credentials', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      isVerified: true,
    };

    jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);

    const result = await strategy.validate('test@example.com', 'password');
    expect(result).toEqual(mockUser);
  });

  it('should throw UnauthorizedException for invalid credentials', async () => {
    jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

    await expect(
      strategy.validate('test@example.com', 'wrongpassword'),
    ).rejects.toThrow('Invalid credentials');
  });
});
