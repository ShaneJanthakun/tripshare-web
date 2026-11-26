'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { authErrorKey } from '../../lib/auth/errors';

// Forgotten password (plan F2.4). Step "request": e-mail → reset link. Step "new": signed in
// through the link (recovery session) → choose a new password (trimmed, at least 6, as the app).
type Labels = Record<
  | 'emailPlaceholder' | 'sendLink' | 'sent' | 'newPasswordPlaceholder' | 'savePassword' | 'saved'
  | 'errorEmail' | 'errorPasswordLength' | 'errorGeneric' | 'errorRateLimit' | 'errorNetwork' | 'errorWeakPassword'
  | 'errorInvalidCredentials' | 'errorUserExists' | 'errorEmailInvalid',
  string
>;

export default function ResetPasswordForm({ step, locale, labels }: { step: 'request' | 'new'; locale: string; labels: Labels }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setNotice('');
    const mail = email.trim().toLowerCase();
    if (!mail) return setError(labels.errorEmail);
    setBusy(true);
    const { error: err } = await createClient().auth.resetPasswordForEmail(mail, {
      redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(`/${locale}/reset-password`)}`,
    });
    setBusy(false);
    // Same answer whether or not the address has an account, so nobody can probe for accounts.
    const key = err ? authErrorKey(err) : '';
    if (key === 'errorRateLimit' || key === 'errorNetwork') return setError(labels[key]);
    setNotice(labels.sent);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const pass = password.trim();
    if (pass.length < 6) return setError(labels.errorPasswordLength);
    setBusy(true);
    const { error: err } = await createClient().auth.updateUser({ password: pass });
    if (err) { setError(labels[authErrorKey(err) as keyof Labels] ?? labels.errorGeneric); setBusy(false); return; }
    setNotice(labels.saved);
    setTimeout(() => window.location.assign(`/${locale}/my-guides`), 1200);
  }

  const input = 'w-full rounded-xl border border-border bg-s2 px-4 py-3 text-[15px] text-ink placeholder:text-faint outline-none focus:border-accent/60';
  const button = 'w-full rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent2 disabled:opacity-60';

  return (
    <form onSubmit={step === 'new' ? save : request} className="space-y-3" noValidate>
      {step === 'new' ? (
        <input className={input} type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder={labels.newPasswordPlaceholder} autoComplete="new-password" autoFocus />
      ) : (
        <input className={input} type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder={labels.emailPlaceholder} autoComplete="email" inputMode="email" autoFocus />
      )}
      {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-ink">{notice}</p>}
      <button type="submit" disabled={busy || (step === 'new' && !!notice)} className={button}>
        {step === 'new' ? labels.savePassword : labels.sendLink}
      </button>
    </form>
  );
}
