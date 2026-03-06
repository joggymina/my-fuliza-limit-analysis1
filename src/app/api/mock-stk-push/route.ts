// src/app/api/mock-stk-push/route.ts - Hybrid: real HashPay if env vars set, mock otherwise
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, amount, apiRef } = body;

    if (!phone || !amount || !apiRef) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
    }

    // Normalize phone to HashPay required format: 2547XXXXXXXX or 2541XXXXXXXX
    let normalizedPhone = phone.replace(/\D/g, ''); // remove non-digits
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = `254${normalizedPhone.slice(1)}`;
    }
    if (!normalizedPhone.startsWith('254')) {
      normalizedPhone = `254${normalizedPhone}`;
    }
    // Basic validation (9 digits after 254, starting with 7 or 1 for Safaricom/Airtel)
    if (!/^254[17]\d{8}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid phone number format. Use e.g. 0722xxxxxx, 011xxxxxxx, 2547xxxxxxxx or 2541xxxxxxxx' },
        { status: 400 }
      );
    }

    console.log('Received payload:', JSON.stringify(body, null, 2));
    console.log('Normalized phone:', normalizedPhone);

    // Check if HashPay env vars are set
    if (process.env.HASHPAY_API_KEY && process.env.HASHPAY_ACCOUNT_ID) {
      console.log('Using REAL HashPay integration');

      const payload = {
        api_key: process.env.HASHPAY_API_KEY,
        account_id: process.env.HASHPAY_ACCOUNT_ID,
        amount: Math.round(Number(amount)), // HashPay expects whole number (integer)
        msisdn: normalizedPhone,
        reference: apiRef, // should be unique per transaction
      };

      const res = await fetch('https://api.hashback.co.ke/initiatestk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('HashPay status:', res.status);
      console.log('HashPay body:', JSON.stringify(data, null, 2));

      // HashPay success typically has ResponseCode === "0"
      if (res.ok && data.ResponseCode === "0") {
        return NextResponse.json({
          ok: true,
          message: 'STK push sent via HashPay',
          data,
          checkoutId: data.CheckoutRequestID,
          merchantId: data.MerchantRequestID,
        });
    } else {
  const errorMsg = data?.ResponseDescription || data?.message || data?.error || JSON.stringify(data) || 'Unknown HashPay error';
  console.error('HashPay rejected:', {
    status: res.status,
    fullBody: data,
    sentPayload: payload // add this if you log payload earlier
  });
  return NextResponse.json({ ok: false, error: `HashPay: ${errorMsg} (check if API key is activated)` }, { status: res.status || 400 });
}
    } else {
      // Fallback to pure mock if env vars missing
      console.log('Using SAFE MOCK (HashPay env vars missing)');
      await new Promise(resolve => setTimeout(resolve, 2000)); // simulate network delay

      return NextResponse.json({
        ok: true,
        message: 'Mock STK push initiated (HashPay env vars not set)',
        trackingId: 'MOCK-' + Date.now(),
      });
    }
  } catch (error: any) {
    console.error('Route error:', error.message || error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}