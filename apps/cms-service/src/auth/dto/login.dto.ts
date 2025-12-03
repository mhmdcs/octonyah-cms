import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for user login credentials.
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
