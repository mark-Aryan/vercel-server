# Quotation Receiver API on Vercel (Gmail SMTP)

A Next.js API to receive form data, validate it, and forward via Gmail SMTP (free SMS gateway support).

## Setup

1. **Clone** the repository:
   ```bash
   git clone https://github.com/mark-Aryan/vercel-server.git
   ```
2. **Install** dependencies:
   ```bash
   cd vercel-server
   npm install
   ```
3. **Configure** environment:
   - Copy `.env.example` to `.env.local`
   - Fill in:
     - `GMAIL_USER`: your Gmail address
     - `GMAIL_PASS`: app-specific password (create after enabling 2FA)
     - `TO_SMS_EMAIL`: e.g. `1234567890@txt.att.net`
4. **Run locally**:
   ```bash
   npm run dev
   ```
5. **Deploy on Vercel**:
   - Connect your repo
   - Add env vars in Vercel dashboard under Settings → Environment Variables
   - Trigger a deploy

## API

### POST `/api/submit-quotation`

- **Body**: `{ name, phone, email }`
- **Success (200)**: `{ message: 'Quotation sent successfully' }`
- **Validation Error (422)**: `{ errors: [{ field, message }] }`
- **Method Not Allowed (405)**
- **Server Error (500)**

---
