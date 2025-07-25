import nodemailer from 'nodemailer'
import * as yup from 'yup'

// Validation schema
const schema = yup.object({
  name:  yup.string().trim().min(3).max(50).required(),
  phone: yup.string().matches(/^\d{10}$/).required(),
  email: yup.string()
            .email()
            .matches(/^[^@]+@(?:gmail\.com|hotmail\.com|live\.com|outlook\.com)$/)
            .required(),
})

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:    465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

export default async function handler(req, res) {
  // 1) CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 2) Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  // 3) Only POST from here on
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    // 4) Validate input
    const { name, phone, email } = await schema.validate(req.body, { abortEarly: false })

    // 5) Build HTML + text
    const html = `
      <div style="font-family:Arial,sans-serif;color:#333;line-height:1.5;">
        <h2 style="color:#2a6fad;border-bottom:2px solid #2a6fad;">📩 New Quotation Request</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:1rem;">
          <tr><th style="...">Name</th><td style="...">${name}</td></tr>
          <tr><th style="...">Phone</th><td style="...">${phone}</td></tr>
          <tr><th style="...">Email</th><td style="...">${email}</td></tr>
        </table>
        <p style="margin-top:1.5rem;">Thank you for choosing our services. We will reach out shortly.</p>
      </div>
    `
    const text =
      `📩 New Quotation Request\n` +
      `Name: ${name}\n` +
      `Phone: ${phone}\n` +
      `Email: ${email}\n` +
      `Thank you for choosing our services.`

    // 6) Send via Gmail SMTP
    await transporter.sendMail({
      from:    process.env.GMAIL_USER,
      to:      process.env.TO_SMS_EMAIL,
      subject: 'Quotation Request',
      text,
      html,
    })

    return res.status(200).json({ message: 'Quotation sent successfully' })
  }
  catch (err) {
    // 422 = validation errors
    if (err.name === 'ValidationError') {
      const errors = err.inner.map(e => ({ field: e.path, message: e.message }))
      return res.status(422).json({ errors })
    }
    console.error('Internal Error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
