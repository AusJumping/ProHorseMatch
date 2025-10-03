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

interface HorseListingNotificationParams {
  to: string;
  horseName: string;
  ownerName: string;
  ownerEmail: string;
  price: string;
  currency: string;
  location: string;
  disciplines: string[];
  horseUrl: string;
}

interface NewConversationNotificationParams {
  to: string;
  recipientName: string;
  senderName: string;
  horseName: string;
  messageContent: string;
  conversationUrl: string;
  userType: 'customer' | 'owner'; // Who is receiving this notification
}

interface ConversationReminderParams {
  to: string;
  recipientName: string;
  senderName: string;
  horseName: string;
  conversationUrl: string;
  daysSinceLastMessage: number;
  userType: 'customer' | 'owner'; // Who is receiving this notification
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
            This verification link will expire in 48 hours. If you didn't create an account with ProHorseMatch, please ignore this email.
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

This verification link will expire in 48 hours. If you didn't create an account with ProHorseMatch, please ignore this email.

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
          <a href="https://pro-horse-match-info6446.replit.app" 
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

Visit: https://pro-horse-match-info6446.replit.app

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
          We received a request to reset your ProHorseMatch account password. Click the button below to create a new password. This link will expire in 48 hours for security.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #6B5B3D 0%, #CDAC6E 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(107, 91, 61, 0.3); transition: transform 0.2s;">
            Reset Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6B5B3D; margin-top: 35px; margin-bottom: 8px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="font-size: 14px; color: #CDAC6E; word-break: break-all; background: #F8F6F0; padding: 12px; border-radius: 4px; border-left: 3px solid #CDAC6E;">
          ${resetUrl}
        </p>
        
