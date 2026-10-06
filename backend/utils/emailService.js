const nodemailer = require("nodemailer");

const SENDER_EMAIL = process.env.EMAIL_USER || "";
const SENDER_PASS = process.env.EMAIL_PASS || "";

const COMPANY_NAME = "Horizon Cap World";
const COMPANY_LOGO_URL =
  process.env.COMPANY_LOGO_URL ||
  "https://res.cloudinary.com/pt6ikhli/image/upload/w_240,c_limit,q_auto,f_auto/v1790597889/horizoncap/branding/horizon_cap_world_logo.jpg";

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
if (SENDER_EMAIL && SENDER_PASS) {
  transporter.verify((error) => {
    if (error) {
      console.error("[Email Service] Gmail SMTP verification failed:", error.message);
    } else {
      console.log(`[Email Service] Gmail SMTP connected as ${SENDER_EMAIL} (Inbox Optimized)`);
    }
  });
} else {
  console.warn("[Email Service] EMAIL_USER or EMAIL_PASS not configured. Outgoing emails will be skipped.");
}

/**
 * Clean, lightweight, spam-free HTML email wrapper
 * - Prominent official logo with rounded luxury borders
 * - Full company branding: "HORIZON CAP WORLD"
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
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; padding: 32px 28px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);">
          <!-- Brand Header with Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid #f1f5f9; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; text-align: center;">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <img src="${COMPANY_LOGO_URL}" alt="${COMPANY_NAME} Logo" width="88" height="88" style="display: block; width: 88px; height: 88px; border-radius: 18px; object-fit: cover; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,0.14); border: 1px solid #e2e8f0;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      HORIZON <span style="color: #d97706;">CAP WORLD</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 3px;">
                    <span style="font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">
                      Global Capital & Wealth Network
                    </span>
                  </td>
                </tr>
              </table>
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
              <p style="margin: 0 0 6px; font-weight: 600; color: #64748b;">${COMPANY_NAME} &bull; Automated Notification</p>
              <p style="margin: 0 0 4px;">&copy; 2026 ${COMPANY_NAME}. All rights reserved.</p>
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
// Standard subject: "<code> is your verification code"
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
${COMPANY_NAME} Team
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
      from: `"${COMPANY_NAME}" <${sender}>`,
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
    const subject = `Welcome to ${COMPANY_NAME}, ${name || "Investor"}`;

    const text = `Hi ${name || "Investor"},

Welcome to ${COMPANY_NAME}! Your account is now active and verified.

Account Summary:
- Account ID: ${customId}
- Email: ${recipient}
- Sponsor ID: ${sponsorId || "HORIZON-HQ"}

Sign in to your account:
https://horizoncapworlds.com/login

If you have any questions or need assistance, feel free to reply to our support desk.

Thanks,
${COMPANY_NAME} Team
`;

    const bodyHtml = `
      <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">
        Welcome to ${COMPANY_NAME}!
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
      from: `"${COMPANY_NAME}" <${sender}>`,
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
    const subject = `Deposit confirmation: #${transactionId} - ${COMPANY_NAME}`;

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
${COMPANY_NAME} Team
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
      from: `"${COMPANY_NAME}" <${sender}>`,
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
  txHash = "",
}) => {
  try {
    const sender = process.env.EMAIL_USER || SENDER_EMAIL;
    const recipient = to.trim();
    const isApproved = status === "Approved" || status === "Completed";
    const statusText = isApproved ? "Completed" : "Submitted";
    const subject = `Withdrawal confirmation: #${transactionId} - ${COMPANY_NAME}`;

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
${COMPANY_NAME} Team
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
        ${
          txHash
            ? `<tr>
          <td style="padding: 6px 0; color: #64748b;">Blockchain Hash:</td>
          <td align="right" style="padding: 6px 0; font-weight: 600; color: #2563eb; font-family: monospace; font-size: 11px;">
            <a href="https://bscscan.com/tx/${txHash}" target="_blank" style="color: #2563eb; text-decoration: underline;">
              ${txHash.slice(0, 10)}...${txHash.slice(-8)}
            </a>
          </td>
        </tr>`
            : ""
        }
      </table>
    `;

    const html = wrapCleanHtml({ title: subject, bodyHtml });

    const info = await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${sender}>`,
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
      ? `Update on ticket #${ticketId}: ${ticketSubject} - ${COMPANY_NAME}`
      : `Ticket #${ticketId} created: ${ticketSubject} - ${COMPANY_NAME}`;

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
${COMPANY_NAME} Support
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
      from: `"${COMPANY_NAME}" <${sender}>`,
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
    const subject = `Your password was updated - ${COMPANY_NAME}`;

    const text = `Hi ${name || "there"},

Your ${COMPANY_NAME} account password was updated successfully.

If you made this change, you can safely ignore this notification.
If you did not authorize this change, please contact our support team immediately.

Thanks,
${COMPANY_NAME} Security
`;

    const bodyHtml = `
      <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">
        Password Updated
      </h2>
      <p style="margin: 0 0 14px; font-size: 14px; color: #475569;">
        Hi ${name || "there"}, your ${COMPANY_NAME} account password was changed successfully.
      </p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        If you did not authorize this change, please contact our support team immediately.
      </p>
    `;

    const html = wrapCleanHtml({ title: subject, bodyHtml });

    const info = await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${sender}>`,
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

// ==========================================
// 7. MONTHLY TRANSACTION STATEMENT EMAIL
// ==========================================

const sendMonthlyStatementEmail = async ({
  to,
  name,
  customId,
  periodName,
  startDate,
  endDate,
  summary = {},
  transactions = [],
}) => {
  try {
    const sender = process.env.EMAIL_USER || SENDER_EMAIL;
    const recipient = to.trim();
    const subject = `Monthly Transaction Statement: ${periodName} - ${COMPANY_NAME}`;

    const {
      totalDeposits = 0,
      totalWithdrawals = 0,
      totalEarnings = 0,
      endingBalance = 0,
      transactionCount = 0,
    } = summary;

    const text = `Dear ${name || "Investor"},

Please find your official Monthly Transaction Statement for ${periodName} (${startDate} to ${endDate}) with ${COMPANY_NAME}.

Account Summary:
- Investor: ${name || "Investor"}
- Account ID: ${customId || "N/A"}
- Statement Period: ${periodName} (${startDate} - ${endDate})
- Total Deposits: $${Number(totalDeposits).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
- Total Withdrawals: $${Number(totalWithdrawals).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
- Total Returns / Yield: $${Number(totalEarnings).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
- Current Balance: $${Number(endingBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
- Recorded Transactions: ${transactionCount}

To review your complete real-time ledger, please sign in to your dashboard:
https://horizoncapworlds.com/transactions

Sincerely,
${COMPANY_NAME} Treasury & Accounting Desk
`;

    // Construct transaction table rows
    let tableRowsHtml = "";
    if (transactions && transactions.length > 0) {
      // Limit to 40 in email to ensure it stays well under 100KB email size limit
      const displayedTx = transactions.slice(0, 40);
      tableRowsHtml = displayedTx
        .map((t, idx) => {
          const isDeposit = t.type === "Deposit";
          const isWithdrawal = t.type === "Withdrawal";
          const isReturn = t.type === "ROI Return" || t.type?.includes("Bonus");
          const amtColor = isDeposit ? "#059669" : isWithdrawal ? "#dc2626" : isReturn ? "#d97706" : "#0f172a";
          const prefix = isDeposit ? "+" : isWithdrawal ? "-" : isReturn ? "+" : "";
          const statusBg =
            t.status === "Approved" || t.status === "Completed"
              ? "#dcfce7; color: #166534;"
              : t.status === "Pending"
              ? "#fef3c7; color: #92400e;"
              : "#fee2e2; color: #991b1b;";

          const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
          return `
            <tr style="background-color: ${bg}; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 8px; font-size: 11px; color: #64748b; font-family: monospace;">${t.date || "N/A"}</td>
              <td style="padding: 10px 8px; font-size: 11px; font-weight: 600; color: #0f172a; font-family: monospace;">${t.customId || "TRX"}</td>
              <td style="padding: 10px 8px; font-size: 11px; color: #334155;">${t.type}</td>
              <td align="right" style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: ${amtColor}; font-family: monospace;">
                ${prefix}$${Number(t.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td align="right" style="padding: 10px 8px;">
                <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 10px; font-weight: 700; background-color: ${statusBg}">
                  ${t.status || "Completed"}
                </span>
              </td>
            </tr>
          `;
        })
        .join("");

      if (transactions.length > 40) {
        tableRowsHtml += `
          <tr>
            <td colspan="5" align="center" style="padding: 12px; font-size: 11px; color: #64748b; background-color: #f8fafc;">
              Showing 40 of ${transactions.length} transactions for this period. View complete history on your dashboard.
            </td>
          </tr>
        `;
      }
    } else {
      tableRowsHtml = `
        <tr>
          <td colspan="5" align="center" style="padding: 24px; font-size: 12px; color: #94a3b8; font-style: italic;">
            No transaction records were logged during this monthly period. Your portfolio balance remains secured.
          </td>
        </tr>
      `;
    }

    const bodyHtml = `
      <div style="border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
          Official Monthly Statement
        </span>
        <h2 style="margin: 8px 0 4px; font-size: 20px; font-weight: 800; color: #0f172a;">
          Account Statement: ${periodName}
        </h2>
        <p style="margin: 0; font-size: 12px; color: #64748b;">
          Statement Period: <strong>${startDate}</strong> &ndash; <strong>${endDate}</strong>
        </p>
      </div>

      <!-- Account Details Grid -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; font-size: 12px;">
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Account Holder:</td>
          <td align="right" style="padding: 4px 0; font-weight: 700; color: #0f172a;">${name || "Investor"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Account ID:</td>
          <td align="right" style="padding: 4px 0; font-weight: 700; color: #0f172a; font-family: monospace;">${customId || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Registered Email:</td>
          <td align="right" style="padding: 4px 0; font-weight: 600; color: #0f172a;">${recipient}</td>
        </tr>
      </table>

      <!-- 4 Financial Summary Cards -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
        <tr>
          <td width="48%" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px; vertical-align: top;">
            <p style="margin: 0; font-size: 11px; font-weight: 600; color: #065f46; text-transform: uppercase;">Total Deposits</p>
            <p style="margin: 4px 0 0; font-size: 17px; font-weight: 800; color: #059669; font-family: monospace;">
              +$${Number(totalDeposits).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; vertical-align: top;">
            <p style="margin: 0; font-size: 11px; font-weight: 600; color: #991b1b; text-transform: uppercase;">Total Withdrawals</p>
            <p style="margin: 4px 0 0; font-size: 17px; font-weight: 800; color: #dc2626; font-family: monospace;">
              -$${Number(totalWithdrawals).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </td>
        </tr>
        <tr><td colspan="3" height="8"></td></tr>
        <tr>
          <td width="48%" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; vertical-align: top;">
            <p style="margin: 0; font-size: 11px; font-weight: 600; color: #92400e; text-transform: uppercase;">Yield & Bonuses</p>
            <p style="margin: 4px 0 0; font-size: 17px; font-weight: 800; color: #d97706; font-family: monospace;">
              +$${Number(totalEarnings).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; vertical-align: top;">
            <p style="margin: 0; font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase;">Earning Wallet</p>
            <p style="margin: 4px 0 0; font-size: 17px; font-weight: 800; color: #0f172a; font-family: monospace;">
              $${Number(endingBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </td>
        </tr>
      </table>

      <!-- Itemized Ledger -->
      <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #0f172a;">
        Monthly Activity Ledger (${transactionCount} transactions)
      </h3>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left;">
            <th style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #475569;">Date</th>
            <th style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #475569;">Ref</th>
            <th style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #475569;">Type</th>
            <th align="right" style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #475569;">Amount</th>
            <th align="right" style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #475569;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <!-- Call to Action -->
      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="https://horizoncapworlds.com/transactions" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
          View Complete Live Ledger &rarr;
        </a>
      </div>

      <p style="margin: 16px 0 0; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
        This statement is generated automatically by Horizon Cap World Treasury Systems on the 1st of each month.
        Please retain this notice for your permanent accounting records.
      </p>
    `;

    const html = wrapCleanHtml({ title: subject, bodyHtml });

    const info = await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${sender}>`,
      to: recipient,
      subject,
      text,
      html,
    });

    console.log(`[Email Service] Monthly statement delivered to ${recipient} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send monthly statement to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Contact / Institutional Inquiry Notification to Admin
 * Recipient: tradex615@gmail.com
 */
