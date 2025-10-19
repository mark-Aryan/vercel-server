import nodemailer from 'nodemailer';

// HTML Entity Encoding to prevent XSS
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

// Validation function (no external dependencies)
function validateContactForm(data) {
  const errors = [];
  
  // Full Name validation
  if (!data.fullName || typeof data.fullName !== 'string') {
    errors.push({ field: 'fullName', message: 'Full name is required' });
  } else {
    const name = data.fullName.trim();
    if (name.length < 2) {
      errors.push({ field: 'fullName', message: 'Name must be at least 2 characters' });
    } else if (name.length > 50) {
      errors.push({ field: 'fullName', message: 'Name cannot exceed 50 characters' });
    } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      errors.push({ field: 'fullName', message: 'Name can only contain letters, spaces, hyphens, and apostrophes' });
    } else if (!/[aeiouAEIOU]/.test(name)) {
      errors.push({ field: 'fullName', message: 'Please enter a valid name' });
    } else if (/\d/.test(name)) {
      errors.push({ field: 'fullName', message: 'Name cannot contain numbers' });
    }
  }
  
  // Email validation
  if (!data.email || typeof data.email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else {
    const email = data.email.trim();
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }
  }
  
  // Phone validation
  if (!data.phone || typeof data.phone !== 'string') {
    errors.push({ field: 'phone', message: 'Phone is required' });
  } else {
    const phone = data.phone.trim();
    if (!/^\d{10}$/.test(phone)) {
      errors.push({ field: 'phone', message: 'Phone must be exactly 10 digits' });
    }
  }
  
  // Location validation
  if (!data.location || typeof data.location !== 'string') {
    errors.push({ field: 'location', message: 'Location is required' });
  } else {
    const location = data.location.trim();
    if (location.length < 2) {
      errors.push({ field: 'location', message: 'Location must be at least 2 characters' });
    } else if (location.length > 100) {
      errors.push({ field: 'location', message: 'Location cannot exceed 100 characters' });
    } else if (!/^[a-zA-Z0-9\s,.-]+$/.test(location)) {
      errors.push({ field: 'location', message: 'Location contains invalid characters' });
    } else if (!/[aeiouAEIOU]/.test(location)) {
      errors.push({ field: 'location', message: 'Please enter a valid location' });
    }
  }
  
  // Expertise validation
  const validExpertise = ['engineering', 'construction', 'architecture', 'design', 'other'];
  if (!data.expertise || !validExpertise.includes(data.expertise)) {
    errors.push({ field: 'expertise', message: 'Please select a valid expertise' });
  }
  
  // Message validation
  if (!data.message || typeof data.message !== 'string') {
    errors.push({ field: 'message', message: 'Message is required' });
  } else {
    const message = data.message.trim();
    if (message.length < 10) {
      errors.push({ field: 'message', message: 'Message must be at least 10 characters' });
    } else if (message.length > 500) {
      errors.push({ field: 'message', message: 'Message cannot exceed 500 characters' });
    } else if (!/[aeiouAEIOU]/.test(message)) {
      errors.push({ field: 'message', message: 'Please enter a meaningful message' });
    }
  }
  
  return errors;
}

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
    // Log request body for debugging
    console.log('[Contact Form] Received data:', JSON.stringify(req.body, null, 2));

    // Check environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || !process.env.TO_SMS_EMAIL) {
      console.error('[Contact Form] Missing environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Email service not properly configured'
      });
    }

    // Validate input
    const validationErrors = validateContactForm(req.body);
    
    if (validationErrors.length > 0) {
      console.log('[Contact Form] Validation errors:', validationErrors);
      return res.status(422).json({
        error: 'Validation failed',
        errors: validationErrors
      });
    }

    // Extract and sanitize data
    const fullName = req.body.fullName.trim();
    const email = req.body.email.trim();
    const phone = req.body.phone.trim();
    const location = req.body.location.trim();
    const expertise = req.body.expertise;
    const message = req.body.message.trim();

    // Escape HTML
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

    console.log('[Contact Form] Attempting to send email to:', process.env.TO_SMS_EMAIL);

    // Send email
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.TO_SMS_EMAIL,
      subject: `New Contact: ${fullName} - ${expertise}`,
      text,
      html
    });

    console.log('[Contact Form] Email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Contact form sent successfully'
    });

  } catch (err) {
    // Detailed error logging
    console.error('[Contact Form] Error occurred:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    // Check for specific SMTP errors
    if (err.code === 'EAUTH') {
      return res.status(500).json({
        error: 'Email authentication failed',
        message: 'Please check GMAIL_USER and GMAIL_PASS environment variables'
      });
    }
    
    if (err.code === 'ECONNECTION') {
      return res.status(500).json({
        error: 'Email connection failed',
        message: 'Could not connect to email server'
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process contact form',
      details: err.message
    });
  }
}
