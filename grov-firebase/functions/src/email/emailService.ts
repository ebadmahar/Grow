import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import * as nodemailer from 'nodemailer';
import { authenticateRequest, requireAdmin } from '../utils/auth';
import { getSecret } from '../utils/secrets';

interface SmtpMailerConfig {
  host: string;
  port: number;
  encryption: string;
  username: string;
  fromAddress: string;
  fromName: string;
}

/**
 * Sends an email using configured SMTP settings + credentials from Google Secret Manager.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  mailer = 'noreply',
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  mailer?: 'noreply' | 'security';
}): Promise<any> {
  const db = admin.firestore();
  const smtpSnap = await db.collection('config').doc('smtp').get();

  if (!smtpSnap.exists) {
    throw new Error('SMTP configuration doc config/smtp does not exist.');
  }

  const smtpData = smtpSnap.data() || {};
  const mailerConfig: SmtpMailerConfig = smtpData[mailer];

  if (!mailerConfig) {
    throw new Error(`Mailer configuration "${mailer}" not found in config/smtp.`);
  }

  // Retrieve password from Google Secret Manager (NEVER stored in Firestore)
  const secretKey = mailer === 'security' ? 'grov-smtp-security-password' : 'grov-smtp-noreply-password';
  const password = await getSecret(secretKey);

  const transporter = nodemailer.createTransport({
    host: mailerConfig.host,
    port: mailerConfig.port,
    secure: mailerConfig.encryption === 'ssl' || mailerConfig.port === 465,
    auth: {
      user: mailerConfig.username,
      pass: password,
    },
  });

  const mailOptions = {
    from: `"${mailerConfig.fromName}" <${mailerConfig.fromAddress}>`,
    to,
    subject,
    text: text || html.replace(/<[^>]*>?/gm, ''),
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[sendEmail] Message sent via ${mailer} to ${to}: ${info.messageId}`);
  return info;
}

/**
 * HTTP Endpoint: sendTestEmail
 * Privileged test endpoint for administrators to verify SMTP connectivity.
 */
export const sendTestEmail = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const auth = await authenticateRequest(req);
    requireAdmin(auth);

    const { recipientEmail, mailerType } = req.body;
    const targetEmail = recipientEmail || auth.email;
    const selectedMailer = mailerType === 'security' ? 'security' : 'noreply';

    const info = await sendEmail({
      to: targetEmail,
      subject: `[Grōv] SMTP Test Message (${selectedMailer})`,
      html: `
        <h2>Grōv Platform SMTP Verification</h2>
        <p>This is a test notification confirming that the Grōv SMTP mailer (<strong>${selectedMailer}</strong>) is functioning correctly.</p>
        <p><strong>Initiated by:</strong> ${auth.name || auth.email}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
      mailer: selectedMailer,
    });

    res.status(200).json({
      success: true,
      message: `Test email dispatched to ${targetEmail} successfully.`,
      data: {
        messageId: info.messageId,
        recipient: targetEmail,
        mailer: selectedMailer,
      },
    });
  } catch (error: any) {
    console.error('[sendTestEmail] Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
