import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({
      sub: (user._id as object).toString(),
      username: user.username,
      role: user.role,
    });

    return { access_token: token, role: user.role };
  }

  async register(dto: RegisterDto) {
    const exists = await this.usersService.existsByUsername(dto.username);
    if (exists) throw new ConflictException('Username already taken');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create(dto.username, hashed, 'patient');

    const token = this.jwtService.sign({
      sub: (user._id as object).toString(),
      username: user.username,
      role: user.role,
    });

    return { access_token: token, role: user.role };
  }
}
