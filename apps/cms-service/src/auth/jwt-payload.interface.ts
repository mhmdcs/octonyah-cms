import { Role } from './roles.decorator';

export interface JwtPayload {
  sub: string;
  username: string;
  roles: Role[];
}

