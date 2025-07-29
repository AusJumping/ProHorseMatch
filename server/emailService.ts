import { MailService } from '@sendgrid/mail';

// Support both SendGrid and Resend
let mailService: MailService | null = null;
let resend: any = null;

async function initializeEmailService() {
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('Email service initialized with Resend');
  } else if (process.env.SENDGRID_API_KEY) {
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('Email service initialized with SendGrid');
  } else {
    console.warn('No email service configured - emails will not be sent');
  }
}

// Initialize the service
initializeEmailService();

interface EmailVerificationParams {
  to: string;
  username: string;
  verificationToken: string;
  baseUrl: string;
}

interface PasswordResetParams {
  to: string;
  username: string;
  resetToken: string;
  baseUrl: string;
}

interface MessageNotificationParams {
  to: string;
  recipientName: string;
  senderName: string;
  horseName: string;
  messageContent: string;
  conversationUrl: string;
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
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', 'Arial', sans-serif; color: #2D2A25;">
      <div style="background: #2b2b2b; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Welcome to ProHorseMatch</h1>
        <p style="color: #F5E6D3; margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Connecting equestrian professionals worldwide</p>
      </div>
      
      <div style="background: #FEFCF7; padding: 40px 30px; border-left: 4px solid #CDAC6E; border-right: 1px solid #E8E3D3; border-bottom: 1px solid #E8E3D3;">
        <h2 style="color: #2D2A25; margin-top: 0; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 20px; color: #2D2A25;">
          Hi <strong>${params.username}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 30px; color: #4A453E;">
          Thank you for joining ProHorseMatch! To complete your registration and start discovering amazing horses, please verify your email address by clicking the button below.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${verificationUrl}" 
             style="background: linear-gradient(135deg, #6B5B3D 0%, #CDAC6E 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(107, 91, 61, 0.3); transition: transform 0.2s;">
            Verify Email Address
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6B5B3D; margin-top: 35px; margin-bottom: 8px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="font-size: 14px; color: #CDAC6E; word-break: break-all; background: #F8F6F0; padding: 12px; border-radius: 4px; border-left: 3px solid #CDAC6E;">
          ${verificationUrl}
        </p>
        
        <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #E8E3D3;">
          <p style="font-size: 14px; color: #6B5B3D; margin: 0; line-height: 1.5;">
            This verification link will expire in 24 hours. If you didn't create an account with ProHorseMatch, please ignore this email.
          </p>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #F8F6F0 0%, #E8E3D3 100%); padding: 25px 30px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="font-size: 13px; color: #6B5B3D; margin: 0; font-weight: 500;">
          © 2025 ProHorseMatch • Connecting equestrian professionals worldwide
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
    console.log('Attempting to send verification email...');
    console.log('Sending to:', params.to);
    
    if (mailService) {
      // Use SendGrid
      console.log('Sending via SendGrid...');
      await mailService.send({
        from: 'noreply@prohorsematch.com',
        to: params.to,
        subject: 'Verify Your ProHorseMatch Account',
        html: htmlContent,
        text: textContent,
      });
    } else if (resend) {
      // Use Resend
      console.log('Sending via Resend...');
      const { data, error } = await resend.emails.send({
        from: 'ProHorseMatch <noreply@prohorsematch.com>',
        to: [params.to],
        subject: 'Verify your ProHorseMatch account',
        html: htmlContent,
        text: textContent,
      });
      
      if (error) {
        console.error('Resend email error:', error);
        return false;
      }
      console.log('Resend response:', data);
    } else {
      console.warn('No email service configured - verification email not sent');
      return false;
    }
    
