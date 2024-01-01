import { STRING_LENGTH_55 } from '@common/constants';
import { Exclude } from 'class-transformer';
import { IsString, MaxLength, IsEmail, IsNotEmpty } from 'class-validator';

export class SignUpBody {
  @IsNotEmpty()
  @IsString()
  @MaxLength(STRING_LENGTH_55)
  username!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(STRING_LENGTH_55)
  @IsEmail()
  email!: string;

  @IsNotEmpty()
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
  @IsNotEmpty()
  @IsString()
  @MaxLength(STRING_LENGTH_55)
  username!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class SignInRes extends SignUpRes {
  accessToken!: string;

  expiresIn!: number;
}
