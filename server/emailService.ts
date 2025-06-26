import axios from 'axios';

if (!process.env.CAMPAIGN_MONITOR_API_KEY) {
  throw new Error("CAMPAIGN_MONITOR_API_KEY environment variable must be set");
}

const CAMPAIGN_MONITOR_BASE_URL = 'https://api.campaignmonitor.com/api/v3.3';
const API_KEY = process.env.CAMPAIGN_MONITOR_API_KEY;

interface EmailVerificationParams {
  to: string;
  username: string;
  verificationToken: string;
  baseUrl: string;
}

export async function sendVerificationEmail(params: EmailVerificationParams): Promise<boolean> {
  const verificationUrl = `${params.baseUrl}/verify-email?token=${params.verificationToken}`;
  
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
    const response = await axios.post(
      `${CAMPAIGN_MONITOR_BASE_URL}/transactional/smartEmail/{smartEmailID}/send`,
      {
        To: [params.to],
        Data: {
          username: params.username,
          verification_url: verificationUrl,
          base_url: params.baseUrl
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.status === 202;
  } catch (error) {
    console.error('Campaign Monitor email error:', error);
    
    // Fallback to basic transactional email if smart email fails
    try {
      const fallbackResponse = await axios.post(
        `${CAMPAIGN_MONITOR_BASE_URL}/transactional/classicEmail/send`,
        {
          Subject: 'Verify your ProHorseMatch account',
          From: 'noreply@prohorsematch.com',
          To: [params.to],
          HTML: htmlContent,
          Text: textContent
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return fallbackResponse.status === 202;
    } catch (fallbackError) {
      console.error('Campaign Monitor fallback email error:', fallbackError);
      return false;
    }
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

  try {
    const response = await axios.post(
      `${CAMPAIGN_MONITOR_BASE_URL}/transactional/classicEmail/send`,
      {
        Subject: 'Welcome to ProHorseMatch - Account Verified!',
        From: 'noreply@prohorsematch.com',
        To: [to],
        HTML: htmlContent
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.status === 202;
  } catch (error) {
    console.error('Campaign Monitor welcome email error:', error);
    return false;
  }
}