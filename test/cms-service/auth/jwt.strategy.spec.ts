import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '@cms/auth/jwt.strategy';
import { JwtPayload } from '@cms/auth/jwt-payload.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object from JWT payload', async () => {
      const payload: JwtPayload = {
        sub: '1',
        username: 'admin',
        roles: ['admin', 'editor'],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: '1',
        username: 'admin',
        roles: ['admin', 'editor'],
      });
    });

    it('should handle payload with single role', async () => {
      const payload: JwtPayload = {
        sub: '2',
        username: 'editor',
        roles: ['editor'],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: '2',
        username: 'editor',
        roles: ['editor'],
      });
    });

    it('should handle payload with empty roles', async () => {
      const payload: JwtPayload = {
        sub: '3',
        username: 'guest',
        roles: [],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: '3',
        username: 'guest',
        roles: [],
      });
    });
  });
});

