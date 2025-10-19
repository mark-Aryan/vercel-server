import nodemailer from 'nodemailer';
import * as yup from 'yup';

// HTML Entity Encoding
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Validation schema with anti-gibberish checks
const schema = yup.object({
  name: yup.string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .test('no-numbers', 'Name cannot contain numbers', value => !/\d/.test(value))
    .test('has-vowels', 'Please enter a valid name', value => {
      if (!value) return false;
      const words = value.trim().split(/\s+/);
      return words.every(word => /[aeiouAEIOU]/.test(word));
    })
    .required('Name is required'),
  
  phone: yup.string()
    .trim()
    .matches(/^\d{10}$/, 'Phone must be exactly 10 digits')
    .required('Phone is required'),
  
  email: yup.string()
    .trim()
    .email('Invalid email format')
    .matches(
      /^[a-zA-Z0-9._-]+@(gmail\.com|hotmail\.com|live\.com|outlook\.com)$/i,
      'Email must be from gmail.com, hotmail.com, live.com, or outlook.com'
    )
    .required('Email is required')
});

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Validate input
    const validatedData = await schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    const { name, phone, email } = validatedData;

    // Escape HTML
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);

    // Build HTML email
    const html = `
      <div style="font-family:Arial,sans-serif;color:#333;line-height:1.5;max-width:600px;">
        <h2 style="color:#2a6fad;border-bottom:2px solid #2a6fad;padding-bottom:10px;">📩 New Quotation Request</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:1rem;">
          <tr>
            <th style="text-align:left;padding:12px;background:#f0f0f0;border:1px solid #ddd;width:30%;">Name</th>
            <td style="padding:12px;border:1px solid #ddd;">${safeName}</td>
          </tr>
          <tr>
            <th style="text-align:left;padding:12px;background:#f0f0f0;border:1px solid #ddd;">Phone</th>
            <td style="padding:12px;border:1px solid #ddd;">${safePhone}</td>
          </tr>
          <tr>
            <th style="text-align:left;padding:12px;background:#f0f0f0;border:1px solid #ddd;">Email</th>
            <td style="padding:12px;border:1px solid #ddd;">${safeEmail}</td>
          </tr>
        </table>
        <p style="margin-top:1.5rem;color:#555;">
          Thank you for choosing our services. We will reach out shortly with your quotation.
        </p>
        <p style="margin-top:1rem;font-size:0.9em;color:#666;">
          Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST
        </p>
      </div>`;

    // Plain text version
    const text = `
📩 New Quotation Request

Name: ${name}
Phone: ${phone}
Email: ${email}

Thank you for choosing our services. We will reach out shortly with your quotation.

Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST
    `.trim();

    // Send via Gmail SMTP
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.TO_SMS_EMAIL,
      subject: `Quotation Request: ${name}`,
      text,
      html
    });

    return res.status(200).json({
      success: true,
      message: 'Quotation sent successfully'
    });

  } catch (err) {
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = err.inner.map(e => ({
        field: e.path,
        message: e.message
      }));
      
      console.error('[Validation Error]', errors);
      
      return res.status(422).json({
        error: 'Validation failed',
        errors: errors
      });
    }

    // Handle other errors
    console.error('[Quotation Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process quotation request'
    });
  }
}
