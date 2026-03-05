// src/app/api/mock-stk-push/route.ts - Hybrid: real PayHero if env vars set, mock otherwise
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, amount, apiRef } = body;

    if (!phone || !amount || !apiRef) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
    }

    // Normalize phone
    let normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('0')) normalizedPhone = `254${normalizedPhone.slice(1)}`;
    if (!normalizedPhone.startsWith('254')) normalizedPhone = `254${normalizedPhone}`;

    console.log('Received payload:', JSON.stringify(body, null, 2));

    // Check if PayHero env vars are set
    if (process.env.PAYHERO_BASIC_AUTH_TOKEN && process.env.PAYHERO_CHANNEL_ID) {
      console.log('Using REAL PayHero integration');

      const payload = {
        amount: Number(amount),
        phone_number: normalizedPhone,
        channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
        provider: 'm-pesa',
        external_reference: apiRef,
        customer_name: 'Test User',
        callback_url: 'https://my-fuliza-analysis.vercel.app/api/payhero-callback',
      };

      const res = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.PAYHERO_BASIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      console.log('PayHero status:', res.status);
      console.log('PayHero body:', data);

      if (!res.ok) {
        return NextResponse.json({ ok: false, error: data?.message || 'PayHero failed' }, { status: res.status });
      }

      return NextResponse.json({ ok: true, message: 'STK push sent', data });
    } else {
      // Fallback to pure mock if env vars missing
      console.log('Using SAFE MOCK (env vars missing)');

      await new Promise(resolve => setTimeout(resolve, 2000));

      return NextResponse.json({
        ok: true,
        message: 'Mock STK push initiated (env vars not set)',
        trackingId: 'MOCK-' + Date.now()
      });
    }
  } catch (error: any) {
    console.error('Route error:', error.message || error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}