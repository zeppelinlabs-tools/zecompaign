# zecompaign

**AI-Powered Email Campaign Platform**

zecompaign is a professional email campaign management platform featuring SMTP configuration, AI-powered template generation via Google Gemini, and comprehensive email analytics.

## Features

- 📧 **Multi-SMTP Management** - Configure and manage multiple SMTP servers
- 🤖 **AI Template Generation** - Create professional email templates using Google Gemini AI
- 📝 **Email Composer** - Rich text editor with template support
- 📊 **Analytics Dashboard** - Track sent emails, delivery status, and campaign performance
- 💾 **Template Library** - Save and reuse successful email templates
- 🔒 **Secure Configuration** - Local storage for sensitive SMTP credentials

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the zecompaign platform.

## Configuration

1. **SMTP Setup** - Navigate to "SMTP Configs" to add your email server credentials
2. **Gemini AI** - Add your Google Gemini API key in "Settings" to enable AI template generation
3. **Start Campaigning** - Use "Compose Email" or "AI Templates" to create and send emails

## Tech Stack

- [Next.js](https://nextjs.org) 16.x - React framework
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Nodemailer](https://nodemailer.com) - Email delivery
- [Google Gemini AI](https://ai.google.dev) - AI template generation
- [Lucide React](https://lucide.dev) - Icons

## Project Structure

```
zecompaign/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   └── page.tsx     # Main application page
├── components/       # React components
├── lib/             # Utilities and types
└── public/          # Static assets
```

## License

Private project.
