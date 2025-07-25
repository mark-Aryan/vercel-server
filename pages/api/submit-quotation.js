import nodemailer from 'nodemailer';
import * as yup from 'yup';

// Validation schema
const schema = yup.object({
  name: yup.string().trim().min(3).max(50).required(),
  phone: yup.string().matches(/^\d{10}$/).required(),
  email: yup.string().email().matches(/^[^@]+@(?:gmail\.com|hotmail\.com|live\.com|outlook\.com)$/).required(),
});

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Validate
    const { name, phone, email } = await schema.validate(req.body, { abortEarly: false });

    // Create decorated HTML message
    const html = `
      <div style="font-family:Arial,sans-serif;color:#333;line-height:1.5;">
        <h2 style="color:#2a6fad;border-bottom:2px solid #2a6fad;">📩 New Quotation Request</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:1rem;">
          <tr>
            <th style="text-align:left;padding:8px;background:#f0f0f0;border:1px solid #ddd;">Name</th>
            <td style="padding:8px;border:1px solid #ddd;">${name}</td>
          </tr>
          <tr>
            <th style="text-align:left;padding:8px;background:#f0f0f0;border:1px solid #ddd;">Phone</th>
            <td style="padding:8px;border:1px solid #ddd;">${phone}</td>
          </tr>
          <tr>
            <th style="text-align:left;padding:8px;background:#f0f0f0;border:1px solid #ddd;">Email</th>
            <td style="padding:8px;border:1px solid #ddd;">${email}</td>
          </tr>
        </table>
        <p style="margin-top:1.5rem;">Thank you for choosing our services. We will reach out to you shortly with your quotation.</p>
      </div>
    `;

    // Fallback plain text
    const text = 
      `📩 New Quotation Request\n` +
      `Name: ${name}\n` +
      `Phone: ${phone}\n` +
      `Email: ${email}\n` +
      `Thank you for choosing our services.`;

    // Send mail
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.TO_SMS_EMAIL,
      subject: 'Quotation Request',
      text,
      html,
    });

    return res.status(200).json({ message: 'Quotation sent successfully' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errs = err.inner.map(e => ({ field: e.path, message: e.message }));
      return res.status(422).json({ errors: errs });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
