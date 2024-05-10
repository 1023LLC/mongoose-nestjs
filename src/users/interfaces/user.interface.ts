/* eslint-disable prettier/prettier */



// import { Document } from 'mongoose';

export interface User {
  username: string;
  email: string;
  password: string;
  isVerifiedEmail: boolean;
}
