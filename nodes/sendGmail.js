// Equivalent of n8n node: "Send a message" (n8n-nodes-base.gmail)
// parameters: { sendTo: "tausif.farooqi@gmail.com",
//               subject: "={{ \"eBird Bird Report - \" + new Date().toISOString().slice(0, 10) }}",
//               message: "={{ $json.html }}" }
// Original credential: Gmail OAuth2. Reproduced with nodemailer's built-in Gmail OAuth2
// transport (no googleapis dependency needed — nodemailer exchanges the refresh token for an
// access token itself).
const nodemailer = require('nodemailer');

async function sendGmail(htmlBody) {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER_EMAIL, EMAIL_TO } = process.env;

  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_SENDER_EMAIL) {
    throw new Error(
      'Missing Gmail OAuth2 environment variables (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER_EMAIL)'
    );
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: GMAIL_SENDER_EMAIL,
      clientId: GMAIL_CLIENT_ID,
      clientSecret: GMAIL_CLIENT_SECRET,
      refreshToken: GMAIL_REFRESH_TOKEN,
    },
  });

  const subject = `eBird Bird Report - ${new Date().toISOString().slice(0, 10)}`;
  const to = EMAIL_TO || 'tausif.farooqi@gmail.com';

  await transporter.sendMail({
    from: GMAIL_SENDER_EMAIL,
    to,
    subject,
    html: htmlBody,
  });
}

module.exports = { sendGmail };
