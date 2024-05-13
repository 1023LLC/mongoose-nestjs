import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { ResponseError, ResponseSuccess } from 'src/common/dto/response.dto';
import { IResponse } from 'src/common/interfaces/response.interface';
import { UserDto } from './dto/user.dto';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':email')
  @ApiParam({
    name: 'email',
    type: 'string',
    description: 'Email',
  })
  @ApiResponse({
    status: 200,
    description: 'Success!',
  })
  async findById(@Param() params): Promise<IResponse> {
    try {
      const user = await this.usersService.findByEmail(params.email);
      return new ResponseSuccess('COMMON.SUCCESS', new UserDto(user));
    } catch (error) {
      return new ResponseError('COMMON.ERROR.GENERIC_ERROR', error);
    }
  }
}
