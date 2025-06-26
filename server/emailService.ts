import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable must be set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailVerificationParams {
  to: string;
  username: string;
  verificationToken: string;
  baseUrl: string;
}

export async function sendVerificationEmail(params: EmailVerificationParams): Promise<boolean> {
  console.log('=== EMAIL VERIFICATION START ===');
  console.log('Email service called with params:', {
    to: params.to,
    username: params.username,
    baseUrl: params.baseUrl,
    tokenLength: params.verificationToken?.length || 0
  });

  const verificationUrl = `${params.baseUrl}/verify-email?token=${params.verificationToken}`;
  console.log('Verification URL generated:', verificationUrl);
  
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Arial', sans-serif; color: #333;">
      <div style="background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ProHorseMatch</h1>
        <p style="color: #F5E6D3; margin: 10px 0 0 0; font-size: 16px;">Connecting riders with their perfect horse</p>
      </div>
      
      <div style="background: white; padding: 40px 30px; border-left: 4px solid #D2691E;">
        <h2 style="color: #8B4513; margin-top: 0;">Verify Your Email Address</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hi ${params.username},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
          Thank you for joining ProHorseMatch! To complete your registration and start discovering amazing horses, please verify your email address by clicking the button below.
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${verificationUrl}" 
             style="background: #D2691E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="font-size: 14px; color: #D2691E; word-break: break-all;">
          ${verificationUrl}
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 14px; color: #888; margin: 0;">
            This verification link will expire in 24 hours. If you didn't create an account with ProHorseMatch, please ignore this email.
          </p>
        </div>
      </div>
      
      <div style="background: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #888; margin: 0;">
          © 2025 ProHorseMatch. Connecting equestrian professionals worldwide.
        </p>
      </div>
    </div>
  `;

  const textContent = `
Welcome to ProHorseMatch!

Hi ${params.username},

Thank you for joining ProHorseMatch! To complete your registration and start discovering amazing horses, please verify your email address by visiting this link:

${verificationUrl}

This verification link will expire in 24 hours. If you didn't create an account with ProHorseMatch, please ignore this email.

© 2025 ProHorseMatch. Connecting equestrian professionals worldwide.
  `;

  try {
    console.log('Attempting to send email via Resend...');
    console.log('From: ProHorseMatch <noreply@prohorsematch.com>');
    console.log('To:', params.to);
    console.log('Subject: Verify your ProHorseMatch account');
    
    const { data, error } = await resend.emails.send({
      from: 'ProHorseMatch <noreply@prohorsematch.com>',
      to: [params.to],
      subject: 'Verify your ProHorseMatch account',
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('=== RESEND EMAIL ERROR ===');
      console.error('Error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', Object.keys(error));
      return false;
    }

    console.log('=== EMAIL SENT SUCCESSFULLY ===');
    console.log('Resend response data:', data);
    console.log('Email ID:', data?.id);
    return true;
  } catch (error) {
    console.error('=== EMAIL SEND EXCEPTION ===');
    console.error('Exception details:', error);
    console.error('Exception type:', typeof error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

export async function sendWelcomeEmail(to: string, username: string): Promise<boolean> {
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Arial', sans-serif; color: #333;">
      <div style="background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ProHorseMatch!</h1>
        <p style="color: #F5E6D3; margin: 10px 0 0 0; font-size: 16px;">Your account is now verified</p>
      </div>
      
      <div style="background: white; padding: 40px 30px; border-left: 4px solid #D2691E;">
        <h2 style="color: #8B4513; margin-top: 0;">You're All Set!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hi ${username},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
          Congratulations! Your email has been verified and your ProHorseMatch account is now active. You can now:
        </p>
        
        <ul style="font-size: 16px; line-height: 1.8; margin-bottom: 25px; padding-left: 20px;">
          <li>Browse our exclusive collection of performance horses</li>
          <li>Use advanced filters to find your perfect match</li>
          <li>Save horses to your favorites</li>
          <li>Connect directly with horse owners</li>
          <li>List your own horses for sale (if you're a seller)</li>
        </ul>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${process.env.CLIENT_URL || 'https://prohorsematch.com'}" 
             style="background: #D2691E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
            Start Browsing Horses
          </a>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Happy horse hunting!
        </p>
      </div>
      
      <div style="background: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #888; margin: 0;">
          © 2025 ProHorseMatch. Connecting equestrian professionals worldwide.
        </p>
      </div>
    </div>
  `;

  const textContent = `
Welcome to ProHorseMatch!

Hi ${username},

Congratulations! Your email has been verified and your ProHorseMatch account is now active. You can now:

- Browse our exclusive collection of performance horses
- Use advanced filters to find your perfect match  
- Save horses to your favorites
- Connect directly with horse owners
- List your own horses for sale (if you're a seller)

Visit: ${process.env.CLIENT_URL || 'https://prohorsematch.com'}

Happy horse hunting!

© 2025 ProHorseMatch. Connecting equestrian professionals worldwide.
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'ProHorseMatch <noreply@prohorsematch.com>',
      to: [to],
      subject: 'Welcome to ProHorseMatch - Account Verified!',
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('Resend welcome email error:', error);
      return false;
    }

    console.log('Welcome email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Resend welcome email error:', error);
    return false;
  }
}