    console.log('Verification email sent successfully');
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, username: string): Promise<boolean> {
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', 'Arial', sans-serif; color: #2D2A25;">
      <div style="background: #2b2b2b; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Welcome to ProHorseMatch!</h1>
        <p style="color: #F5E6D3; margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Your account is now verified and ready</p>
      </div>
      
      <div style="background: #FEFCF7; padding: 40px 30px; border-left: 4px solid #CDAC6E; border-right: 1px solid #E8E3D3; border-bottom: 1px solid #E8E3D3;">
        <h2 style="color: #2D2A25; margin-top: 0; font-size: 24px; font-weight: 600;">You're All Set!</h2>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 20px; color: #2D2A25;">
          Hi <strong>${username}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 25px; color: #4A453E;">
          Congratulations! Your email has been verified and your ProHorseMatch account is now active. You can now:
        </p>
        
        <ul style="font-size: 16px; line-height: 1.8; margin-bottom: 30px; padding-left: 25px; color: #4A453E;">
          <li style="margin-bottom: 8px;">Browse our exclusive collection of performance horses</li>
          <li style="margin-bottom: 8px;">Use advanced filters to find your perfect match</li>
          <li style="margin-bottom: 8px;">Save horses to your favorites</li>
          <li style="margin-bottom: 8px;">Connect directly with horse owners</li>
          <li style="margin-bottom: 8px;">List your own horses for sale (if you're a seller)</li>
        </ul>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.CLIENT_URL || 'https://prohorsematch.com'}" 
             style="background: linear-gradient(135deg, #6B5B3D 0%, #CDAC6E 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(107, 91, 61, 0.3); transition: transform 0.2s;">
            Start Browsing Horses
          </a>
        </div>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 20px; color: #2D2A25; text-align: center; font-weight: 500;">
          Happy horse hunting!
        </p>
      </div>
      
      <div style="background: linear-gradient(135deg, #F8F6F0 0%, #E8E3D3 100%); padding: 25px 30px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="font-size: 13px; color: #6B5B3D; margin: 0; font-weight: 500;">
          © 2025 ProHorseMatch • Connecting equestrian professionals worldwide
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

export async function sendPasswordResetEmail(params: PasswordResetParams): Promise<boolean> {
  console.log('=== PASSWORD RESET EMAIL START ===');
  console.log('Password reset email service called with params:', {
    to: params.to,
    username: params.username,
    baseUrl: params.baseUrl,
    tokenLength: params.resetToken?.length || 0
  });

  const resetUrl = `${params.baseUrl}/auth?token=${params.resetToken}`;
  console.log('Password reset URL generated:', resetUrl);
  
  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', 'Arial', sans-serif; color: #2D2A25;">
      <div style="background: #2b2b2b; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">ProHorseMatch</h1>
        <p style="color: #F5E6D3; margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Password Reset Request</p>
      </div>
      
      <div style="background: #FEFCF7; padding: 40px 30px; border-left: 4px solid #CDAC6E; border-right: 1px solid #E8E3D3; border-bottom: 1px solid #E8E3D3;">
        <h2 style="color: #2D2A25; margin-top: 0; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 20px; color: #2D2A25;">
          Hi <strong>${params.username}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 30px; color: #4A453E;">
          We received a request to reset your ProHorseMatch account password. Click the button below to create a new password. This link will expire in 1 hour for security.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #6B5B3D 0%, #CDAC6E 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(107, 91, 61, 0.3); transition: transform 0.2s;">
            Reset Password
          </a>
        </div>
        
        <div style="background: #FFF3E0; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #FF9800;">
          <h3 style="color: #E65100; margin-top: 0; font-size: 16px; font-weight: 600;">⚠️ Important Security Notice</h3>
          <p style="color: #4A453E; margin: 10px 0 0 0; line-height: 1.6; font-size: 14px;">
            If you didn't request this password reset, please ignore this email. Your account remains secure and no changes have been made.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #8B7355; line-height: 1.6; margin-bottom: 0;">
          This reset link will expire in 1 hour. If you need assistance, please contact our support team.
        </p>
      </div>
      
      <div style="background: #2D2A25; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="color: #CDAC6E; margin: 0; font-size: 14px; font-weight: 500;">
          Stay secure,<br>
          The ProHorseMatch Team
        </p>
      </div>
    </div>
  `;

  const textContent = `
ProHorseMatch - Password Reset

Hi ${params.username},

We received a request to reset your ProHorseMatch account password.

Reset your password: ${resetUrl}

This link will expire in 1 hour for security.

Important: If you didn't request this password reset, please ignore this email. Your account remains secure and no changes have been made.

Stay secure,
The ProHorseMatch Team

© 2025 ProHorseMatch. Connecting equestrian professionals worldwide.
  `;

  try {
    console.log('Sending password reset email via Resend...');
    
    const { data, error } = await resend.emails.send({
      from: 'ProHorseMatch <noreply@prohorsematch.com>',
      to: [params.to],
      subject: 'Reset Your ProHorseMatch Password',
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('Password reset email send error:', error);
      return false;
    }

    console.log('Password reset email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Password reset email send exception:', error);
    return false;
  }
}

export async function sendMessageNotificationEmail(params: MessageNotificationParams): Promise<boolean> {
  console.log('=== MESSAGE NOTIFICATION EMAIL START ===');
  console.log('Message notification email service called with params:', {
    to: params.to,
    recipientName: params.recipientName,
    senderName: params.senderName,
    horseName: params.horseName,
    messageLength: params.messageContent?.length || 0
  });

  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', 'Arial', sans-serif; color: #2D2A25;">
      <div style="background: #2b2b2b; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">ProHorseMatch</h1>
        <p style="color: #F5E6D3; margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">New Message Received</p>
      </div>
      
      <div style="background: #FEFCF7; padding: 40px 30px; border-left: 4px solid #CDAC6E; border-right: 1px solid #E8E3D3; border-bottom: 1px solid #E8E3D3;">
        <h2 style="color: #2D2A25; margin-top: 0; font-size: 24px; font-weight: 600;">You Have a New Message!</h2>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 20px; color: #2D2A25;">
          Hi <strong>${params.recipientName}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 25px; color: #4A453E;">
          <strong>${params.senderName}</strong> sent you a message about <strong>${params.horseName}</strong>:
        </p>
        
        <div style="background: #F8F6F0; border-left: 4px solid #CDAC6E; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <p style="font-size: 16px; line-height: 1.6; margin: 0; color: #2D2A25; font-style: italic;">
            "${params.messageContent}"
          </p>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${params.conversationUrl}" 
             style="background: linear-gradient(135deg, #6B5B3D 0%, #CDAC6E 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(107, 91, 61, 0.3); transition: transform 0.2s;">
            Reply to Message
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6B5B3D; margin-top: 35px; margin-bottom: 8px;">
          Stay connected and don't miss important conversations about your horse interests.
        </p>
      </div>
      
      <div style="background: linear-gradient(135deg, #F8F6F0 0%, #E8E3D3 100%); padding: 25px 30px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="font-size: 13px; color: #6B5B3D; margin: 0; font-weight: 500;">
          © 2025 ProHorseMatch • Connecting equestrian professionals worldwide
        </p>
      </div>
    </div>
  `;

  const textContent = `
ProHorseMatch - New Message Received

Hi ${params.recipientName},

${params.senderName} sent you a message about ${params.horseName}:

"${params.messageContent}"

Reply to this message: ${params.conversationUrl}

Stay connected and don't miss important conversations about your horse interests.

© 2025 ProHorseMatch. Connecting equestrian professionals worldwide.
  `;

  try {
    console.log('Sending message notification email...');
    
    if (mailService) {
      // Use SendGrid
      console.log('Sending via SendGrid...');
      await mailService.send({
        from: 'noreply@prohorsematch.com',
        to: params.to,
        subject: `New message about ${params.horseName} - ProHorseMatch`,
        html: htmlContent,
        text: textContent,
      });
    } else if (resend) {
      // Use Resend
      console.log('Sending via Resend...');
      const { data, error } = await resend.emails.send({
        from: 'ProHorseMatch <noreply@prohorsematch.com>',
        to: [params.to],
        subject: `New message about ${params.horseName} - ProHorseMatch`,
        html: htmlContent,
        text: textContent,
      });
      
      if (error) {
        console.error('Message notification email error:', error);
        return false;
      }
      console.log('Resend response:', data);
    } else {
      console.warn('No email service configured - message notification not sent');
      return false;
    }
    
    console.log('Message notification email sent successfully');
    return true;
  } catch (error) {
    console.error('Message notification email service error:', error);
    return false;
  }
}