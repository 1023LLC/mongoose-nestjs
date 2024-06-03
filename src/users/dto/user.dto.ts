import { User } from '../interfaces/user.interface';

export class UserDto {
  readonly username: string;
  readonly email: string;

  constructor(user: User) {
    this.username = user.username;
    this.email = user.email;
  }
}
