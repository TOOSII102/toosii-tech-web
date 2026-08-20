import nodemailer from 'nodemailer'

  function getTransporter() {
    return nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  export async function sendPasswordResetEmail(toEmail, resetLink) {
    const transporter = getTransporter()

    await transporter.sendMail({
      from:    `"Toosii Tech Admin" <${process.env.SMTP_USER}>`,
      to:      toEmail,
      subject: '🔐 Toosii Tech Admin — Password Reset',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#07070e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:520px;margin:40px auto;padding:40px 32px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;">
            <div style="text-align:center;margin-bottom:28px;">
              <span style="font-size:2rem;">⚡</span>
              <h1 style="color:#fff;font-size:1.4rem;font-weight:800;margin:12px 0 4px;">Toosii Tech Admin</h1>
              <p style="color:#64748b;font-size:0.85rem;margin:0;text-transform:uppercase;letter-spacing:0.1em;">Password Reset Request</p>
            </div>

            <p style="color:#94a3b8;font-size:0.95rem;line-height:1.65;margin:0 0 24px;">
              Someone requested a password reset for your admin account. Click the button below to sign in. This link expires in <strong style="color:#e2e8f0;">15 minutes</strong>.
            </p>

            <div style="text-align:center;margin:28px 0;">
              <a href="${resetLink}"
                 style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#25d366,#128c7e);color:#000;font-size:0.95rem;font-weight:800;text-decoration:none;border-radius:10px;">
                Sign In to Dashboard →
              </a>
            </div>

            <p style="color:#475569;font-size:0.8rem;line-height:1.6;margin:24px 0 0;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
              If you didn't request this, you can safely ignore this email. Your password will not change.
            </p>
          </div>
        </body>
        </html>
      `,
    })
  }
  

export async function sendFeedbackEmail({ category, name, email, message }) {
  const transporter = getTransporter()
  await transporter.sendMail({
    from: `"Toosii Tech Feedback" <${process.env.SMTP_USER}>`,
    to: process.env.FEEDBACK_TO || process.env.SMTP_USER,
    replyTo: email || undefined,
    subject: `[Toosii feedback] ${category}`,
    text: `Name: ${name}\nEmail: ${email || 'Not provided'}\nCategory: ${category}\n\n${message}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Toosii Tech feedback</h2><p><strong>Category:</strong> ${category}</p><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email || 'Not provided'}</p><hr/><p>${message.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\\n', '<br/>')}</p></div>`,
  })
}
