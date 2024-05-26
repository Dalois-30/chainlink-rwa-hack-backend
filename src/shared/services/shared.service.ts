import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as OtpGenerator from 'otp-generator';
import { Request as RequestExpress, Response } from 'express';
import { transporter } from 'src/auth/constant/email-constants';
import { UsersService } from 'src/features/users/services/users.service';

@Injectable()
export class SharedService {

    constructor(
        private usersService: UsersService,
      ) { 
        // const mailOptions = {
        //   from: 'claudenguenang@gmail.com',
        //   to: "claudenguenang@gmail.com",
        //   subject: 'Verify Email',
        //   text: 'Verify your Email',
        //   html: `Hi! <br><br> Thanks for your registration<br><br>
        //    <p>This is your verification code <a href=#> '1111' </a></p>`,
        // };
  
        // this.sendEmail(mailOptions);
      }


  /**
   * create email token
   * @param email 
   * @returns 
   */
  async createEmailToken(email: string, res: Response) {

    const otp = OtpGenerator.generate(10, {
      lowerCaseAlphabets: true,
      upperCaseAlphabets: true,
      specialChars: true,
    });

    res.cookie('OTP', otp, {
      maxAge: 5 * 60 * 1000,
      httpOnly: false,
      secure: false,
    });
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }
      const mailOptions = {
        from: 'claudenguenang@gmail.com',
        to: email,
        subject: 'Verify Email',
        text: 'Verify your Email',
        html: `Hi! <br><br> Thanks for your registration<br><br>
         <p>This is your verification code <a href=#> '${otp}' </a></p>`,
      };

      return await this.sendEmail(mailOptions);   
  }



  async sendEmail(mailOptions) {
    return await new Promise<{}>(async (resolve, reject) => {
      return await transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          Logger.log(
            `Error while sending message: ${error}`,
            'sendEmailVerification',
          );
          return reject(error);
        }
        Logger.log(`Send message: ${info.messageId}`, 'sendEmailVerification');
        resolve({ message: 'Successfully send email' });
      });
    });
  }
}
