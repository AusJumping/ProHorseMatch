import { MailService } from '@sendgrid/mail';
import crypto from 'crypto';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

// Generate a secure verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create verification token expiry (24 hours from now)
export function getVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

interface SendVerificationEmailParams {
  to: string;
  name: string;
  verificationToken: string;
  baseUrl: string;
}

export async function sendVerificationEmail(params: SendVerificationEmailParams): Promise<boolean> {
  const { to, name, verificationToken, baseUrl } = params;
  
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  
  // Professional email template with Cloudinary-hosted assets
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your ProHorseMatch Account</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header with logo -->
        <div style="background: linear-gradient(135deg, #cdac6e 0%, #b8945a 100%); padding: 40px 20px; text-align: center;">
          <img src="https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/prohorsematch/logo" 
               alt="ProHorseMatch" 
               style="height: 60px; width: auto; margin-bottom: 20px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to ProHorseMatch!</h1>
        </div>
        
        <!-- Main content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 24px;">Hello ${name}!</h2>
          
          <p style="color: #5a6c7d; line-height: 1.6; font-size: 16px; margin-bottom: 25px;">
            Thank you for joining ProHorseMatch, the premier platform connecting performance horses with their perfect owners. 
            To complete your registration and start exploring our exclusive equestrian marketplace, please verify your email address.
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #cdac6e 0%, #b8945a 100%); 
                      color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; 
                      font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(205, 172, 110, 0.3);">
              Verify My Email Address
            </a>
          </div>
          
          <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br><a href="${verificationUrl}" style="color: #cdac6e; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
            This verification link will expire in 24 hours for security purposes.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #2c3e50; padding: 30px; text-align: center;">
          <p style="color: #bdc3c7; margin: 0; font-size: 14px;">
            © ${new Date().getFullYear()} ProHorseMatch. All rights reserved.
          </p>
          <p style="color: #95a5a6; margin: 10px 0 0 0; font-size: 12px;">
            If you didn't create an account with ProHorseMatch, please ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Welcome to ProHorseMatch!
    
    Hello ${name},
    
    Thank you for joining ProHorseMatch, the premier platform connecting performance horses with their perfect owners.
    
    To complete your registration, please verify your email address by clicking this link:
    ${verificationUrl}
    
    This verification link will expire in 24 hours for security purposes.
    
    If you didn't create an account with ProHorseMatch, please ignore this email.
    
    © ${new Date().getFullYear()} ProHorseMatch. All rights reserved.
  `;

  try {
    await mailService.send({
      to,
      from: {
        email: 'noreply@prohorsematch.com',
        name: 'ProHorseMatch'
      },
      subject: 'Verify Your ProHorseMatch Account',
      text: textContent,
      html: htmlContent,
    });
    
    console.log(`Verification email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

interface SendWelcomeEmailParams {
  to: string;
  name: string;
}

export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<boolean> {
  const { to, name } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ProHorseMatch!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #cdac6e 0%, #b8945a 100%); padding: 40px 20px; text-align: center;">
          <img src="https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1/prohorsematch/logo" 
               alt="ProHorseMatch" 
               style="height: 60px; width: auto; margin-bottom: 20px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Account Verified!</h1>
        </div>
        
        <!-- Main content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 24px;">Welcome aboard, ${name}!</h2>
          
          <p style="color: #5a6c7d; line-height: 1.6; font-size: 16px; margin-bottom: 25px;">
            Your email has been successfully verified! You now have full access to ProHorseMatch, where you can:
          </p>
          
          <ul style="color: #5a6c7d; line-height: 1.8; font-size: 16px; margin-bottom: 30px;">
            <li>Browse premium performance horses from trusted sellers</li>
            <li>Connect directly with horse owners through our messaging system</li>
            <li>Save your favorite horses and create watchlists</li>
            <li>List your own horses if you're a seller</li>
          </ul>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://prohorsematch.com" 
               style="display: inline-block; background: linear-gradient(135deg, #cdac6e 0%, #b8945a 100%); 
                      color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; 
                      font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(205, 172, 110, 0.3);">
              Start Exploring Horses
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #2c3e50; padding: 30px; text-align: center;">
          <p style="color: #bdc3c7; margin: 0; font-size: 14px;">
            © ${new Date().getFullYear()} ProHorseMatch. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await mailService.send({
      to,
      from: {
        email: 'noreply@prohorsematch.com',
        name: 'ProHorseMatch'
      },
      subject: 'Welcome to ProHorseMatch - Account Verified!',
      html: htmlContent,
    });
    
    console.log(`Welcome email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('SendGrid welcome email error:', error);
    return false;
  }
}