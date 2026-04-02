// src/app/api/mock-stk-push/route.ts
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

    // ==================== MULTIPLE ACCOUNTS (Robust Alternation) ====================
    const accounts = [
      {
        name: "Account 1",
        api_key: process.env.HASHBACK_API_KEY_1,
        account_id: process.env.HASHBACK_ACCOUNT_ID_1,
      },
      {
        name: "Account 2",
        api_key: process.env.HASHBACK_API_KEY_2,
        account_id: process.env.HASHBACK_ACCOUNT_ID_2,
      },
    ].filter(acc => acc.api_key && acc.account_id); // Remove invalid/missing accounts

    if (accounts.length === 0) {
      console.log('Using SAFE MOCK (No HashBack accounts configured)');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({
        ok: true,
        message: 'Mock STK push initiated',
        trackingId: 'MOCK-' + Date.now(),
      });
    }

    // Strict round-robin alternation among available accounts
    const index = Date.now() % accounts.length;
    const selected = accounts[index];

    console.log(`🔄 Using ${selected.name} (${accounts.length} account(s) available)`);

    const payload = {
      api_key: selected.api_key,
      account_id: selected.account_id,
      amount: amount.toString(),
      msisdn: normalizedPhone,
      reference: apiRef,
    };

    const res = await fetch('https://api.hashback.co.ke/v2/initiatestk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('HashBack HTTP status:', res.status);

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    console.log('HashBack response:', JSON.stringify(data, null, 2));

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: data?.message || `HashBack failed with status ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'STK push sent',
      data,
      usedAccount: selected.name
    });
  } catch (error: any) {
    console.error('Route error:', error.message || error.stack || error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}