/* eslint-disable prettier/prettier */



import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/schemas/User.schema';
import { UsersService } from 'src/users/users.service';
import { JWTService } from './jwt.service';
import { EmailVerificationSchema } from './schemas/emailverification.schema';
import { ForgottenPasswordSchema } from './schemas/forgottenpassword.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'User', schema: UserSchema },
    { name: 'EmailVerification', schema: EmailVerificationSchema },
    { name: 'ForgottenPassword', schema: ForgottenPasswordSchema },
  ])],
  controllers: [AuthController],
  providers: [AuthService, UsersService, JWTService],
})
export class AuthModule {}
