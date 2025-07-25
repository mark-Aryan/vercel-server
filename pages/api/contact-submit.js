import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { fullName, email, phone, location, expertise, message } = req.body || {};

  if (!fullName || fullName.length < 2 ||
      !email || !email.includes('@') ||
      !phone || phone.replace(/\D/g, '').length < 10 ||
      !location || !expertise ||
      !message || message.length < 10) {
    return res.status(422).json({ error: 'Invalid or missing contact fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const html = `
      <div style="font-family:Arial,sans-serif;color:#333;line-height:1.5;">
        <h2 style="color:#2a6fad;border-bottom:2px solid #2a6fad;">📞 New Contact Submission</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:1rem;">
          <tr><th style="text-align:left;padding:8px;background:#f0f0f0;border:1px solid #ddd;">Full Name</th><td style="padding:8px;border:1px solid #ddd;">${fullName}</td></tr>
          <tr><th style="text-align:left;padding:8px;background:#f0f0f0;border:1px solid #ddd;">Email</th><td style="padding:8px;border:1px solid #ddd;">${email}</td></tr>
          <tr><th style="text-align:left;padding:8px;background:#f0f0f0;border:1px solid #ddd;">Phone</th><td style="padding:8px;border:1px solid #ddd;">${phone}</td></tr>
          <tr><th style="text-align:left;padding:8px;background:#f0f0f0;border:1px solid #ddd;">Location</th><td style="padding:8px;border:1px solid #ddd;">${location}</td></tr>
          <tr><th style="text-align:left;padding:8px;background:#f0f0f0;border:1px solid #ddd;">Expertise</th><td style="padding:8px;border:1px solid #ddd;">${expertise}</td></tr>
        </table>
        <h4 style="margin-top:1rem;color:#2a6fad;">💬 Message</h4>
        <p style="padding:8px;background:#f9f9f9;border:1px solid #ddd;">${message}</p>
      </div>`;

    const text = `New Contact Submission\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nLocation: ${location}\nExpertise: ${expertise}\nMessage: ${message}`;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.TO_SMS_EMAIL,
      subject: 'New Contact Request',
      text,
      html,
    });

    return res.status(200).json({ message: 'Contact form sent successfully' });
  } catch (err) {
    console.error('[Contact Error]', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
