import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'User email',
    example: 'lenana87@gmail.com',
  })
  readonly email: string;

  @ApiProperty({
    description: 'User new password',
    example: 'lenana@123',
  })
  readonly newPassword: string;

  @ApiProperty({
    description: 'Password token',
    example: '7689087',
  })
  readonly newPasswordToken: string;

  @ApiProperty({
    description: 'User current password',
    example: 'lenana@123',
  })
  readonly currentPassword: string;
}
