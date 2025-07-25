import nodemailer from 'nodemailer';

// create reusable transporter using Gmail SMTP
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
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, phone, email } = req.body;
  if (!name || !phone || !email) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // construct message
  const subject = 'Quotation Request';
  const text = `New Quotation Request:\nName: ${name}\nPhone: ${phone}\nEmail: ${email}`;

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.TO_SMS_EMAIL,
      subject,
      text,
    });
    return res.status(200).json({ message: 'Quotation sent successfully' });
  } catch (error) {
    console.error('SMTP Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
