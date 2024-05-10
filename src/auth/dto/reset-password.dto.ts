/* eslint-disable prettier/prettier */


export class ResetPasswordDto {
  readonly email: string;
  readonly newPassword: string;
  readonly newPasswordToken: string;
  readonly currentPassword: string;
}