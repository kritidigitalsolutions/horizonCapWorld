const nodemailer = require("nodemailer");

const SENDER_EMAIL = process.env.EMAIL_USER || "tradex615@gmail.com";
const SENDER_PASS = process.env.EMAIL_PASS || "wyqxlbtyeucqorle";

/**
 * Standard Gmail transporter configuration
 * Uses Nodemailer's built-in 'gmail' service to ensure standard, trusted TLS/SSL settings
 * and prevents custom header anomalies that trigger spam filters.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SENDER_EMAIL,
    pass: SENDER_PASS,
  },
});

/**
 * Verify transporter connection on startup
 */
transporter.verify((error) => {
  if (error) {
    console.error("[Email Service] Gmail SMTP verification failed:", error.message);
  } else {
    console.log(`[Email Service] Gmail SMTP connected as ${SENDER_EMAIL} (Inbox Optimized)`);
  }
});

/**
 * Clean, lightweight, spam-free HTML email wrapper
 * - No zero-contrast or hidden 1px font divs (which trigger SpamAssassin FONT_SIZE_TINY / COLOR_SAME_AS_BG)
 * - Standard web typography and clean CSS
 * - High text-to-code ratio
 * - Fully mobile responsive
 */
const wrapCleanHtml = ({ title, bodyHtml }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; padding: 32px 28px;">
          <!-- Brand Header -->
          <tr>
            <td style="padding-bottom: 24px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; text-transform: uppercase;">
                HORIZON <span style="color: #d97706;">CAP</span>
              </span>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding-top: 24px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top: 28px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0 0 6px;">Horizon &bull; Automated Notification</p>
              <p style="margin: 0;">If you did not request this email, please contact our support desk.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ==========================================
// 1. OTP EMAIL (LOGIN, SIGNUP, 2FA)
// Standard subject: "<code > is your verification code"
// This pattern is recognized by Google/Apple/Yahoo as high-priority primary inbox mail.
// ==========================================

const sendOtpEmail = async ({ to, name, otp, purpose = "verification" }) => {
  try {
    const sender = process.env.EMAIL_USER || SENDER_EMAIL;
    const recipient = to.trim();
    const subject = `${otp} is your verification code`;

    const text = `Hi ${name || "there"},

Your verification code is:

${otp}

This code will expire in 10 minutes. Please do not share this code with anyone.

If you did not make this request, you can safely ignore this email.

Thanks,
Horizon Team
`;

    const bodyHtml = `
      <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">
        Verification Code
      </h2>
      <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">
        Hi ${name || "there"},
      </p>
      <p style="margin: 0 0 20px; font-size: 14px; color: #475569;">
        Please enter the following 6-digit code to complete your ${purpose}:
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; text-align: center; margin: 20px 0;">
        <span style="font-family: Consolas, 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a;">
          ${otp}
        </span>
      </div>

      <p style="margin: 0 0 12px; font-size: 13px; color: #64748b;">
        This code is valid for 10 minutes. Never share this code with anyone.
      </p>
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">
        If you didn't request this code, no action is needed.
      </p>
    `;

    const html = wrapCleanHtml({ title: subject, bodyHtml });

    const info = await transporter.sendMail({
      from: `"Horizon" <${sender}>`,
      to: recipient,
      subject,
      text,
      html,
    });

    console.log(`[Email Service] OTP email delivered to ${recipient} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send OTP to ${to}:`, error.message);
    throw error;
  }
};

// ==========================================
// 2. USER REGISTRATION WELCOME EMAIL
// ==========================================

const sendWelcomeEmail = async ({ to, name, customId, sponsorId }) => {
  try {
    const sender = process.env.EMAIL_USER || SENDER_EMAIL;
    const recipient = to.trim();
    const subject = `Welcome to Horizon, ${name || "Investor"}`;

    const text = `Hi ${name || "Investor"},

Welcome to Horizon! Your account is now active and verified.

Account Summary:
- Account ID: ${customId}
- Email: ${recipient}
- Sponsor ID: ${sponsorId || "HORIZON-HQ"}

Sign in to your account:
https://horizoncapworlds.com/login

If you have any questions or need assistance, feel free to reply to our support desk.

Thanks,
Horizon Team
`;

    const bodyHtml = `
      <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">
        Welcome to Horizon!
      </h2>
      <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">
        Hi ${name || "Investor"}, your account has been successfully verified and activated.
      </p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin: 18px 0; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Account ID:</td>
          <td align="right" style="padding: 6px 0; font-weight: 700; color: #0f172a; font-family: monospace;">${customId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Email:</td>
          <td align="right" style="padding: 6px 0; font-weight: 600; color: #0f172a;">${recipient}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Sponsor:</td>
          <td align="right" style="padding: 6px 0; font-weight: 600; color: #d97706;">${sponsorId || "HORIZON-HQ"}</td>
        </tr>
      </table>

      <div style="text-align: center; margin: 24px 0;">
        <a href="https://horizoncapworlds.com/login" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
          Go to Dashboard &rarr;
        </a>
      </div>
    `;

    const html = wrapCleanHtml({ title: subject, bodyHtml });

    const info = await transporter.sendMail({
      from: `"Horizon" <${sender}>`,
      to: recipient,
      subject,
      text,
      html,
    });

    console.log(`[Email Service] Welcome email delivered to ${recipient} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send welcome email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ==========================================
// 3. DEPOSIT NOTIFICATION EMAIL (SUBMITTED / APPROVED)
// ==========================================

const sendDepositEmail = async ({ to, name, amount, gateway, transactionId, status = "Pending" }) => {
  try {
    const sender = process.env.EMAIL_USER || SENDER_EMAIL;
    const recipient = to.trim();
    const isApproved = status === "Approved" || status === "Completed";
    const statusText = isApproved ? "Completed" : "Received";
    const subject = `Deposit confirmation: #${transactionId}`;

    const text = `Hi ${name || "Investor"},

Your deposit of $${Number(amount).toLocaleString()} USD has been ${isApproved ? "approved and credited to your balance" : "received and is currently under review"}.

Details:
- Amount: $${Number(amount).toLocaleString()} USD
- Channel: ${gateway || "Transfer"}
- Transaction ID: ${transactionId}
- Status: ${statusText}

View your account:
https://horizoncapworlds.com/transactions

Thanks,
Horizon Team
`;

    const bodyHtml = `
      <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">
        Deposit ${isApproved ? "Approved" : "Received"}
      </h2>
      <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">
        Hi ${name || "Investor"}, your deposit of $${Number(amount).toLocaleString()} USD is ${statusText.toLowerCase()}.
      </p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin: 18px 0; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Amount:</td>
          <td align="right" style="padding: 6px 0; font-weight: 800; color: #059669;">$${Number(amount).toLocaleString()} USD</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Method:</td>
          <td align="right" style="padding: 6px 0; font-weight: 600; color: #0f172a;">${gateway || "Transfer"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Reference:</td>
          <td align="right" style="padding: 6px 0; font-weight: 600; color: #0f172a; font-family: monospace;">${transactionId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Status:</td>
          <td align="right" style="padding: 6px 0; font-weight: 700; color: ${isApproved ? "#059669" : "#d97706"};">${statusText}</td>
        </tr>
      </table>
    `;

    const html = wrapCleanHtml({ title: subject, bodyHtml });

    const info = await transporter.sendMail({
      from: `"Horizon" <${sender}>`,
      to: recipient,
      subject,
      text,
      html,
    });

    console.log(`[Email Service] Deposit email delivered to ${recipient} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send deposit email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ==========================================
// 4. WITHDRAWAL NOTIFICATION EMAIL (SUBMITTED / APPROVED)
// ==========================================

const sendWithdrawalEmail = async ({
  to,
  name,
  amount,
  netAmount,
  fee = 0,
  gateway,
  destination,
  transactionId,
  status = "Pending",
}) => {
  try {
    const sender = process.env.EMAIL_USER || SENDER_EMAIL;
    const recipient = to.trim();
    const isApproved = status === "Approved" || status === "Completed";
    const statusText = isApproved ? "Completed" : "Submitted";
    const subject = `Withdrawal confirmation: #${transactionId}`;

    const text = `Hi ${name || "Investor"},

Your withdrawal request for $${Number(amount).toLocaleString()} USD has been ${isApproved ? "approved and processed" : "received and is in queue for processing"}.

Details:
- Amount: $${Number(amount).toLocaleString()} USD
- Net: $${Number(netAmount || amount).toLocaleString()} USD
- Destination: ${destination || "On File"}
- Transaction ID: ${transactionId}
- Status: ${statusText}

If you did not initiate this withdrawal, please contact our support team immediately.

Thanks,
Horizon Team
`;

    const bodyHtml = `
      <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">
        Withdrawal ${isApproved ? "Approved" : "Request Submitted"}
      </h2>
      <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">
        Hi ${name || "Investor"}, your withdrawal of $${Number(amount).toLocaleString()} USD has been ${statusText.toLowerCase()}.
      </p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin: 18px 0; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Requested Amount:</td>
          <td align="right" style="padding: 6px 0; font-weight: 700; color: #0f172a;">$${Number(amount).toLocaleString()} USD</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Net Amount:</td>
          <td align="right" style="padding: 6px 0; font-weight: 800; color: #059669;">$${Number(netAmount || amount).toLocaleString()} USD</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Destination:</td>
          <td align="right" style="padding: 6px 0; font-weight: 600; color: #0f172a; font-family: monospace;">${destination || "On File"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Reference:</td>
          <td align="right" style="padding: 6px 0; font-weight: 600; color: #0f172a; font-family: monospace;">${transactionId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Status:</td>
          <td align="right" style="padding: 6px 0; font-weight: 700; color: ${isApproved ? "#059669" : "#d97706"};">${statusText}</td>
        </tr>
      </table>
    `;

    const html = wrapCleanHtml({ title: subject, bodyHtml });

    const info = await transporter.sendMail({
      from: `"Horizon" <${sender}>`,
      to: recipient,
      subject,
      text,
      html,
    });

    console.log(`[Email Service] Withdrawal email delivered to ${recipient} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send withdrawal email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ==========================================
// 5. SUPPORT TICKET NOTIFICATION EMAIL (RAISED / REPLIED)
// ==========================================

const sendTicketEmail = async ({
  to,
  name,
  ticketId,
  subject: ticketSubject,
  category,
  message,
  status = "Open",
  isReply = false,
  replyText,
}) => {
  try {
    const sender = process.env.EMAIL_USER || SENDER_EMAIL;
    const recipient = to.trim();
    const emailSubject = isReply
      ? `Update on ticket #${ticketId}: ${ticketSubject}`
      : `Ticket #${ticketId} created: ${ticketSubject}`;

    const text = `Hi ${name || "there"},

${
  isReply
    ? `A response was added to your support ticket #${ticketId}:`
    : `Your support ticket #${ticketId} has been created:`
}

Subject: ${ticketSubject}

${isReply ? replyText : message}

View ticket details:
https://horizoncapworlds.com/support

Thanks,
Horizon Support
`;

    const bodyHtml = `
      <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">
        ${isReply ? "Support Response" : "Ticket Created"}
      </h2>
      <p style="margin: 0 0 14px; font-size: 14px; color: #475569;">
        Hi ${name || "there"}, ${isReply ? "here is an update on your support ticket:" : "your support ticket has been received:"}
      </p>

      <div style="background-color: #f8fafc; border-left: 3px solid #d97706; padding: 14px 16px; margin: 16px 0; font-size: 13px; color: #1e293b; white-space: pre-wrap;">
        ${isReply ? replyText : message}
      </div>

      <p style="margin: 14px 0 0; font-size: 12px; color: #64748b;">
        Ticket ID: <strong>#${ticketId}</strong> &bull; Subject: <strong>${ticketSubject}</strong>
      </p>
    `;

    const html = wrapCleanHtml({ title: emailSubject, bodyHtml });

    const info = await transporter.sendMail({
      from: `"Horizon" <${sender}>`,
      to: recipient,
      subject: emailSubject,
      text,
      html,
    });

    console.log(`[Email Service] Support ticket email delivered to ${recipient} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send ticket email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ==========================================
// 6. PASSWORD RESET CONFIRMATION
// ==========================================

const sendPasswordResetConfirmation = async ({ to, name }) => {
  try {
    const sender = process.env.EMAIL_USER || SENDER_EMAIL;
    const recipient = to.trim();
    const subject = `Your password was updated`;

    const text = `Hi ${name || "there"},

Your Horizon account password was updated successfully.

If you made this change, you can safely ignore this notification.
If you did not authorize this change, please contact our support team immediately.

Thanks,
Horizon Security
`;

    const bodyHtml = `
      <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">
        Password Updated
      </h2>
      <p style="margin: 0 0 14px; font-size: 14px; color: #475569;">
        Hi ${name || "there"}, your account password was changed successfully.
      </p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        If you did not authorize this change, please contact our support team immediately.
      </p>
    `;

    const html = wrapCleanHtml({ title: subject, bodyHtml });

    const info = await transporter.sendMail({
      from: `"Horizon" <${sender}>`,
      to: recipient,
      subject,
      text,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send password reset confirmation to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendDepositEmail,
  sendWithdrawalEmail,
  sendTicketEmail,
  sendPasswordResetConfirmation,
};
