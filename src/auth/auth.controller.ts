import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { IResponse } from '../common/interfaces/response.interface';
import { Login } from './interfaces/login.interface';
import { ResponseSuccess, ResponseError } from '../common/dto/response.dto';
import { UserDto } from 'src/users/dto/user.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('sign-in')
  @ApiOkResponse({
    description: 'Sign up success!',
    type: Login,
  })
  @ApiBadRequestResponse({
    description: 'Sign in failed!',
  })
  @HttpCode(HttpStatus.OK)
  public async login(@Body() login: Login): Promise<IResponse> {
    try {
      const response = await this.authService.validateLogin(
        login.email,
        login.password,
      );
      return new ResponseSuccess('LOGIN.SUCCESS', response);
    } catch (error) {
      return new ResponseError('LOGIN.ERROR', error);
    }
  }

  @Post('sign-up')
  @ApiBody({
    type: CreateUserDto,
    description: 'User information for registration',
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async register(@Body() createUserDto: CreateUserDto): Promise<IResponse> {
    try {
      const newUser = new UserDto(
        await this.userService.createNewUser(createUserDto),
      );
      await this.authService.createOtpToken(newUser.email);
      const sent = await this.authService.sendEmailVerification(newUser.email);
      if (sent) {
        return new ResponseSuccess('REGISTRATION.USER_REGISTERED_SUCCESSFULLY');
      } else {
        return new ResponseError('REGISTRATION.ERROR.MAIL_NOT_SENT');
      }
    } catch (error) {
      return new ResponseError('REGISTRATION.ERROR.GENERIC_ERROR', error);
    }
  }

  @Get('verify/:token')
  @ApiParam({
    name: 'token',
    type: 'string',
    description: 'The token to be verified',
  })
  @ApiResponse({
    status: 200,
    description: 'The email is successfully verified !',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Unauthorized - Token verification failed',
  })
  public async verifyEmail(@Param() params): Promise<IResponse> {
    try {
      const isEmailVerified = await this.authService.verifyEmail(params.token);
      await this.authService.updateOtpToken(params.token);
      return new ResponseSuccess('EMAIL_VERIFIED', isEmailVerified);
    } catch (error) {
      return new ResponseError('VERIFICATION FAILED!', error);
    }
  }

  @Get('forgot-password/:email')
  @ApiParam({
    name: 'email',
    type: 'string',
    description: 'User email',
  })
  @ApiResponse({
    status: 200,
    description: 'Password verification code sent successfully!',
  })
  public async sendEmailForgotPassword(@Param() params): Promise<IResponse> {
    try {
      const isEmailSent = await this.authService.sendEmailForgotPassword(
        params.email,
      );
      if (isEmailSent) {
        return new ResponseSuccess('LOGIN.EMAIL_RESENT', null);
      } else {
        return new ResponseError('REGISTRATION.ERROR.MAIL_NOT_SENT');
      }
    } catch (error) {
      return new ResponseError('LOGIN.ERROR.SEND_EMAIL', error);
    }
  }

  @Post('account/reset-password')
  @ApiBody({
    type: ResetPasswordDto,
    description: 'User information for registration',
  })
  @ApiResponse({
    status: 201,
    description: 'Password was changed successfully!',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async setNewPassord(
    @Body() resetPassword: ResetPasswordDto,
  ): Promise<IResponse> {
    try {
      let isNewPasswordChanged: boolean = false;
      if (resetPassword.email && resetPassword.currentPassword) {
        const isValidPassword = await this.authService.checkPassword(
          resetPassword.email,
          resetPassword.currentPassword,
        );
        if (isValidPassword) {
          // isNewPasswordChanged = await this.userService.setPassword(resetPassword.email, resetPassword.newPassword);
          if (resetPassword.newPasswordToken) {
            const forgottenPasswordModel =
              await this.authService.getForgottenPasswordModel(
                resetPassword.newPasswordToken,
              );
            isNewPasswordChanged = await this.userService.setPassword(
              forgottenPasswordModel.email,
              resetPassword.newPassword,
            );
            console.log('is new password changed', isNewPasswordChanged);
            if (isNewPasswordChanged)
              await forgottenPasswordModel.deleteOne({
                newPasswordToken: resetPassword.newPasswordToken,
              });
          }
        } else {
          return new ResponseError('RESET_PASSWORD.WRONG_CURRENT_PASSWORD');
        }
      } else if (resetPassword.newPasswordToken) {
        const forgottenPasswordModel =
          await this.authService.getForgottenPasswordModel(
            resetPassword.newPasswordToken,
          );
        isNewPasswordChanged = await this.userService.setPassword(
          forgottenPasswordModel.email,
          resetPassword.newPassword,
        );
        console.log('is new password changed', isNewPasswordChanged);
        if (isNewPasswordChanged)
          await forgottenPasswordModel.deleteOne({
            newPasswordToken: resetPassword.newPasswordToken,
          });
      } else {
        return new ResponseError('RESET_PASSWORD.CHANGE_PASSWORD_ERROR');
      }
      return new ResponseSuccess(
        'RESET_PASSWORD.PASSWORD_CHANGED',
        isNewPasswordChanged,
      );
    } catch (error) {
      return new ResponseError('RESET_PASSWORD.CHANGE_PASSWORD_ERROR', error);
    }
  }
}
