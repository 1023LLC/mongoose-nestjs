import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from '../users/interfaces/user.interface';
import { InjectModel } from '../../node_modules/@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JWTService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private configService: ConfigService,
  ) {}

  async createToken(email) {
    const expiresIn = this.configService.get('JWT_EXPIRES_IN'),
      secretOrKey = this.configService.get('JWT_SECRET');
    const userInfo = { email: email };
    const token = jwt.sign(userInfo, secretOrKey, { expiresIn });
    return {
      expires_in: expiresIn,
      access_token: token,
    };
  }

  async validateUser(signedUser): Promise<User> {
    const userFromDb = await this.userModel.findOne({
      email: signedUser.email,
    });
    if (userFromDb) {
      return userFromDb;
    }
    return null;
  }
}
