import { MailService } from '@sendgrid/mail';
import crypto from 'crypto';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = 'info@australianjumping.com.au';
const APP_NAME = 'ProHorseMatch';

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  userName?: string
): Promise<boolean> {
  try {
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    
    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: APP_NAME
      },
      subject: `Welcome to ${APP_NAME} - Please verify your email`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #cdac6e 0%, #b8964f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Welcome to the premier horse marketplace</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome${userName ? `, ${userName}` : ''}!</h2>
            
            <p>Thank you for joining ${APP_NAME}! To complete your registration and start discovering amazing horses, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #cdac6e 0%, #b8964f 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 14px;">
              ${verificationUrl}
            </p>
            
            <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                This verification link will expire in 24 hours for security reasons.<br>
                If you didn't create an account with ${APP_NAME}, please ignore this email.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>&copy; 2025 ${APP_NAME}. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to ${APP_NAME}!

${userName ? `Hi ${userName},` : 'Hello,'}

Thank you for joining ${APP_NAME}! To complete your registration and start discovering amazing horses, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours for security reasons.

If you didn't create an account with ${APP_NAME}, please ignore this email.

Best regards,
The ${APP_NAME} Team
      `.trim()
    };

    await mailService.send(msg);
    console.log(`Verification email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendWelcomeEmail(
  email: string,
  userName?: string
): Promise<boolean> {
  try {
    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: APP_NAME
      },
      subject: `Welcome to ${APP_NAME} - Your account is ready!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${APP_NAME}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #cdac6e 0%, #b8964f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your equestrian journey begins now</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to the community${userName ? `, ${userName}` : ''}!</h2>
            
            <p>Your email has been verified and your account is now active! You can now access all the features of ${APP_NAME}:</p>
            
            <ul style="margin: 20px 0; padding-left: 20px;">
              <li>Browse premium horses from verified sellers</li>
              <li>Save your favorite horses</li>
              <li>Connect directly with horse owners</li>
              <li>Access detailed horse profiles and photos</li>
              <li>Filter by discipline, level, location, and more</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.BASE_URL || 'http://localhost:5000'}/browse" 
                 style="background: linear-gradient(135deg, #cdac6e 0%, #b8964f 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                Start Browsing Horses
              </a>
            </div>
            
            <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                Need help getting started? Contact us at ${FROM_EMAIL}
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>&copy; 2025 ${APP_NAME}. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to ${APP_NAME}!

${userName ? `Hi ${userName},` : 'Hello,'}

Your email has been verified and your account is now active! You can now access all the features of ${APP_NAME}:

• Browse premium horses from verified sellers
• Save your favorite horses  
• Connect directly with horse owners
• Access detailed horse profiles and photos
• Filter by discipline, level, location, and more

Start browsing horses: ${process.env.BASE_URL || 'http://localhost:5000'}/browse

Need help getting started? Contact us at ${FROM_EMAIL}

Best regards,
The ${APP_NAME} Team
      `.trim()
    };

    await mailService.send(msg);
    console.log(`Welcome email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('SendGrid welcome email error:', error);
    return false;
  }
}