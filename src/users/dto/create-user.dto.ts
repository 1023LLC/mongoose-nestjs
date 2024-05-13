import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'This is the username of the user',
    example: 'Lenana88',
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'This is the email address of the user',
    example: 'lenana87@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'lenana@123',
  })
  @IsNotEmpty()
  @IsString()
  @Length(7, 20, { message: 'Password to be between 3, 20 characters' })
  public password: string;

  @IsBoolean()
  isVerifiedEmail;
}
