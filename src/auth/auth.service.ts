/* eslint-disable prettier/prettier */


import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { UserDto } from 'src/users/dto/user.dto';
import { User } from 'src/users/interfaces/user.interface';
import { JWTService } from './jwt.service';
import { EmailVerification } from './interfaces/emailverification.interface';
import config from 'src/config';
import * as nodemailer from 'nodemailer';
import { ForgottenPassword } from './interfaces/forgottenpassword.interface';



@Injectable()
export class AuthService {
    constructor(@InjectModel('User') private readonly userModel: Model<User>, 
    @InjectModel('EmailVerification') private readonly emailVerificationModel: Model<EmailVerification>,
    @InjectModel('ForgottenPassword') private readonly forgottenPasswordModel: Model<ForgottenPassword>,
    private readonly jwtService: JWTService,

    ){}



    async validateLogin(email, password) {
        const userFromDb = await this.userModel.findOne({ email: email});
        if(!userFromDb) throw new HttpException('LOGIN.USER_NOT_FOUND', HttpStatus.NOT_FOUND);
        if(!userFromDb.isVerifiedEmail) throw new HttpException('LOGIN.EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN);
    
        const isValidPass = await bcrypt.compare(password, userFromDb.password);
    
        if(isValidPass){
            const accessToken = await this.jwtService.createToken(email);
          return { token: accessToken, user: new UserDto(userFromDb)}
        } else {
          throw new HttpException('LOGIN.ERROR', HttpStatus.UNAUTHORIZED);
        }
    
    }


    async createOtpToken(email: string): Promise<boolean> {
        const emailVerification = await this.emailVerificationModel.findOne({email: email}); 
        if (emailVerification && ( (new Date().getTime() - emailVerification.timestamp.getTime()) / 60000 < 15 )){
          throw new HttpException('LOGIN.EMAIL_SENT_RECENTLY', HttpStatus.INTERNAL_SERVER_ERROR);
        } else {
          await this.emailVerificationModel.findOneAndUpdate( 
            {email: email},
            { 
              email: email,
              otpToken: (Math.floor(Math.random() * (9000000)) + 1000000).toString(), //Generate 7 digits number
              timestamp: new Date()
            },
            {upsert: true}
          );
          return true;
        }
    }



    async verifyEmail(token: string): Promise<boolean> {
      const emailVerif = await this.emailVerificationModel.findOne({ otpToken: token});
      console.log(emailVerif)
      if(emailVerif && emailVerif.email){
        const userFromDb = await this.userModel.findOne({ email: emailVerif.email});
        console.log(userFromDb)
        if (userFromDb) {
          userFromDb.isVerifiedEmail = true;
          const savedUser = await userFromDb.save();
          console.log(savedUser)
          return !!savedUser;
        }
      } else {
        throw new HttpException('LOGIN.EMAIL_CODE_NOT_VALID', HttpStatus.FORBIDDEN);
      }
    }


    async sendEmailVerification(email: string): Promise<boolean> {   
      const model = await this.emailVerificationModel.findOne({ email: email});
  
      if(model && model.otpToken){

          const transporter = nodemailer.createTransport({
            host: config.mail.host,
            port: config.mail.port,
            secure: config.mail.secure,
            auth: {
              user: config.mail.auth.user,
              pass: config.mail.auth.pass,
            }
          });

          
      
          const mailOptions = {
            from: '"godancomms@gmail.com" <' + config.mail.auth.user + '>', 
            to: email, // list of receivers (separated by ,)
            subject: 'Verify Email', 
            text: 'Verify Email', 
            html: 'Hi! <br><br> Welcome to GODAN! <br><br>'+
            '<a href='+ config.host.url + ':' + config.host.port +'/auth/email/verify/'+ model.otpToken + '>Click here to activate your account</a>'  // html body
          };
      
          const sent = await new Promise<boolean>(async function(resolve, reject) {
            return await transporter.sendMail(mailOptions, async (error, info) => {
                if (error) {      
                  console.log('Message sent: %s', error);
                  return reject(false);
                }
                console.log('Message sent: %s', info.messageId);
                resolve(true);
            });      
          })
  
          return sent;
      } else {
        throw new HttpException('REGISTER.USER_NOT_REGISTERED', HttpStatus.FORBIDDEN);
      }
  }
    

    async updateOtpToken(token: string): Promise<void> {
      await this.emailVerificationModel.findOneAndUpdate(
        { otpToken: token }, // Find the document with the matching emailToken
        { $set: { otpToken: 'Washed-Up!' } }, // Update the emailToken field to 'used'
        { new: true })
    }


    async createForgottenPasswordToken(email: string): Promise<ForgottenPassword> {
      const forgottenPassword= await this.forgottenPasswordModel.findOne({email: email});
      if (forgottenPassword && ( (new Date().getTime() - forgottenPassword.timestamp.getTime()) / 60000 < 15 )){
        throw new HttpException('RESET_PASSWORD.EMAIL_SENT_RECENTLY', HttpStatus.INTERNAL_SERVER_ERROR);
      } else {
        const forgottenPasswordModel = await this.forgottenPasswordModel.findOneAndUpdate(
          {email: email},
          { 
            email: email,
            newPasswordToken: (Math.floor(Math.random() * (9000000)) + 1000000).toString(), //Generate 7 digits number,
            timestamp: new Date()
          },
          {upsert: true, new: true}
        );
        if(forgottenPasswordModel){
          return forgottenPasswordModel;
        } else {
          throw new HttpException('LOGIN.ERROR.GENERIC_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
    }


  async sendEmailForgotPassword(email: string): Promise<boolean> {
    const userFromDb = await this.userModel.findOne({ email: email});
    if(!userFromDb) throw new HttpException('LOGIN.USER_NOT_FOUND', HttpStatus.NOT_FOUND);

    const tokenModel = await this.createForgottenPasswordToken(email);

    if(tokenModel && tokenModel.newPasswordToken){
        const transporter = nodemailer.createTransport({
            host: config.mail.host,
            port: config.mail.port,
            secure: config.mail.secure, // true for 465, false for other ports
            auth: {
                user: config.mail.auth.user,
                pass: config.mail.auth.pass
            }
        });
    
        const mailOptions = {
          from: '"shambaassistant" <' + config.mail.auth.user + '>', 
          to: email, // list of receivers (separated by ,)
          subject: 'Frogotten Password', 
          text: 'Forgot Password',
          html: `Hi! <br><br> If you requested for a password reset<br><br>` +
            `<a href="${config.host.url}:${config.host.port}/auth/email/reset-password/${tokenModel.newPasswordToken}">Click here</a>`// html body
        };
    
        const sent = await new Promise<boolean>(async function(resolve, reject) {
          return await transporter.sendMail(mailOptions, async (error, info) => {
              if (error) {      
                console.log('Message sent: %s', error);
                return reject(false);
              }
              console.log('Message sent: %s', info.messageId);
              resolve(true);
          });      
        })

        return sent;
    } else {
      throw new HttpException('REGISTER.USER_NOT_REGISTERED', HttpStatus.FORBIDDEN);
    }
  }
  
}
