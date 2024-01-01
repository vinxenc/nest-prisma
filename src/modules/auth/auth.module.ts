import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@common/strategies';
import { AuthController } from './auth.controller';
import { expiresIn, jwtSecretKey } from './auth.constant';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [AuthController],
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: jwtSecretKey,
      signOptions: { expiresIn },
    }),
  ],
  providers: [JwtStrategy],
})
export class AuthModule {}
