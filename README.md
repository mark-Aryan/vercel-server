# Quotation Receiver API on Vercel

This Next.js project exposes an API endpoint to receive quotation form submissions and forward them via email-to-SMS using SendGrid.

## Setup
1. Clone this repo
2. Run `npm install`
3. Copy `.env.example` to `.env.local` and set:
   - `SENDGRID_API_KEY`
   - `FROM_EMAIL` (verified sender in SendGrid)
   - `TO_SMS_EMAIL` (your phone's SMS gateway email address)

4. Deploy to Vercel or run locally with `npm run dev`

## Endpoint
- **POST** `/api/submit-quotation`
  - Body JSON: `{ name, phone, email }`
  - Success: `200 { message: 'Quotation sent successfully' }`
  - Errors: `400`, `405`, `500`

## SMS Gateway Setup
Most carriers support email-to-SMS by sending email to `<number>@<gateway>`. Find your carrier's gateway and set `TO_SMS_EMAIL` accordingly.
