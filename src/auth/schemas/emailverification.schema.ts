import mongoose, { Schema } from 'mongoose';

export const EmailVerificationSchema = new Schema({
  email: String,
  otpToken: String,
  timestamp: Date,
});

export const EmailVerificationModel = mongoose.model(
  'EmailVerification',
  EmailVerificationSchema,
);
