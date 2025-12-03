import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@cms/auth/auth.controller';
import { AuthService } from '@cms/auth/auth.service';
import { LoginDto } from '@cms/auth/dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token on successful login', async () => {
      const loginDto: LoginDto = {
        username: 'admin',
        password: 'admin123',
      };
      const expectedResult = { access_token: 'jwt-token' };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should pass through service errors', async () => {
      const loginDto: LoginDto = {
        username: 'invalid',
        password: 'invalid',
      };

      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });
});

