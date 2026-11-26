'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

// Apple users with a hidden e-mail whose name Apple didn't send: ask for a name before the
// profile row is created, and save it on the account too (as the app's handleApple does).
export default function NameForm({ next, labels }: { next: string; labels: { placeholder: string; continue: string; errorName: string; errorGeneric: string } }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim().slice(0, 40);
    if (!value) return setError(labels.errorName);
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.assign(next); return; }
    await supabase.auth.updateUser({ data: { name: value } });
    const { error: err } = await supabase.from('user_profiles').upsert(
      { id: user.id, name: value, following: [], upvoted_guides: [], blocked_users: [] },
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (err) { setError(labels.errorGeneric); setBusy(false); return; }
    window.location.assign(next);
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <input value={name} onChange={e => setName(e.target.value)} placeholder={labels.placeholder} maxLength={40} autoFocus autoComplete="name"
        className="w-full rounded-xl border border-border bg-s2 px-4 py-3 text-[15px] text-ink placeholder:text-faint outline-none focus:border-accent/60" />
      {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white hover:bg-accent2 disabled:opacity-60">
        {labels.continue}
      </button>
    </form>
  );
}
