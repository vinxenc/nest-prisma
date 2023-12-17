import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '@services';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@common';
import { AuthController } from './auth.controller';
import { expiresIn, jwtSecretKey } from './auth.constant';
import { LoggerModule } from '../logger/logger.module';

@Module({
  controllers: [AuthController],
  imports: [
    LoggerModule,
    PassportModule,
    JwtModule.register({
      secret: jwtSecretKey,
      signOptions: { expiresIn },
    }),
  ],
  providers: [PrismaService, JwtStrategy],
})
export class AuthModule {}
