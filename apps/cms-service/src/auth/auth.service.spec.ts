import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        JWT_EXPIRES_IN_SECONDS: '3600',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access token for valid admin credentials', async () => {
      const expectedToken = 'test-jwt-token';
      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      const result = await service.login({
        username: 'admin',
        password: 'admin123',
      });

      expect(result).toEqual({ access_token: expectedToken });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: '1',
          username: 'admin',
          roles: ['admin', 'editor'],
        }),
        { expiresIn: 3600 },
      );
    });

    it('should return access token for valid editor credentials', async () => {
      const expectedToken = 'test-jwt-token-editor';
      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      const result = await service.login({
        username: 'editor',
        password: 'editor123',
      });

      expect(result).toEqual({ access_token: expectedToken });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: '2',
          username: 'editor',
          roles: ['editor'],
        }),
        { expiresIn: 3600 },
      );
    });

    it('should throw UnauthorizedException for invalid username', async () => {
      await expect(
        service.login({
          username: 'invaliduser',
          password: 'admin123',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      await expect(
        service.login({
          username: 'admin',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with correct message', async () => {
      await expect(
        service.login({
          username: 'admin',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should use custom expiration from config', async () => {
      mockConfigService.get.mockImplementation((key: string, defaultValue?: string): string => {
        if (key === 'JWT_EXPIRES_IN_SECONDS') return '7200';
        return defaultValue ?? '';
      });

      mockJwtService.signAsync.mockResolvedValue('token');

      await service.login({
        username: 'admin',
        password: 'admin123',
      });

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.any(Object),
        { expiresIn: 7200 },
      );
    });
  });
});

