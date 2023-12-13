import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '@services';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { expiresIn, jwtSecretKey } from './auth.constant';
import { JwtStrategy } from '@common';

@Module({
  controllers: [AuthController],
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtSecretKey,
      signOptions: { expiresIn },
    }),
  ],
  providers: [PrismaService, JwtStrategy],
})
export class AuthModule {}
