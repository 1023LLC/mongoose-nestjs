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
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('EmailVerification')
    private readonly emailVerificationModel: Model<EmailVerification>,
    @InjectModel('ForgottenPassword')
    private readonly forgottenPasswordModel: Model<ForgottenPassword>,
    private configService: ConfigService,
    private readonly jwtService: JWTService,
  ) {}

  async validateLogin(email, password) {
    const userFromDb = await this.userModel.findOne({ email: email });
    // console.log(userFromDb);
    if (!userFromDb)
      throw new HttpException('LOGIN.USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    if (!userFromDb.isVerifiedEmail)
      throw new HttpException('LOGIN.EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN);

    const isValidPass = await bcrypt.compare(password, userFromDb.password);

    if (isValidPass) {
      const accessToken = await this.jwtService.createToken(email);
      return { token: accessToken, user: new UserDto(userFromDb) };
    } else {
      throw new HttpException('LOGIN.ERROR', HttpStatus.UNAUTHORIZED);
    }
  }

  async createOtpToken(email: string): Promise<boolean> {
    const emailVerification = await this.emailVerificationModel.findOne({
      email: email,
    });
    if (
      emailVerification &&
      (new Date().getTime() - emailVerification.timestamp.getTime()) / 60000 <
        15
    ) {
      throw new HttpException(
        'LOGIN.EMAIL_SENT_RECENTLY',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else {
      await this.emailVerificationModel.findOneAndUpdate(
        { email: email },
        {
          email: email,
          otpToken: (Math.floor(Math.random() * 9000000) + 1000000).toString(), //Generate 7 digits number
          timestamp: new Date(),
        },
        { upsert: true },
      );
      return true;
    }
  }

  async verifyEmail(token: string): Promise<boolean> {
    try {
      const emailVerif = await this.emailVerificationModel.findOne({
        otpToken: token,
      });

      if (emailVerif && emailVerif.email) {
        try {
          const userFromDb = await this.userModel.findOne({
            email: emailVerif.email,
          });

          if (userFromDb) {
            try {
              userFromDb.isVerifiedEmail = true;
              const savedUser = await userFromDb.save();
              return !!savedUser;
            } catch (saveError) {
              // console.error('Error saving user:', saveError);
              throw new HttpException(
                'Failed to save user.',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }
          }
        } catch (userFetchError) {
          // console.error('Error fetching user:', userFetchError);
          throw new HttpException(
            'Failed to fetch user.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        throw new HttpException(
          'LOGIN.EMAIL_CODE_NOT_VALID',
          HttpStatus.FORBIDDEN,
        );
      }
    } catch (emailVerifError) {
      // console.error('Error verifying email token:', emailVerifError);
      throw new HttpException(
        'Failed to verify email token.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendEmailVerification(email: string): Promise<boolean> {
    const model = await this.emailVerificationModel.findOne({ email: email });
    console.log(this.configService.get('MAIL_USER'));
    if (model && model.otpToken) {
      const transporter = nodemailer.createTransport({
        host: config.mail.host,
        port: config.mail.port,
        secure: config.mail.secure,
        auth: {
          user: config.mail.auth.user,
          pass: config.mail.auth.pass,
        },
      });

      const mailOptions = {
        from: '"godancomms@gmail.com" <' + config.mail.auth.user + '>',
        to: email,
        subject: 'Verify Email',
        text: 'Verify Email',
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                font-family: Arial, sans-serif;
                border: 1px solid #dddddd;
                border-radius: 10px;
              }
              .header {
                text-align: center;
                background-color: #08c40b;
                padding: 10px;
                border-bottom: 1px solid #dddddd;
              }
              .content {
                margin: 20px 0;
                text-align: center;
              }
              .btn {
                display: inline-block;
                padding: 10px 20px;
                font-size: 16px;
                color: white;
                background-color: #08c40b;
                border: none;
                border-radius: 5px;
                text-decoration: none;
              }
              .footer {
                text-align: center;
                font-size: 12px;
                color: #888888;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img
                  src="https://imgur.com/a/FRkxAOy"
                  alt="GODAN Logo"
                  width="100"
                  height="auto"
                />
                <h2>Welcome to GODAN!</h2>
              </div>
              <div class="content">
                <p>Hi there!</p>
                <p>
                  Thank you for registering with us. Please verify your email address to
                  complete your registration.
                </p>
                <a
                  href="https://shambahassistant/verify?token=${model.otpToken}"
                  class="btn"
                  >Verify Email</a
                >
              </div>
              <div style="cursor:auto;color:#99AAB5;font-family:Whitney, Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif;font-size:12px;line-height:24px;text-align:center;">
                Basement Floor, Food Science, Nutrition and Technology, University of Nairobi 
                <br>PO Box 35046, 00200 City Square, Nairobi-Kenya
              </div>
            </div>
          </body>
        </html>
        `,
      };

      const sent = await new Promise<boolean>(async function (resolve, reject) {
        return await transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            console.log('Message sent: %s', error);
            return reject(false);
          }
          console.log('Message sent: %s', info.messageId);
          resolve(true);
        });
      });

      return sent;
    } else {
      throw new HttpException(
        'REGISTER.USER_NOT_REGISTERED',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async updateOtpToken(token: string): Promise<void> {
    await this.emailVerificationModel.findOneAndUpdate(
      { otpToken: token }, // Find the document with the matching emailToken
      { $set: { otpToken: 'Washed-Up!' } }, // Update the emailToken field to 'used'
      { new: true },
    );
  }

  // async deletePasswordToken(token: string): Promise<void> {
  //   await this.forgottenPasswordModel.deleteOne(
  //     { newPasswordToken: resetPassword.newPasswordToken })
  // }

  async createForgottenPasswordToken(
    email: string,
  ): Promise<ForgottenPassword> {
    const forgottenPassword = await this.forgottenPasswordModel.findOne({
      email: email,
    });
    if (
      forgottenPassword &&
      (new Date().getTime() - forgottenPassword.timestamp.getTime()) / 60000 <
        15
    ) {
      throw new HttpException(
        'RESET_PASSWORD.EMAIL_SENT_RECENTLY',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else {
      const forgottenPasswordModel =
        await this.forgottenPasswordModel.findOneAndUpdate(
          { email: email },
          {
            email: email,
            newPasswordToken: (
              Math.floor(Math.random() * 9000000) + 1000000
            ).toString(), //Generate 7 digits number,
            timestamp: new Date(),
          },
          { upsert: true, new: true },
        );
      if (forgottenPasswordModel) {
        return forgottenPasswordModel;
      } else {
        throw new HttpException(
          'LOGIN.ERROR.GENERIC_ERROR',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async sendEmailForgotPassword(email: string): Promise<boolean> {
    const userFromDb = await this.userModel.findOne({ email: email });
    if (!userFromDb)
      throw new HttpException('LOGIN.USER_NOT_FOUND', HttpStatus.NOT_FOUND);

    const tokenModel = await this.createForgottenPasswordToken(email);

    if (tokenModel && tokenModel.newPasswordToken) {
      const transporter = nodemailer.createTransport({
        host: config.mail.host,
        port: config.mail.port,
        secure: config.mail.secure, // true for 465, false for other ports
        auth: {
          user: config.mail.auth.user,
          pass: config.mail.auth.pass,
        },
      });

      const mailOptions = {
        from: '"godancomms@gmail.com" <' + config.mail.auth.user + '>',
        to: email, // list of receivers (separated by ,)
        subject: 'Frogotten Password',
        text: 'Forgot Password',
        html:
          `Hi! <br><br> We received a request to reset your password, <br><br>` +
          `<a href="${config.host.url}:${config.host.port}/auth/account/reset-password/${tokenModel.newPasswordToken}">Click here</a>`, // html body
      };

      const sent = await new Promise<boolean>(async function (resolve, reject) {
        return await transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            console.log('Message sent: %s', error);
            return reject(false);
          }
          console.log('Message sent: %s', info.messageId);
          resolve(true);
        });
      });

      return sent;
    } else {
      throw new HttpException(
        'REGISTER.USER_NOT_REGISTERED',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async checkPassword(email: string, password: string) {
    const userFromDb = await this.userModel.findOne({ email: email });
    if (!userFromDb)
      throw new HttpException('LOGIN.USER_NOT_FOUND', HttpStatus.NOT_FOUND);

    return await bcrypt.compare(password, userFromDb.password);
  }

  async getForgottenPasswordModel(
    newPasswordToken: string,
  ): Promise<ForgottenPassword> {
    try {
      return await this.forgottenPasswordModel.findOne({
        newPasswordToken: newPasswordToken,
      });
    } catch (error) {
      throw error;
    }
  }
}
