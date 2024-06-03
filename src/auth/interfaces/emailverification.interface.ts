import { Document } from 'mongoose';

export interface EmailVerification extends Document {
  email: string;
  otpToken: string;
  timestamp: Date;
}