        <div style="background: #FFF3E0; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #FF9800;">
          <h3 style="color: #E65100; margin-top: 0; font-size: 16px; font-weight: 600;">⚠️ Important Security Notice</h3>
          <p style="color: #4A453E; margin: 10px 0 0 0; line-height: 1.6; font-size: 14px;">
            If you didn't request this password reset, please ignore this email. Your account remains secure and no changes have been made.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #8B7355; line-height: 1.6; margin-bottom: 0;">
          This reset link will expire in 48 hours. If you need assistance, please contact our support team.
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

This link will expire in 48 hours for security.

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

export async function sendHorseListingNotification(params: HorseListingNotificationParams): Promise<boolean> {
  console.log('=== HORSE LISTING NOTIFICATION START ===');
  console.log('Sending horse listing notification:', {
    to: params.to,
    horseName: params.horseName,
    ownerEmail: params.ownerEmail
  });

  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', 'Arial', sans-serif; color: #2D2A25;">
      <div style="background: linear-gradient(135deg, #2b2b2b 0%, #4A453E 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">🐎 New Horse Listed</h1>
        <p style="color: #F5E6D3; margin: 15px 0 0 0; font-size: 16px; opacity: 0.95;">A new horse has been added to ProHorseMatch</p>
      </div>
      
      <div style="background: #FEFCF7; padding: 40px 30px; border-left: 4px solid #CDAC6E; border-right: 1px solid #E8E3D3; border-bottom: 1px solid #E8E3D3;">
        <h2 style="color: #2D2A25; margin-top: 0; font-size: 24px; font-weight: 600;">${params.horseName}</h2>
        
        <div style="background: #F8F6F0; padding: 20px; border-radius: 8px; border-left: 3px solid #CDAC6E; margin: 25px 0;">
          <p style="margin: 0 0 12px 0; font-size: 16px; color: #2D2A25;"><strong>Owner:</strong> ${params.ownerName}</p>
          <p style="margin: 0 0 12px 0; font-size: 16px; color: #2D2A25;"><strong>Contact:</strong> ${params.ownerEmail}</p>
          <p style="margin: 0 0 12px 0; font-size: 16px; color: #2D2A25;"><strong>Price:</strong> ${params.price} ${params.currency}</p>
          <p style="margin: 0 0 12px 0; font-size: 16px; color: #2D2A25;"><strong>Location:</strong> ${params.location}</p>
          <p style="margin: 0; font-size: 16px; color: #2D2A25;"><strong>Disciplines:</strong> ${params.disciplines.join(', ')}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.horseUrl}" 
             style="background: linear-gradient(135deg, #6B5B3D 0%, #CDAC6E 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(107, 91, 61, 0.3);">
            View Horse Details
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #E8E3D3;">
          <p style="font-size: 14px; color: #6B5B3D; margin: 0; line-height: 1.5;">
            This is an automated notification from the ProHorseMatch admin system.
          </p>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #F8F6F0 0%, #E8E3D3 100%); padding: 25px 30px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="font-size: 13px; color: #6B5B3D; margin: 0; font-weight: 500;">
          © 2025 ProHorseMatch • Admin Notifications
        </p>
      </div>
    </div>
  `;

  const textContent = `
New Horse Listed on ProHorseMatch

Horse: ${params.horseName}
Owner: ${params.ownerName}
Contact: ${params.ownerEmail}
Price: ${params.price} ${params.currency}
Location: ${params.location}
Disciplines: ${params.disciplines.join(', ')}

View details: ${params.horseUrl}

This is an automated notification from the ProHorseMatch admin system.
© 2025 ProHorseMatch
  `;

  try {
    console.log('Attempting to send horse listing notification...');
    
    if (mailService) {
      // Use SendGrid
      console.log('Sending via SendGrid...');
      await mailService.send({
        from: 'notifications@prohorsematch.com',
        to: params.to,
        subject: `New Horse Listed: ${params.horseName}`,
        html: htmlContent,
        text: textContent,
      });
    } else if (resend) {
      // Use Resend
      console.log('Sending via Resend...');
      const { data, error } = await resend.emails.send({
        from: 'ProHorseMatch Notifications <notifications@prohorsematch.com>',
        to: [params.to],
        subject: `🐎 New Horse Listed: ${params.horseName}`,
        html: htmlContent,
        text: textContent,
      });
      
      if (error) {
        console.error('Resend email error:', error);
        return false;
      }
      console.log('Horse listing notification sent successfully:', data);
    } else {
      console.warn('No email service configured - horse listing notification not sent');
      return false;
    }
    
    console.log('Horse listing notification sent successfully');
    return true;
  } catch (error) {
    console.error('Horse listing notification error:', error);
    return false;
  }
}

export async function sendNewConversationNotificationEmail(params: NewConversationNotificationParams): Promise<boolean> {
  console.log('=== NEW CONVERSATION NOTIFICATION EMAIL START ===');
  console.log('New conversation notification email service called with params:', {
    to: params.to,
    recipientName: params.recipientName,
    senderName: params.senderName,
    horseName: params.horseName,
    userType: params.userType,
    messageLength: params.messageContent?.length || 0
  });

  const roleDescription = params.userType === 'customer' ? 'potential buyer' : 'horse owner';
  const otherRole = params.userType === 'customer' ? 'horse owner' : 'potential buyer';

  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', 'Arial', sans-serif; color: #2D2A25;">
      <div style="background: #2b2b2b; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">ProHorseMatch</h1>
        <p style="color: #F5E6D3; margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">🎯 New Conversation Started</p>
      </div>
      
      <div style="background: #FEFCF7; padding: 40px 30px; border-left: 4px solid #CDAC6E; border-right: 1px solid #E8E3D3; border-bottom: 1px solid #E8E3D3;">
        <h2 style="color: #2D2A25; margin-top: 0; font-size: 24px; font-weight: 600;">You Have a New Inquiry!</h2>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 20px; color: #2D2A25;">
          Hi <strong>${params.recipientName}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 25px; color: #4A453E;">
          Great news! <strong>${params.senderName}</strong> (${otherRole}) has started a new conversation with you about <strong>${params.horseName}</strong>:
        </p>
        
        <div style="background: #F8F6F0; border-left: 4px solid #CDAC6E; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <p style="font-size: 16px; line-height: 1.6; margin: 0; color: #2D2A25; font-style: italic;">
            "${params.messageContent}"
          </p>
        </div>
        
        <div style="background: #E8F5E8; border: 1px solid #C8E6C9; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #2E7D32; font-weight: 600; font-size: 16px;">💡 First Impressions Matter</p>
          <p style="margin: 8px 0 0 0; color: #2E7D32; font-size: 14px;">
            Respond promptly to show you're engaged and professional. This helps build trust in the equestrian community.
          </p>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${params.conversationUrl}" 
             style="background: linear-gradient(135deg, #6B5B3D 0%, #CDAC6E 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(107, 91, 61, 0.3); transition: transform 0.2s;">
            Start Conversation
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6B5B3D; margin-top: 35px; margin-bottom: 8px;">
          📱 <strong>Quick Tip:</strong> You can manage all your conversations from your ProHorseMatch messages panel.
        </p>
        
        <p style="font-size: 14px; color: #8B7355; margin-top: 25px; border-top: 1px solid #E8E3D3; padding-top: 20px;">
          Best regards,<br>
          <strong>The ProHorseMatch Team</strong><br>
          <em>Connecting equestrian professionals worldwide</em>
        </p>
      </div>
    </div>
  `;

  const textContent = `
New Conversation Started - ProHorseMatch

Hi ${params.recipientName},

Great news! ${params.senderName} (${otherRole}) has started a new conversation with you about ${params.horseName}:

"${params.messageContent}"

💡 First Impressions Matter
Respond promptly to show you're engaged and professional. This helps build trust in the equestrian community.

View and respond to this conversation: ${params.conversationUrl}

📱 Quick Tip: You can manage all your conversations from your ProHorseMatch messages panel.

Best regards,
The ProHorseMatch Team
Connecting equestrian professionals worldwide

© 2025 ProHorseMatch
  `;

