# Quotation Receiver API on Vercel (Gmail SMTP)

This Next.js project exposes an API endpoint to receive quotation form submissions and forward them via Gmail SMTP to your designated email (e.g., email-to-SMS gateway for SMS delivery).

## Setup
1. Clone this repository
2. Run `npm install`
3. Copy `.env.example` to `.env.local` and set:
   - `GMAIL_USER`: Your Gmail address
   - `GMAIL_PASS`: App-specific password (generate via Google Account > Security)
   - `TO_SMS_EMAIL`: Destination email or SMS gateway address

4. Deploy to Vercel or run locally with:

   ```bash
   npm run dev
   ```

## Endpoint

### POST `/api/submit-quotation`
- **Body**: JSON `{ "name": string, "phone": string, "email": string }`
- **Success**: HTTP 200 `{ message: 'Quotation sent successfully' }`
- **Errors**: HTTP 400, 405, or 500

---

Leverages **nodemailer** with Gmail SMTP (no additional paid service required).
