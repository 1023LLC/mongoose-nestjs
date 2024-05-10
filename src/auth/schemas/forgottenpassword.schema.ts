/* eslint-disable prettier/prettier */



import mongoose, { Schema } from 'mongoose';

export const ForgottenPasswordSchema = new Schema({
    email: String,
    newPasswordToken: String,
    timestamp: Date
});

export const ForgottenPasswordModel = mongoose.model('ForgottenPassword', ForgottenPasswordSchema);
