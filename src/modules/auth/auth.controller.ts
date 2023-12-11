import * as bcrypt from 'bcrypt';
import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  BadRequestException,
  NotFoundException,
  Get,
} from '@nestjs/common';
import { PrismaService } from '@services';
import { plainToClass } from 'class-transformer';
import { JwtService } from '@nestjs/jwt';
import { SignInBody, SignInRes, SignUpBody, SignUpRes } from './auth.dto';
import { Public, expiresIn, saltRounds } from './auth.constant';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  @Post('/sign-in')
  @Public()
  async signIn(@Body() body: SignInBody): Promise<SignInRes> {
    const { username } = body;
    const user = await this.prismaService.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    const accessToken = this.jwtService.sign({ id: user.id, username: user.username });
    return plainToClass(SignInRes, { ...user, accessToken, expiresIn });
  }

  @Post('/sign-up')
  @Public()
  async signUp(@Body() body: SignUpBody): Promise<SignUpRes> {
    const { username, password, email } = body;
    const existedUser = await this.prismaService.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existedUser) {
      throw new BadRequestException('User Already Existed');
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.prismaService.user.create({
      data: { ...body, password: passwordHash },
    });

    return plainToClass(SignUpRes, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  getProfile(@Request() req): Promise<any> {
    return req.user;
  }
}
