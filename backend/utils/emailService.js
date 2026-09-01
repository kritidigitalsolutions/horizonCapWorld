const nodemailer = require("nodemailer");

/**
 * High-deliverability Nodemailer transporter configuration for Gmail SMTP
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: process.env.EMAIL_USER || "catchandwatch007@gmail.com",
    pass: process.env.EMAIL_PASS || "kclufinuwxsmtpkh",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Verify transporter connection on startup
 */
transporter.verify((error) => {
  if (error) {
    console.error("[Email Service] SMTP verification failed:", error.message);
  } else {
    console.log("[Email Service] Gmail SMTP ready & optimized for primary inbox deliverability.");
  }
});

/**
 * Generate Inbox-Optimized Plaintext Fallback
 */
const generateOtpText = ({ name, otp, purposeText, expiryMinutes = 10 }) => {
  return `Horizon Capital - Security Verification Code

Hello ${name || "Investor"},

Your one-time verification code (OTP) for ${purposeText} is:

====================
${otp}
====================

This code will expire in ${expiryMinutes} minutes.

Security Notice:
Never share this OTP with anyone. Horizon Capital staff will never ask for your verification code.

If you did not request this code, please secure your account immediately or contact our support team.

Best regards,
Horizon Capital Security Team
https://horizoncapworlds.com
`;
};

/**
 * Generate Clean, Inbox-Optimized HTML Email Template (Light background, high text-to-code ratio, zero spam heuristics)
 */
const generateOtpEmailHtml = ({ name, otp, purposeText, expiryMinutes = 10 }) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Verification Code: ${otp}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Top Gold Header Strip -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #d97706, #ffd70d, #b45309);"></td>
          </tr>

          <!-- Header / Logo -->
          <tr>
            <td style="padding: 28px 32px 20px; text-align: left; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase;">
                      HORIZON <span style="color: #d97706;">CAPITAL</span>
                    </div>
                    <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                      Secure Verification System
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; border-radius: 20px;">
                      Confidential
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                Your Verification Code
              </h1>
              
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
                Hello <strong>${name || "Investor"}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
                Use the following 6-digit one-time code to complete your <strong>${purposeText}</strong>:
              </p>

              <!-- OTP Code Display Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0 24px;">
                <tr>
                  <td align="center" style="background-color: #fffbeb; border: 2px solid #fde68a; border-radius: 10px; padding: 20px 15px;">
                    <div style="font-size: 11px; font-weight: 700; color: #92400e; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px;">
                      One-Time Security Passcode
                    </div>
                    <div style="font-family: Consolas, 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #78350f; line-height: 1.2;">
                      ${otp}
                    </div>
                    <div style="font-size: 12px; color: #a16207; font-weight: 600; margin-top: 6px;">
                      Expires in ${expiryMinutes} minutes
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Advice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border-left: 4px solid #d97706; border-radius: 0 6px 6px 0; padding: 12px 16px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 12px; line-height: 1.5; color: #475569;">
                    <strong style="color: #0f172a;">Security Reminder:</strong> Horizon Capital employees will never ask you for this code. If you did not make this request, please change your password immediately.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                Thank you for choosing Horizon Capital Worlds.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; font-weight: 500;">
                &copy; ${new Date().getFullYear()} Horizon Capital Worlds. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                This is an automated transactional security alert. Replies to this email are not monitored.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Generate Password Reset Success Plaintext
 */
const generatePasswordResetSuccessText = ({ name }) => {
  return `Horizon Capital - Password Changed Successfully

Hello ${name || "Investor"},

Your account password for Horizon Capital Worlds has been updated successfully.

If you performed this action, you can safely ignore this notification.
If you did not authorize this change, please contact our support team immediately.

Horizon Capital Security Team
`;
};

/**
 * Generate Password Reset Confirmation HTML
 */
const generatePasswordResetSuccessHtml = ({ name }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Password Updated</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <tr>
            <td style="height: 5px; background: #10b981;"></td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: center;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background-color: #d1fae5; color: #059669; font-size: 24px; line-height: 48px; margin: 0 auto 16px; font-weight: bold;">
                &#10003;
              </div>
              <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #0f172a;">Password Updated Successfully</h2>
              <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.5;">
                Hello <strong>${name || "Investor"}</strong>, your Horizon Capital password was changed successfully.
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                If you made this change, no further action is needed. If you did not make this change, please contact our security team immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} Horizon Capital Worlds
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Send OTP Email with Strict Inbox Optimization Headers & Plaintext Fallback
 */
const sendOtpEmail = async ({ to, name, otp, purpose = "Security Verification" }) => {
  try {
    const senderEmail = process.env.EMAIL_USER || "catchandwatch007@gmail.com";
    const subject = `Horizon Capital: Your verification code is ${otp}`;
    const text = generateOtpText({ name, otp, purposeText: purpose, expiryMinutes: 10 });
    const html = generateOtpEmailHtml({ name, otp, purposeText: purpose, expiryMinutes: 10 });

    const mailOptions = {
      from: `"Horizon Capital" <${senderEmail}>`,
      to: to.trim(),
      sender: senderEmail,
      replyTo: senderEmail,
      envelope: {
        from: senderEmail,
        to: [to.trim()],
      },
      subject,
      text,
      html,
      headers: {
        "X-Priority": "1 (Highest)",
        "X-MSMail-Priority": "High",
        "Importance": "High",
        "X-Mailer": "HorizonCapital SecurityMailer v1.0",
        "Auto-Submitted": "auto-generated",
        "X-Auto-Response-Suppress": "All",
        "X-Entity-Ref-ID": `horizon-${Date.now()}-${otp}`,
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] OTP successfully sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send OTP email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send Password Reset Confirmation Email
 */
const sendPasswordResetConfirmation = async ({ to, name }) => {
  try {
    const senderEmail = process.env.EMAIL_USER || "catchandwatch007@gmail.com";
    const subject = `Horizon Capital: Password Changed Successfully`;
    const text = generatePasswordResetSuccessText({ name });
    const html = generatePasswordResetSuccessHtml({ name });

    const mailOptions = {
      from: `"Horizon Capital" <${senderEmail}>`,
      to: to.trim(),
      sender: senderEmail,
      replyTo: senderEmail,
      envelope: {
        from: senderEmail,
        to: [to.trim()],
      },
      subject,
      text,
      html,
      headers: {
        "X-Priority": "1 (Highest)",
        "Importance": "High",
        "X-Mailer": "HorizonCapital SecurityMailer v1.0",
        "Auto-Submitted": "auto-generated",
      },
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send password reset confirmation to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOtpEmail,
  sendPasswordResetConfirmation,
};
