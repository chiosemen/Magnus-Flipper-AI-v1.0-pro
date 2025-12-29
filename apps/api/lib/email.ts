type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    console.warn('[email] RESEND_API_KEY or RESEND_FROM missing');
    console.log('[email] fallback', {
      to: payload.to,
      subject: payload.subject,
      preview: payload.html.slice(0, 200),
    });
    return { ok: false, skipped: true, error: 'Email not configured' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, error: text };
  }

  return { ok: true };
}
