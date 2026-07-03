import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { SmtpConfig } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const cfg: SmtpConfig = await req.json();

    let transport;
    if (cfg.provider === 'resend') {
      transport = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: { user: 'resend', pass: cfg.password },
      });
    } else if (cfg.provider === 'gmail') {
      transport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: cfg.user, pass: cfg.password },
      });
    } else {
      transport = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.password },
      });
    }

    await transport.verify();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