  try {
    console.log('Attempting to send new conversation notification...');
    
    if (mailService) {
      // Use SendGrid
      console.log('Sending via SendGrid...');
      await mailService.send({
        from: 'notifications@prohorsematch.com',
        to: params.to,
        subject: `🎯 New Inquiry About ${params.horseName}`,
        html: htmlContent,
        text: textContent,
      });
    } else if (resend) {
      // Use Resend
      console.log('Sending via Resend...');
      const { data, error } = await resend.emails.send({
        from: 'ProHorseMatch <notifications@prohorsematch.com>',
        to: [params.to],
        subject: `🎯 New Inquiry About ${params.horseName}`,
        html: htmlContent,
        text: textContent,
      });
      
      if (error) {
        console.error('New conversation notification email error:', error);
        return false;
      }
      console.log('Resend response:', data);
    } else {
      console.warn('No email service configured - new conversation notification not sent');
      return false;
    }
    
    console.log('New conversation notification email sent successfully');
    return true;
  } catch (error) {
    console.error('New conversation notification email service error:', error);
    return false;
  }
}

export async function sendConversationReminderEmail(params: ConversationReminderParams): Promise<boolean> {
  console.log('=== CONVERSATION REMINDER EMAIL START ===');
  console.log('Conversation reminder email service called with params:', {
    to: params.to,
    recipientName: params.recipientName,
    senderName: params.senderName,
    horseName: params.horseName,
    userType: params.userType,
    daysSinceLastMessage: params.daysSinceLastMessage
  });

  const roleDescription = params.userType === 'customer' ? 'potential buyer' : 'horse owner';
  const otherRole = params.userType === 'customer' ? 'horse owner' : 'potential buyer';

  const htmlContent = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', 'Arial', sans-serif; color: #2D2A25;">
      <div style="background: #2b2b2b; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">ProHorseMatch</h1>
        <p style="color: #F5E6D3; margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">⏰ Conversation Reminder</p>
      </div>
      
      <div style="background: #FEFCF7; padding: 40px 30px; border-left: 4px solid #CDAC6E; border-right: 1px solid #E8E3D3; border-bottom: 1px solid #E8E3D3;">
        <h2 style="color: #2D2A25; margin-top: 0; font-size: 24px; font-weight: 600;">Don't Miss This Opportunity!</h2>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 20px; color: #2D2A25;">
          Hi <strong>${params.recipientName}</strong>,
        </p>
        
        <p style="font-size: 16px; line-height: 1.7; margin-bottom: 25px; color: #4A453E;">
          You have an unread message from <strong>${params.senderName}</strong> about <strong>${params.horseName}</strong> that was sent ${params.daysSinceLastMessage} days ago.
        </p>
        
        <div style="background: #FFF3CD; border: 1px solid #FFEAA7; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #856404; font-weight: 600; font-size: 16px;">⏰ Time-Sensitive Opportunity</p>
          <p style="margin: 8px 0 0 0; color: #856404; font-size: 14px;">
            In the equestrian market, timing is everything. Don't let this potential match slip away!
          </p>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${params.conversationUrl}" 
             style="background: linear-gradient(135deg, #6B5B3D 0%, #CDAC6E 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(107, 91, 61, 0.3); transition: transform 0.2s;">
            View Message & Respond
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6B5B3D; margin-top: 35px; margin-bottom: 8px;">
          💼 <strong>Professional Reminder:</strong> Timely responses build trust and strengthen relationships in the equestrian community.
        </p>
        
        <p style="font-size: 14px; color: #8B7355; margin-top: 25px; border-top: 1px solid #E8E3D3; padding-top: 20px;">
          Best regards,<br>
          <strong>The ProHorseMatch Team</strong><br>
          <em>Connecting equestrian professionals worldwide</em>
        </p>
      </div>
    </div>
  `;

  const textContent = `
Conversation Reminder - ProHorseMatch

Hi ${params.recipientName},

You have an unread message from ${params.senderName} about ${params.horseName} that was sent ${params.daysSinceLastMessage} days ago.

⏰ Time-Sensitive Opportunity
In the equestrian market, timing is everything. Don't let this potential match slip away!

View and respond to this conversation: ${params.conversationUrl}

💼 Professional Reminder: Timely responses build trust and strengthen relationships in the equestrian community.

Best regards,
The ProHorseMatch Team
Connecting equestrian professionals worldwide

© 2025 ProHorseMatch
  `;

  try {
    console.log('Attempting to send conversation reminder...');
    
    if (mailService) {
      // Use SendGrid
      console.log('Sending via SendGrid...');
      await mailService.send({
        from: 'notifications@prohorsematch.com',
        to: params.to,
        subject: `⏰ Don't Miss Out: Message About ${params.horseName}`,
        html: htmlContent,
        text: textContent,
      });
    } else if (resend) {
      // Use Resend
      console.log('Sending via Resend...');
      const { data, error } = await resend.emails.send({
        from: 'ProHorseMatch <notifications@prohorsematch.com>',
        to: [params.to],
        subject: `⏰ Don't Miss Out: Message About ${params.horseName}`,
        html: htmlContent,
        text: textContent,
      });
      
      if (error) {
        console.error('Conversation reminder email error:', error);
        return false;
      }
      console.log('Resend response:', data);
    } else {
      console.warn('No email service configured - conversation reminder not sent');
      return false;
    }
    
    console.log('Conversation reminder email sent successfully');
    return true;
  } catch (error) {
    console.error('Conversation reminder email service error:', error);
    return false;
  }
}