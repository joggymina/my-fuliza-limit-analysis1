// src/app/api/mock-stk-push/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, amount, apiRef } = body;

    if (!phone || !amount || !apiRef) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
    }

    // Normalize phone to 254XXXXXXXXX format
    let normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('0')) normalizedPhone = `254${normalizedPhone.slice(1)}`;
    if (!normalizedPhone.startsWith('254')) normalizedPhone = `254${normalizedPhone}`;

    console.log('Received payload:', JSON.stringify(body, null, 2));

    // Check if HashPay env vars are set
    if (process.env.HASHPAY_API_KEY && process.env.HASHPAY_ACCOUNT_ID) {
      console.log('Using REAL HashPay integration');

      const payload = {
        api_key: process.env.HASHPAY_API_KEY,
        account_id: process.env.HASHPAY_ACCOUNT_ID,
        amount: amount.toString(),               // HashPay wants string
        msisdn: normalizedPhone,
        reference: apiRef,
      };

      console.log('HashPay payload:', JSON.stringify(payload, null, 2));

      const res = await fetch('https://api.hashback.co.ke/v2/initiatestk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('HashPay HTTP status:', res.status);

      let data;
      try {
        data = await res.json();
      } catch {
        data = { raw: await res.text() };
      }

      console.log('HashPay response:', JSON.stringify(data, null, 2));

      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: data?.message || `HashPay failed with status ${res.status}` },
          { status: res.status }
        );
      }

      return NextResponse.json({ ok: true, message: 'STK push sent', data });
    }

    // Fallback to mock
    console.log('Using SAFE MOCK (HashPay env vars missing)');
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({
      ok: true,
      message: 'Mock STK push initiated',
      trackingId: 'MOCK-' + Date.now(),
    });
  } catch (error: any) {
    console.error('Route error:', error.message || error.stack || error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}