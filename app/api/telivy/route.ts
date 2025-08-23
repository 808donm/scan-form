import { NextRequest, NextResponse } from 'next/server';
import { ScanRequestSchema } from '../../../lib/validation';
import { mapTelivyErrors } from '../../../lib/errorMap';

export const runtime = 'nodejs';

const TELIVY_URL = 'https://api-v1.telivy.com/api/v1/security/external-scans';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ScanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // 1) Verify Cloudflare Turnstile
    const secret = process.env.TURNSTILE_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing TURNSTILE_SECRET' },
        { status: 500 }
      );
    }

    const verifyRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: body.turnstileToken }),
      }
    );
    const verifyData: { success: boolean; [k: string]: any } = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json(
        { error: 'Failed human verification', details: verifyData },
        { status: 400 }
      );
    }

    // 2) Forward to Telivy
    const apiKey = process.env.TELIVY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing TELIVY_API_KEY' },
        { status: 500 }
      );
    }

    const telivyPayload = {
      company_name: body.companyName,
      work_email: body.workEmail,
      company_domain: body.companyDomain,
      full_name: body.fullName,
      phone: body.phone,
    };

    const telivyRes = await fetch(TELIVY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(telivyPayload),
      keepalive: true,
    });

    const telivyJson = await telivyRes.json().catch(() => ({}));

    if (!telivyRes.ok) {
      // Normalize field errors for the client (Option C UX)
      const fieldErrors = mapTelivyErrors(telivyJson);
      return NextResponse.json(
        { error: 'Telivy API error', status: telivyRes.status, details: telivyJson, fieldErrors },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, telivy: telivyJson });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
