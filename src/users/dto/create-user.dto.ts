/* eslint-disable prettier/prettier */

import { IsBoolean, IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsEmail()
    public email: string;

    @IsNotEmpty()
    @IsString()
    @Length(7, 20, {  message: 'Password to be between 3, 20 characters'})
    public password: string

    @IsBoolean()
    isVerifiedEmail

   
}