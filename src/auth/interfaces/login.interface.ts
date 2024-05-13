import { ApiProperty } from '@nestjs/swagger';

export class Login {
  @ApiProperty({
    description: 'User email',
    example: 'lenana87@gmail.com',
  })
  readonly email: string;

  @ApiProperty({
    description: 'User password',
    example: 'lenana@123',
  })
  readonly password: string;
}
