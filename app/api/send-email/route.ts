import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { SmtpConfig, EmailDraft, EmailAttachment } from '@/lib/types';

function buildTransport(cfg: SmtpConfig) {
  if (cfg.provider === 'resend') {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: cfg.password },
    });
  }
  if (cfg.provider === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: cfg.user, pass: cfg.password },
    });
  }
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.password },
  });
}

function formatAddr(list: { email: string; name?: string }[]) {
  return list.map(r => (r.name ? `"${r.name}" <${r.email}>` : r.email)).join(', ');
}

function buildAttachments(attachments?: EmailAttachment[]) {
  if (!attachments || attachments.length === 0) return [];
  return attachments.map(att => ({
    filename: att.filename,
    content: att.content,
    encoding: 'base64' as const,
    contentType: att.contentType,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { smtp: SmtpConfig; draft: EmailDraft };
    const { smtp, draft } = body;

    if (!smtp || !draft) {
      return NextResponse.json({ error: 'Missing smtp or draft' }, { status: 400 });
    }

    const transport = buildTransport(smtp);

    const mailOptions = {
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: formatAddr(draft.to),
      cc: draft.cc?.length ? formatAddr(draft.cc) : undefined,
      bcc: draft.bcc?.length ? formatAddr(draft.bcc) : undefined,
      replyTo: draft.replyTo || undefined,
      subject: draft.subject,
      html: draft.bodyHtml,
      text: draft.bodyText,
      attachments: buildAttachments(draft.attachments),
    };

    const info = await transport.sendMail(mailOptions);
    
    // Log the response from the mail server
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return NextResponse.json({ 
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Email sending error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
