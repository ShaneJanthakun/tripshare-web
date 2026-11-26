'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { authErrorKey } from '../../lib/auth/errors';

// Sign in / create account, with the app's rules (AuthScreen): e-mail trimmed and lower-cased,
// password trimmed, name required and at least 6 characters when creating an account.
// Apple and Google go through Supabase OAuth and come back to /auth/callback.
type Labels = Record<
  | 'logIn' | 'createAccount' | 'namePlaceholder' | 'emailPlaceholder' | 'passwordPlaceholder'
  | 'continueWithApple' | 'continueWithGoogle' | 'or' | 'noAccount' | 'signUp' | 'haveAccount'
  | 'emailConfirmation' | 'sameMethodHint' | 'errorProvider'
  | 'errorEmail' | 'errorPassword' | 'errorName' | 'errorPasswordLength' | 'errorGeneric' | 'errorApple' | 'errorGoogle'
  | 'errorInvalidCredentials' | 'errorUserExists' | 'errorWeakPassword' | 'errorEmailInvalid' | 'errorRateLimit' | 'errorNetwork',
  string
>;

export default function LoginForm({ next, initialError, labels }: { next: string; initialError?: string; labels: Labels }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError ? labels.errorProvider : '');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const done = () => window.location.assign(next); // full load, so the server sees the new session

  async function oauth(provider: 'apple' | 'google') {
    setError('');
    setBusy(true);
    const { error: e } = await createClient().auth.signInWithOAuth({ provider, options: { redirectTo: callback() } });
    if (e) { setError(provider === 'apple' ? labels.errorApple : labels.errorGoogle); setBusy(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(''); setNotice('');
    const mail = email.trim().toLowerCase();
    const pass = password.trim();
    if (mode === 'signup' && !name.trim()) return setError(labels.errorName);
    if (!mail) return setError(labels.errorEmail);
    if (!pass) return setError(labels.errorPassword);
    if (mode === 'signup' && pass.length < 6) return setError(labels.errorPasswordLength);
    setBusy(true);
    const supabase = createClient();
    if (mode === 'signin') {
      const { error: err } = await supabase.auth.signInWithPassword({ email: mail, password: pass });
      if (err) { setError(labels[authErrorKey(err) as keyof Labels]); setBusy(false); return; }
      return done();
    }
    const { data, error: err } = await supabase.auth.signUp({
      email: mail, password: pass,
      options: { data: { name: name.trim() }, emailRedirectTo: callback() },
    });
    if (err) { setError(labels[authErrorKey(err) as keyof Labels]); setBusy(false); return; }
    if (data.session) return done();
    setNotice(labels.emailConfirmation); // only if e-mail confirmation is turned on (B11)
    setBusy(false);
  }

  const input = 'w-full rounded-xl border border-border bg-s2 px-4 py-3 text-[15px] text-ink placeholder:text-faint outline-none transition-colors focus:border-accent/60';

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <button type="button" onClick={() => oauth('apple')} disabled={busy}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-ink px-5 py-3.5 text-sm font-semibold text-bg transition-colors hover:bg-white disabled:opacity-60">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
          {labels.continueWithApple}
        </button>
        <button type="button" onClick={() => oauth('google')} disabled={busy}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface px-5 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-s2 disabled:opacity-60">
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          {labels.continueWithGoogle}
        </button>
        <p className="text-center text-xs leading-relaxed text-faint">{labels.sameMethodHint}</p>
      </div>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-faint">
        <span className="h-px flex-1 bg-border" />{labels.or}<span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-3" noValidate>
        {mode === 'signup' && (
          <input className={input} value={name} onChange={e => setName(e.target.value)} placeholder={labels.namePlaceholder} autoComplete="name" maxLength={40} />
        )}
        <input className={input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={labels.emailPlaceholder} autoComplete="email" inputMode="email" />
        <input className={input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={labels.passwordPlaceholder}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
        {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-ink">{notice}</p>}
        <button type="submit" disabled={busy}
          className="w-full rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent2 disabled:opacity-60">
          {mode === 'signin' ? labels.logIn : labels.createAccount}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        {mode === 'signin' ? labels.noAccount : labels.haveAccount}{' '}
        <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setNotice(''); }}
          className="font-semibold text-accent hover:underline">
          {mode === 'signin' ? labels.signUp : labels.logIn}
        </button>
      </p>
    </div>
  );
}
