import sendgrid from '@sendgrid/mail';
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, phone, email } = req.body;
  if (!name || !phone || !email) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const text = `New Quotation Request:\nName: ${name}\nPhone: ${phone}\nEmail: ${email}`;
  try {
    await sendgrid.send({
      to: process.env.TO_SMS_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: 'Quotation Request',
      text,
    });
    return res.status(200).json({ message: 'Quotation sent successfully' });
  } catch (error) {
    console.error('SendGrid Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
