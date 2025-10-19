import nodemailer from 'nodemailer';
import * as yup from 'yup';

// HTML Entity Encoding to prevent XSS and display issues
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

// Validation schema with strict patterns
const contactSchema = yup.object({
  fullName: yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .test('no-numbers', 'Name cannot contain numbers', value => !/\d/.test(value))
    .test('real-name', 'Please enter a valid name', value => {
      // Check for common gibberish patterns
      if (!value) return false;
      const words = value.trim().split(/\s+/);
      // Each word should have at least one vowel
      return words.every(word => /[aeiouAEIOU]/.test(word));
    })
    .required('Full name is required'),
  
  email: yup.string()
    .trim()
    .email('Invalid email format')
    .matches(
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Invalid email format'
    )
    .required('Email is required'),
  
  phone: yup.string()
    .trim()
    .matches(/^\d{10}$/, 'Phone must be exactly 10 digits')
    .required('Phone is required'),
  
  location: yup.string()
    .trim()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location cannot exceed 100 characters')
    .matches(/^[a-zA-Z0-9\s,.-]+$/, 'Location contains invalid characters')
    .test('real-location', 'Please enter a valid location', value => {
      // Check for vowels to avoid gibberish
      return value && /[aeiouAEIOU]/.test(value);
    })
    .required('Location is required'),
  
  expertise: yup.string()
    .oneOf(
      ['engineering', 'construction', 'architecture', 'design', 'other'],
      'Invalid expertise selection'
    )
    .required('Expertise is required'),
  
  message: yup.string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message cannot exceed 500 characters')
    .test('has-vowels', 'Please enter a meaningful message', value => {
      return value && /[aeiouAEIOU]/.test(value);
    })
    .required('Message is required')
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
    // Validate input with yup
    const validatedData = await contactSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    const { fullName, email, phone, location, expertise, message } = validatedData;

    // Escape HTML to prevent XSS and display issues
    const safeName = escapeHtml(fullName);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeLocation = escapeHtml(location);
    const safeExpertise = escapeHtml(expertise);
    const safeMessage = escapeHtml(message);

    // Build HTML email
    const html = `
      <div style="font-family:Arial,sans-serif;color:#333;line-height:1.5;max-width:600px;">
        <h2 style="color:#2a6fad;border-bottom:2px solid #2a6fad;padding-bottom:10px;">📞 New Contact Submission</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:1rem;">
          <tr>
            <th style="text-align:left;padding:12px;background:#f0f0f0;border:1px solid #ddd;width:30%;">Full Name</th>
            <td style="padding:12px;border:1px solid #ddd;">${safeName}</td>
          </tr>
          <tr>
            <th style="text-align:left;padding:12px;background:#f0f0f0;border:1px solid #ddd;">Email</th>
            <td style="padding:12px;border:1px solid #ddd;">${safeEmail}</td>
          </tr>
          <tr>
            <th style="text-align:left;padding:12px;background:#f0f0f0;border:1px solid #ddd;">Phone</th>
            <td style="padding:12px;border:1px solid #ddd;">${safePhone}</td>
          </tr>
          <tr>
            <th style="text-align:left;padding:12px;background:#f0f0f0;border:1px solid #ddd;">Location</th>
            <td style="padding:12px;border:1px solid #ddd;">${safeLocation}</td>
          </tr>
          <tr>
            <th style="text-align:left;padding:12px;background:#f0f0f0;border:1px solid #ddd;">Expertise</th>
            <td style="padding:12px;border:1px solid #ddd;text-transform:capitalize;">${safeExpertise}</td>
          </tr>
        </table>
        <h4 style="margin-top:1.5rem;color:#2a6fad;border-bottom:1px solid #ddd;padding-bottom:5px;">💬 Message</h4>
        <div style="padding:12px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;white-space:pre-wrap;">${safeMessage}</div>
        <p style="margin-top:1.5rem;font-size:0.9em;color:#666;">
          Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST
        </p>
      </div>`;

    // Plain text version
    const text = `
📞 New Contact Submission

Full Name: ${fullName}
Email: ${email}
Phone: ${phone}
Location: ${location}
Expertise: ${expertise}

💬 Message:
${message}

Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST
    `.trim();

    // Send email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.TO_SMS_EMAIL,
      subject: `New Contact: ${fullName} - ${expertise}`,
      text,
      html
    });

    return res.status(200).json({
      success: true,
      message: 'Contact form sent successfully'
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
    console.error('[Contact Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process contact form'
    });
  }
}
