import { getTranslations } from 'next-intl/server';
import type { PublicGuide } from '../../lib/guides/model';
import { cardData, type CardData } from '../../lib/guides/discover';
import CardView from './CardView';

// A guide in a static list (home page, /guides, landing pages).
export default async function GuideCard({ p, locale, priority = false, hideCount = false }: { p: PublicGuide; locale: string; priority?: boolean; hideCount?: boolean }) {
  const c = await toCard(p, locale);
  return <CardView c={hideCount ? { ...c, showCount: false } : c} priority={priority} />;
}

/** Card data in the visitor's language (for lists that are filtered in the browser). */
export async function toCard(p: PublicGuide, locale: string): Promise<CardData> {
  const t = await getTranslations({ locale, namespace: 'share' });
  return cardData(p, {
    days: count => t('days', { count }),
    stops: count => t('stops', { count }),
    by: name => t('by', { name }),
  });
}
