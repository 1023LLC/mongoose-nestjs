/* eslint-disable prettier/prettier */



import mongoose, { Schema } from 'mongoose';

export const EmailVerificationSchema = new Schema({
  email: String,
  emailToken: String,
  timestamp: Date
});

export const EmailVerificationModel = mongoose.model('EmailVerification', EmailVerificationSchema);
