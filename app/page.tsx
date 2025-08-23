'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

type FieldErrors = Partial<{
  companyName: string;
  workEmail: string;
  companyDomain: string;
  fullName: string;
  phone: string;
}>;

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          appearance?: 'always' | 'execute' | 'interaction-only';
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string | undefined;
      reset?: (id?: string) => void;
    };
  }
}

export default function Page() {
  const [form, setForm] = useState({
    companyName: '',
    workEmail: '',
    companyDomain: '',
    fullName: '',
    phone: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string | undefined;

  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);

 // Render Turnstile widget when script is available (with retry)
useEffect(() => {
  if (!siteKey || !widgetRef.current) return;

  let cancelled = false;
  let tries = 0;
  let widgetId: string | undefined;

  function tryRender() {
    if (cancelled) return;
    if (window.turnstile && widgetRef.current && !widgetIdRef.current) {
      widgetId = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        callback: (token) => setCaptcha(token),
        'expired-callback': () => setCaptcha(null),
        'error-callback': () => setCaptcha(null),
        appearance: 'always',
      }) as string | undefined;
      widgetIdRef.current = widgetId;
      return; // success; stop retrying
    }
    if (tries < 50) { // ~10s total @ 200ms
      tries += 1;
      setTimeout(tryRender, 200);
    }
  }

  tryRender();

  return () => {
    cancelled = true;
    // optionally reset (safe no-op if not rendered)
    try {
      if (widgetIdRef.current) window.turnstile?.reset?.(widgetIdRef.current);
    } catch {}
  };
}, [siteKey]);

  const hasErrors = useMemo(() => Object.keys(fieldErrors).length > 0, [fieldErrors]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    setFieldErrors({});
    if (!captcha) {
      setBanner('Complete the Turnstile challenge.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/telivy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken: captcha }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
          setFieldErrors(data.fieldErrors);
          setBanner('Please fix the highlighted fields.');
        } else {
          setBanner(data?.error || 'Submission failed');
        }
        return;
      }
      setBanner('Submitted. Telivy has received your external scan request.');
      setCaptcha(null);
      // Optionally reset widget so a new token is required for a new submission
      window.turnstile?.reset?.(widgetIdRef.current);
    } catch (err: any) {
      setBanner(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function inputClass(invalid?: boolean) {
    return `mt-1 w-full rounded-lg border px-3 py-2 ${invalid ? 'border-red-500 focus:outline-red-500' : ''}`;
  }

  return (
    <main className="bg-white rounded-2xl shadow p-6">
      <h1 className="text-2xl font-semibold mb-4">Request an External Security Scan</h1>

      {banner && (
        <div className={`mb-4 rounded-md border px-3 py-2 text-sm ${hasErrors ? 'border-red-500 text-red-700' : 'border-blue-300 text-blue-800'}`}>
          {banner}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <input
            required
            type="text"
            className={inputClass(!!fieldErrors.companyName)}
            aria-invalid={!!fieldErrors.companyName}
            aria-describedby={fieldErrors.companyName ? 'err-companyName' : undefined}
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          {fieldErrors.companyName && (
            <p id="err-companyName" className="mt-1 text-xs text-red-600">{fieldErrors.companyName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Work Email</label>
          <input
            required
            type="email"
            className={inputClass(!!fieldErrors.workEmail)}
            aria-invalid={!!fieldErrors.workEmail}
            aria-describedby={fieldErrors.workEmail ? 'err-workEmail' : undefined}
            value={form.workEmail}
            onChange={(e) => setForm({ ...form, workEmail: e.target.value })}
          />
          {fieldErrors.workEmail && (
            <p id="err-workEmail" className="mt-1 text-xs text-red-600">{fieldErrors.workEmail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Company Domain</label>
          <input
            required
            type="text"
            placeholder="example.com"
            className={inputClass(!!fieldErrors.companyDomain)}
            aria-invalid={!!fieldErrors.companyDomain}
            aria-describedby={fieldErrors.companyDomain ? 'err-companyDomain' : undefined}
            value={form.companyDomain}
            onChange={(e) => setForm({ ...form, companyDomain: e.target.value })}
          />
          {fieldErrors.companyDomain && (
            <p id="err-companyDomain" className="mt-1 text-xs text-red-600">{fieldErrors.companyDomain}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Your Full Name</label>
          <input
            required
            type="text"
            className={inputClass(!!fieldErrors.fullName)}
            aria-invalid={!!fieldErrors.fullName}
            aria-describedby={fieldErrors.fullName ? 'err-fullName' : undefined}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          {fieldErrors.fullName && (
            <p id="err-fullName" className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Contact Phone Number</label>
          <input
            required
            type="tel"
            className={inputClass(!!fieldErrors.phone)}
            aria-invalid={!!fieldErrors.phone}
            aria-describedby={fieldErrors.phone ? 'err-phone' : undefined}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          {fieldErrors.phone && (
            <p id="err-phone" className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
          )}
        </div>

        {siteKey ? (
          <div>
            <div ref={widgetRef} />
            {!captcha && <p className="mt-1 text-xs text-gray-500">Complete the Turnstile challenge to enable submission.</p>}
          </div>
        ) : (
          <p className="text-sm text-red-600">Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY env.</p>
        )}

       <button
  type="submit"
  disabled={loading || !captcha}
  className="rounded-xl px-4 py-2 border font-medium shadow disabled:opacity-50"
>
  {loading ? 'Submitting…' : 'Submit'}
</button>
      </form>
    </main>
  );
}
