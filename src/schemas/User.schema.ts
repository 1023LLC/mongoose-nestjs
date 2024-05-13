import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class User {
  @ApiProperty({
    description: 'User username',
    example: 'Lenana87',
  })
  @Prop({ required: true })
  username: string;

  @ApiProperty({
    description: 'User email address',
    example: 'lenana87@gmail.com',
  })
  @Prop({ required: true })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'lenana@123',
  })
  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isVerifiedEmail: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
