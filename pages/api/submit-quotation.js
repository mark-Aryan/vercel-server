import nodemailer from 'nodemailer';
import * as yup from 'yup';

// Validation schema
const quotationSchema = yup.object({
  name: yup.string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .required('Name is required'),
  phone: yup.string()
    .matches(/^\d{10}$/, 'Phone must be exactly 10 digits')
    .required('Phone is required'),
  email: yup.string()
    .email('Invalid email address')
    .matches(/^[^@]+@(?:gmail\.com|hotmail\.com|live\.com|outlook\.com)$/, 'Email domain must be gmail.com, hotmail.com, live.com, or outlook.com')
    .required('Email is required'),
});

// Create Gmail SMTP transporter
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
    // Validate request body
    const validated = await quotationSchema.validate(req.body, { abortEarly: false });

    // Compose message text
    const subject = 'Quotation Request';
    const text = `New Quotation Request:\n` +
      `Name: ${validated.name}\n` +
      `Phone: ${validated.phone}\n` +
      `Email: ${validated.email}`;

    // Send email/SMS
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.TO_SMS_EMAIL,
      subject,
      text,
    });

    return res.status(200).json({ message: 'Quotation sent successfully' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = err.inner.map(e => ({ field: e.path, message: e.message }));
      return res.status(422).json({ errors });
    }
    console.error('Internal Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
