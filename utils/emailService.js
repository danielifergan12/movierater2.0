const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // If email is not configured, return null
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email service not configured. Missing required environment variables: EMAIL_HOST, EMAIL_USER, or EMAIL_PASS');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Add connection timeout
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
    });

    return transporter;
  } catch (error) {
    console.error('Error creating email transporter:', error);
    return null;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetLink) => {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('Invalid email format:', email);
    return { success: false, message: 'Invalid email address', resetLink };
  }

  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email not configured. Reset link:', resetLink);
    return { success: false, message: 'Email service not configured', resetLink };
  }

  const mailOptions = {
    from: `"ReelList" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - ReelList',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .content {
              background-color: #ffffff;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(45deg, #00d4ff, #ff6b35);
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello,</p>
              <p>You requested to reset your password for your ReelList account. Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #00d4ff;">${resetLink}</p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <div class="footer">
                <p>Best regards,<br>The ReelList Team</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request - ReelList
      
      Hello,
      
      You requested to reset your password for your ReelList account. 
      Click the link below to reset your password:
      
      ${resetLink}
      
      This link will expire in 1 hour.
      
      If you didn't request this password reset, please ignore this email.
      
      Best regards,
      The ReelList Team
    `,
  };

  try {
    // Verify connection before sending
    await transporter.verify();
    console.log('Email server connection verified successfully');

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent successfully to: ${email}`);
    console.log('Email message ID:', info.messageId);
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    
    // Provide more specific error messages for common issues
    let errorMessage = 'Failed to send email. Please try again later.';
    
    if (error.code === 'EAUTH') {
      console.error('Email authentication failed. Check EMAIL_USER and EMAIL_PASS.');
      errorMessage = 'Email authentication failed. Please contact support.';
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('Email server connection failed. Check EMAIL_HOST and EMAIL_PORT.');
      errorMessage = 'Email server connection failed. Please try again later.';
    } else if (error.responseCode) {
      console.error('SMTP error response:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
    }
    
    // Don't expose sensitive error details to user, but log them for debugging
    return { success: false, message: errorMessage, resetLink };
  }
};

module.exports = {
  sendPasswordResetEmail,
};

