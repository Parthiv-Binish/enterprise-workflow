// supabase/functions/send-email/index.ts

import { serve } from '[deno.land](https://deno.land/std@0.168.0/http/server.ts)';
import { createClient } from '[esm.sh](https://esm.sh/@supabase/supabase-js@2)';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface EmailPayload {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  userId?: string;
}

serve(async (req) => {
  try {
    const payload: EmailPayload = await req.json();

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Send email via Resend
    const response = await fetch('[api.resend.com](https://api.resend.com/emails)', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'WorkFlow <noreply@yourapp.com>',
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    const result = await response.json();

    // Log the email
    await supabase.from('email_logs').insert({
      user_id: payload.userId,
      to_email: payload.to,
      subject: payload.subject,
      status: response.ok ? 'sent' : 'failed',
      provider: 'resend',
      provider_message_id: result.id,
      metadata: { response: result },
    });

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
