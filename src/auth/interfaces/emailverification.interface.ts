/* eslint-disable prettier/prettier */



import { Document } from 'mongoose';

export interface EmailVerification extends Document{
    email: string;
    emailToken: string;
    timestamp: Date;
  }