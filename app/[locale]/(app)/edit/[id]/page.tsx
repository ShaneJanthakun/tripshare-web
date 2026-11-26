import { notFound, redirect } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import Editor from '../../../../../components/editor/Editor';
import { createClient } from '../../../../../lib/supabase/server';
import { migrate, ADMIN_USER_ID } from '../../../../../lib/core/guide';
import { guideLocale, guidePath } from '../../../../../lib/guides/model';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../../../lib/supabase/env';

// Editing a guide on the web (plan F3.1): the row is read on the server with the user's session.
// Only the author or admin may edit; everyone else is sent to the public page.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'editor' });
  return { title: `${t('title')} | TripShare` };
}

export default async function EditPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from('guides').select('id, data, version, author_id').eq('id', id).maybeSingle();
  const row = data as { id: string; data: unknown; version: number; author_id: string } | null;
  if (!row) notFound();
  const guide = { ...migrate(row.data), id: row.id };
  if (row.author_id !== user!.id && user!.id !== ADMIN_USER_ID) redirect(guidePath(guideLocale(guide), guide));

  // Only the texts the editor needs go to the browser.
  const all = (await getMessages({ locale })) as Record<string, any>;
  const messages = {
    editor: all.editor,
    app: { guideDetail: all.app.guideDetail, createGuide: all.app.createGuide, common: all.app.common, tags: all.app.tags },
  };

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Editor
        locale={locale}
        initialGuide={guide}
        initialVersion={row.version ?? 0}
        publicPath={guidePath(guideLocale(guide), guide)}
        supabaseUrl={SUPABASE_URL}
        supabaseKey={SUPABASE_ANON_KEY}
      />
    </NextIntlClientProvider>
  );
}
