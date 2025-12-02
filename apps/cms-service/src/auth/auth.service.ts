import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from './roles.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';

interface UserRecord {
  id: string;
  username: string;
  password: string;
  roles: Role[];
}

const USERS: UserRecord[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    roles: ['admin', 'editor'],
  },
  {
    id: '2',
    username: 'editor',
    password: 'editor123',
    roles: ['editor'],
  },
];

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = this.validateUser(dto.username, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const payload: JwtPayload = { sub: user.id, username: user.username, roles: user.roles };
    const expiresIn = parseInt(this.configService.get<string>('JWT_EXPIRES_IN_SECONDS') ?? '3600', 10);

    return { access_token: await this.jwtService.signAsync(payload, { expiresIn }) };
  }

  private validateUser(username: string, password: string) {
    return USERS.find((u) => u.username === username && u.password === password) ?? null;
  }
}

