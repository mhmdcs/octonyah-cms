import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

export function createValidationPipe(
  options?: Partial<ValidationPipeOptions>,
): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    ...options,
  });
}

