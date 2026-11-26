'use client';

import { useEffect, useState } from 'react';
import { loadComments, addComment, editComment, removeComment, myLists, setBlocked, COMMENT_MAX, type GuideComment } from '../../lib/social';
import { useMe, loginHref } from './useMe';

// Comments on a guide (plan F5.3), as CommentsTab in the app (GDS 1919–2113): oldest first, one
// per user per guide, your own can be edited and deleted, the guide's owner can delete others'
// comments or block the writer. Hidden entirely when the owner turned comments off. Shane
// (27.11.2026): only signed-in users can read them; signed out, a sign-in button is shown.

export type CommentLabels = {
  title: string; signInToRead: string; signIn: string; loading: string;
  placeholder: string; post: string; none: string; noneSub: string; already: string;
  edit: string; del: string; deleteConfirm: string; save: string; cancel: string;
  moderate: string; deleteAction: string; blockTitle: string; blockConfirm: string;
  failed: string; editFailed: string;
};

export default function Comments({ guideId, ownerId, locale, labels }: { guideId: string; ownerId: string; locale: string; labels: CommentLabels }) {
  const { me, client } = useMe();
  const [comments, setComments] = useState<GuideComment[] | null>(null);
  const [blocked, setBlockedIds] = useState<string[]>([]);
  const [myName, setMyName] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [menu, setMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    (async () => {
      const c = await client();
      const [list, lists, prof] = await Promise.all([
        loadComments(c, guideId),
        myLists(c, me),
        c.from('user_profiles').select('name').eq('id', me).maybeSingle(),
      ]);
      if (cancelled) return;
      setComments(list ?? []);
      setBlockedIds(lists.blocked);
      setMyName(((prof.data as { name?: string } | null)?.name ?? '').trim());
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, guideId]);

  const dateFmt = new Intl.DateTimeFormat(locale === 'no' ? 'nb' : locale, { month: 'short', day: 'numeric', year: 'numeric' });
  const shown = (comments ?? []).filter(c => !blocked.includes(c.authorId));
  const mine = (comments ?? []).find(c => c.authorId === me);
  const isOwner = !!me && me === ownerId;

  async function post() {
    const v = text.trim();
    if (!v || !me || sending) return;
    setSending(true);
    setError('');
    const created = await addComment(await client(), guideId, me, myName || 'TripShare', v);
    setSending(false);
    if (!created) { setError(labels.failed); return; } // the text stays, nothing typed is lost
    setComments(prev => [...(prev ?? []), created]);
    setText('');
  }

  async function saveEdit(id: string) {
    const v = editText.trim();
    if (!v) return;
    const ok = await editComment(await client(), id, v);
    if (!ok) { setError(labels.editFailed); return; }
    setComments(prev => (prev ?? []).map(c => (c.id === id ? { ...c, text: v } : c)));
    setEditing(null);
  }

  async function del(id: string) {
    if (!window.confirm(labels.deleteConfirm)) return;
    const ok = await removeComment(await client(), id);
    if (ok) setComments(prev => (prev ?? []).filter(c => c.id !== id));
    setMenu(null);
  }

  async function block(c: GuideComment) {
    if (!me || !window.confirm(`${labels.blockTitle.replace('{name}', c.authorName)}\n\n${labels.blockConfirm}`)) return;
    if (await setBlocked(await client(), me, c.authorId, true)) setBlockedIds(b => [...b, c.authorId]);
    setMenu(null);
  }

  return (
    <section className="mt-16" id="comments" aria-labelledby="comments-title">
      <h2 id="comments-title" className="font-display text-2xl font-bold">{labels.title}{comments ? ` (${shown.length})` : ''}</h2>

      {me === null && (
        <div className="mt-5 rounded-3xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted">{labels.signInToRead}</p>
          <a href="#" onClick={e => { e.preventDefault(); window.location.assign(loginHref(locale)); }}
            className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent2">{labels.signIn}</a>
        </div>
      )}
      {me && comments === null && <p className="mt-5 text-sm text-faint">{labels.loading}</p>}

      {me && comments && (
        <>
          {shown.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-border bg-surface p-6 text-center">
              <p className="font-semibold">{labels.none}</p>
              <p className="mt-1 text-sm text-muted">{labels.noneSub}</p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {shown.map(c => {
                const own = c.authorId === me;
                const date = new Date(c.createdAt);
                return (
                  <li key={c.id} className="rounded-2xl border border-border bg-surface p-4" data-comment={c.id}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                        {(c.authorName || '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{c.authorName}</p>
                        {!isNaN(date.getTime()) && <p className="text-xs text-faint">{dateFmt.format(date)}</p>}
                      </div>
                      {own && editing !== c.id && (
                        <div className="flex gap-3 text-xs font-semibold">
                          <button type="button" className="text-muted hover:text-ink" onClick={() => { setEditing(c.id); setEditText(c.text); }}>{labels.edit}</button>
                          <button type="button" className="text-red-300 hover:text-red-200" onClick={() => del(c.id)}>{labels.del}</button>
                        </div>
                      )}
                      {isOwner && !own && (
                        <div className="relative">
                          <button type="button" aria-label={labels.moderate} aria-expanded={menu === c.id} onClick={() => setMenu(menu === c.id ? null : c.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-s2 hover:text-ink">⋯</button>
                          {menu === c.id && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-s2 shadow-card">
                              <button type="button" onClick={() => del(c.id)} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-surface">{labels.deleteAction}</button>
                              <button type="button" onClick={() => block(c)} className="block w-full px-4 py-2.5 text-left text-sm text-red-300 hover:bg-surface">
                                {labels.blockTitle.replace('{name}', c.authorName).replace(/\?$/, '')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {editing === c.id ? (
                      <div className="mt-3">
                        <textarea value={editText} onChange={e => setEditText(e.target.value)} maxLength={COMMENT_MAX} autoFocus
                          className="min-h-[80px] w-full rounded-xl border border-border bg-s2 px-3 py-2 text-sm outline-none focus:border-accent/60" />
                        <div className="mt-2 flex justify-end gap-2">
                          <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-ink">{labels.cancel}</button>
                          <button type="button" onClick={() => saveEdit(c.id)} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent2">{labels.save}</button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-muted">{c.text}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
          {mine ? (
            <p className="mt-5 rounded-2xl border border-border px-4 py-3 text-sm text-faint">{labels.already}</p>
          ) : (
            <div className="mt-5">
              <textarea value={text} onChange={e => setText(e.target.value)} maxLength={COMMENT_MAX} placeholder={labels.placeholder}
                className="min-h-[90px] w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-faint focus:border-accent/60" />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-faint">{text.length > COMMENT_MAX - 200 ? `${text.length}/${COMMENT_MAX}` : ''}</span>
                <button type="button" onClick={post} disabled={!text.trim() || sending}
                  className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent2 disabled:opacity-50">{labels.post}</button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
