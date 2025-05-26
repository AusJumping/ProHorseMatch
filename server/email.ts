import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendVerificationEmail(
  email: string, 
  verificationToken: string, 
  userName: string = 'User'
): Promise<boolean> {
  const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/verify-email?token=${verificationToken}`;
  
  const emailParams: EmailParams = {
    to: email,
    from: 'noreply@prohorsematch.com', // You'll need to verify this domain with SendGrid
    subject: 'Welcome to ProHorseMatch - Please verify your email',
    text: `Hi ${userName},

Welcome to ProHorseMatch! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with us, please ignore this email.

Best regards,
The ProHorseMatch Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #cdac6e; font-size: 28px; margin: 0;">ProHorseMatch</h1>
          <p style="color: #666; margin: 5px 0;">Welcome to the equestrian community</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${userName}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Welcome to ProHorseMatch! We're excited to have you join our community of horse enthusiasts.
          </p>
          <p style="color: #666; line-height: 1.6;">
            To get started, please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #cdac6e; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold;
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-bottom: 0;">
            This link will expire in 24 hours. If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="color: #cdac6e; font-size: 14px; word-break: break-all;">
            ${verificationUrl}
          </p>
        </div>
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>If you didn't create an account with us, please ignore this email.</p>
          <p>&copy; 2025 ProHorseMatch. All rights reserved.</p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailParams);
}