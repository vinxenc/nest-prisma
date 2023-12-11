import { Exclude } from 'class-transformer';
import { IsString, MaxLength, IsEmail } from 'class-validator';

export class SignUpBody {
  @IsString()
  @MaxLength(55)
  username!: string;

  @IsString()
  @MaxLength(55)
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class SignUpRes extends SignUpBody {
  id!: number;

  @Exclude()
  password!: string;

  @Exclude()
  email!: string;
}

export class SignInBody {
  @IsString()
  @MaxLength(55)
  username!: string;

  @IsString()
  password!: string;
}

export class SignInRes extends SignUpRes {
  accessToken!: string;

  expiresIn!: number;
}