const sendContactInquiryEmail = async ({ name, email, sector, message, ip, createdAt }) => {
  try {
    const adminRecipient = process.env.CONTACT_RECEIVER_EMAIL || process.env.EMAIL_USER;
    if (!adminRecipient) {
      console.warn("[Email Service] Neither CONTACT_RECEIVER_EMAIL nor EMAIL_USER is defined. Skipping inquiry email.");
      return { success: false, error: "Receiver email not configured" };
    }
    const subject = `🔔 [New Inquiry] ${name} - ${sector || "General Inquiry"}`;
    const dateStr = createdAt
      ? new Date(createdAt).toLocaleString("en-US", { timeZone: "UTC", dateStyle: "full", timeStyle: "medium" }) + " (UTC)"
      : new Date().toUTCString();

    const bodyHtml = `
      <div style="margin-bottom: 24px; text-align: center;">
        <span style="display: inline-block; padding: 4px 14px; font-size: 11px; font-weight: 800; color: #92400e; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px;">
          Institutional Inquiry Received
        </span>
        <h2 style="margin: 12px 0 4px; font-size: 20px; font-weight: 700; color: #0f172a;">
          Connect with Horizon Form
        </h2>
        <p style="margin: 0; font-size: 13px; color: #64748b;">
          A visitor has submitted a direct contact inquiry from the official website.
        </p>
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px; font-size: 13px;">
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b; width: 35%;">Inquirer Name:</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Institutional Email:</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #2563eb;">
            <a href="mailto:${email}" style="color: #2563eb; text-decoration: underline;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Sector of Interest:</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #d97706;">${sector || "Renewable Energy"}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Submission Time:</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #334155;">${dateStr}</td>
        </tr>
        ${ip ? `
        <tr>
          <td style="padding: 12px 16px; font-weight: 600; color: #64748b;">Origin IP:</td>
          <td style="padding: 12px 16px; color: #64748b; font-family: monospace;">${ip}</td>
        </tr>` : ""}
      </table>

      <div style="margin-bottom: 24px;">
        <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Inquiry Note / Message:
        </span>
        <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #d97706; border-radius: 8px; padding: 16px; font-size: 13.5px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">
          ${message && message.trim() ? message : "(No additional message provided)"}
        </div>
      </div>

      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="mailto:${email}?subject=RE: Horizon Capital World Institutional Inquiry&body=Dear ${encodeURIComponent(name)},%0D%0A%0D%0AThank you for reaching out to Horizon Capital World regarding ${encodeURIComponent(sector || "our investment sectors")}.%0D%0A%0D%0A" style="display: inline-block; background-color: #d97706; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(217,119,6,0.25);">
          Reply to ${name} &rarr;
        </a>
      </div>
    `;

    const text = `New Institutional Inquiry:\n\nName: ${name}\nEmail: ${email}\nSector: ${sector}\nMessage: ${message || "N/A"}\nTime: ${dateStr}\nIP: ${ip || "N/A"}`;
    const html = wrapCleanHtml({ title: subject, bodyHtml });

    const info = await transporter.sendMail({
      from: `"${COMPANY_NAME} Inquiries" <${SENDER_EMAIL}>`,
      to: adminRecipient,
      replyTo: email,
      subject,
      text,
      html,
    });

    console.log(`[Email Service] Contact inquiry delivered to ${adminRecipient} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email Service] Failed to send contact inquiry email:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send acknowledgment email to user confirming receipt
 */
const sendInquiryConfirmationEmail = async ({ name, email, sector }) => {
  try {
    const subject = `Inquiry Received - ${COMPANY_NAME}`;
    const bodyHtml = `
      <div style="margin-bottom: 20px; text-align: center;">
        <h2 style="margin: 0 0 6px; font-size: 19px; font-weight: 700; color: #0f172a;">
          Thank You, ${name}
        </h2>
        <p style="margin: 0; font-size: 13px; color: #64748b;">
          We have received your inquiry regarding <strong>${sector || "Renewable Energy"}</strong>.
        </p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
        Our institutional partnerships and investor relations desk will review your submission and connect with you at this email address within 24 business hours.
      </div>

      <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
        If you have urgent questions, you can also reach us through your investor dashboard ticket system.
      </p>
    `;

    const text = `Dear ${name},\n\nThank you for connecting with Horizon Capital World. Your inquiry regarding ${sector || "our investment sectors"} has been received. Our team will review your message and reply promptly.\n\nBest regards,\nHorizon Capital World`;
    const html = wrapCleanHtml({ title: subject, bodyHtml });

    const info = await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${SENDER_EMAIL}>`,
      to: email,
      subject,
      text,
      html,
    });

    console.log(`[Email Service] Confirmation auto-responder delivered to ${email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`[Email Service] Confirmation email to ${email} skipped or failed:`, error.message);
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
  sendMonthlyStatementEmail,
  sendContactInquiryEmail,
  sendInquiryConfirmationEmail,
};
