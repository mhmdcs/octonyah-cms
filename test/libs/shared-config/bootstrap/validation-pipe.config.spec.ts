import { ValidationPipe } from '@nestjs/common';
import { createValidationPipe } from '@octonyah/shared-config/bootstrap/validation-pipe.config';

describe('createValidationPipe', () => {
  it('should create ValidationPipe with default options', () => {
    const pipe = createValidationPipe();

    expect(pipe).toBeInstanceOf(ValidationPipe);
  });

  it('should enable whitelist by default', () => {
    const pipe = createValidationPipe();

    // Access internal options through the pipe
    expect((pipe as any).validatorOptions?.whitelist).toBe(true);
  });

  it('should enable forbidNonWhitelisted by default', () => {
    const pipe = createValidationPipe();

    expect((pipe as any).validatorOptions?.forbidNonWhitelisted).toBe(true);
  });

  it('should enable transform by default', () => {
    const pipe = createValidationPipe();

    expect((pipe as any).isTransformEnabled).toBe(true);
  });

  it('should allow overriding options', () => {
    const pipe = createValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
    });

    expect((pipe as any).validatorOptions?.whitelist).toBe(false);
    expect((pipe as any).validatorOptions?.forbidNonWhitelisted).toBe(false);
  });

  it('should merge custom options with defaults', () => {
    const pipe = createValidationPipe({
      skipMissingProperties: true,
    });

    // Custom option should be set
    expect((pipe as any).validatorOptions?.skipMissingProperties).toBe(true);
    // Default options should still be applied
    expect((pipe as any).isTransformEnabled).toBe(true);
  });
});

