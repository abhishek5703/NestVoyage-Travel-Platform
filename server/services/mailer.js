const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(
      "SMTP is not configured. Add SMTP_USER and SMTP_PASS to server/.env."
    );
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") === "true",
    auth: { user, pass }
  });

  return transporter;
}

async function sendPasswordOtpEmail({ to, otp }) {
  const from = process.env.SMTP_FROM || `NestVoyage <${process.env.SMTP_USER}>`;
  return getTransporter().sendMail({
    from,
    to,
    subject: "Your NestVoyage password reset code",
    text: `Your NestVoyage verification code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#172033">
        <div style="font-size:24px;font-weight:800;margin-bottom:12px">Nest<span style="color:#0f766e">Voyage</span></div>
        <h2 style="margin:0 0 10px">Password reset verification</h2>
        <p style="color:#64748b;line-height:1.6">Use the verification code below to reset your NestVoyage password.</p>
        <div style="font-size:34px;letter-spacing:9px;font-weight:800;text-align:center;padding:20px 12px;background:#f1f5f9;border-radius:16px;margin:24px 0">${otp}</div>
        <p style="color:#64748b;font-size:13px;line-height:1.6">This code expires in 10 minutes. Never share this code with anyone.</p>
      </div>
    `
  });
}

module.exports = { sendPasswordOtpEmail };
