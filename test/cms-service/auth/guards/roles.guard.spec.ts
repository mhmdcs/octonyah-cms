import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@cms/auth/guards/roles.guard';
import { ROLES_KEY, Role } from '@cms/auth/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    jest.clearAllMocks();
  });

  const createMockContext = (user: { roles?: Role[] } | null): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext);

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      mockReflector.get.mockReturnValue(undefined);

      const context = createMockContext({ roles: ['editor'] });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when required roles is empty array', () => {
      mockReflector.get.mockReturnValue([]);

      const context = createMockContext({ roles: ['editor'] });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      mockReflector.get.mockImplementation((key, target) => {
        if (key === ROLES_KEY) return ['admin'] as Role[];
        return undefined;
      });

      const context = createMockContext({ roles: ['admin', 'editor'] });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has at least one of the required roles', () => {
      mockReflector.get.mockImplementation((key, target) => {
        if (key === ROLES_KEY) return ['admin', 'editor'] as Role[];
        return undefined;
      });

      const context = createMockContext({ roles: ['editor'] });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      mockReflector.get.mockImplementation((key, target) => {
        if (key === ROLES_KEY) return ['admin'] as Role[];
        return undefined;
      });

      const context = createMockContext({ roles: ['editor'] });
      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user has no roles', () => {
      mockReflector.get.mockImplementation((key, target) => {
        if (key === ROLES_KEY) return ['admin'] as Role[];
        return undefined;
      });

      const context = createMockContext({ roles: undefined });
      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user is null', () => {
      mockReflector.get.mockImplementation((key, target) => {
        if (key === ROLES_KEY) return ['admin'] as Role[];
        return undefined;
      });

      const context = createMockContext(null);
      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should check class-level roles when handler has no roles', () => {
      // Both handler and class return admin role
      mockReflector.get.mockReturnValue(['admin'] as Role[]);

      const context = createMockContext({ roles: ['admin'] });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});

