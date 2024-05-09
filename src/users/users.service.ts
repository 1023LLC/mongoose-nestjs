/* eslint-disable prettier/prettier */

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/User.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) { }


    async findAll(): Promise<User[]> {
        return await this.userModel.find().exec();
    }


    async findByEmail(email: string): Promise<User> {
        return await this.userModel.findOne({ email: email }).exec();
    }

    async createNewUser(newUser: CreateUserDto): Promise<User> {
        if (this.isValidEmail(newUser.email) && newUser.password) {
            const userRegistered = await this.findByEmail(newUser.email);
            if (!userRegistered) {
                newUser.password = await bcrypt.hash(newUser.password, 10);
                const createdUser = new this.userModel(newUser);
                return await createdUser.save();
            } else if (!userRegistered.auth.email.valid) {
                return userRegistered;
            } else {
                throw new HttpException('REGISTRATION.USER_ALREADY_REGISTERED', HttpStatus.FORBIDDEN)
            }
        } else {
            throw new HttpException('REGISTRATION.MISSING_MANDATORY_PARAMETERS', HttpStatus.FORBIDDEN);
        }

    }

    isValidEmail(email: string) {
        if (email) {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        } else return false
    }

}
