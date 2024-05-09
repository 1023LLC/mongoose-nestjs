/* eslint-disable prettier/prettier */


import { Body, Controller, Get, NotFoundException, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from 'src/schemas/User.schema';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}



  @Post('signup')
  @UsePipes(new ValidationPipe())
  createUser(@Body() createUserDto: CreateUserDto){
    console.log(createUserDto)
    return this.usersService.createNewUser(createUserDto)
  }

  @Get()
  async findAll(): Promise<User[]> {
    try {
      const users = await this.usersService.findAll();
      return users;
    } catch (error) {
      throw error;
    }
  }


  @Get(':email')
  async findById(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user
  }

}
