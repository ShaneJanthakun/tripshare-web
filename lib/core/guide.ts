// GENERATED – DO NOT EDIT. Copy of tripshare/src/core/guide.ts (the app owns the guide format).
// Update with `npm run sync-core`. sha256: d989215caec5642a5de7551ede88de8d1fe4a4aa243c541f51ec81b00dcab5ef

// TripShare guide format: types and pure logic shared by the app and tripshare.online.
//
// This file is the source of truth. The website gets a checked copy (lib/core/guide.ts) via
// `npm run sync-core` in tripshare-web. Keep it plain TypeScript: no React Native, no Expo,
// no Node or browser APIs. If the format changes: change it here, run sync-core, update the
// website UI and run the round-trip test (plan/01-arkitektur.md, plan/10-testing.md).

export type GuideTag =
  | 'party' | 'hiking' | 'historic' | 'cycling' | 'walking'
  | 'city_tour' | 'foodie' | 'beach' | 'road_trip' | 'solo' | 'budget' | 'luxury' | 'fitness'
  | 'music' | 'family' | 'sailing';

export const TAG_META: Record<GuideTag, { label: string; icon: string }> = {
  party:     { label: 'Party Trip',      icon: '🎉' },
  hiking:    { label: 'Hiking',          icon: '🥾' },
  historic:  { label: 'Historic Tour',   icon: '🏛️' },
  cycling:   { label: 'Cycling Tour',    icon: '🚴' },
  walking:   { label: 'Walking Tour',    icon: '🚶' },
  city_tour: { label: 'City Tour',       icon: '🏙️' },
  foodie:    { label: 'Foodie Trip',     icon: '🍽️' },
  beach:     { label: 'Beach Vacation',  icon: '🏖️' },
  road_trip: { label: 'Road Trip',       icon: '🚗' },
  solo:      { label: 'Solo Travel',     icon: '🧳' },
  budget:    { label: 'Budget',          icon: '💰' },
  luxury:    { label: 'Luxury',          icon: '✨' },
  fitness:   { label: 'Fitness',         icon: '🏋️' },
  music:     { label: 'Music',           icon: '🎵' },
  family:    { label: 'Family',          icon: '👨‍👩‍👧‍👦' },
  sailing:   { label: 'Sailing',         icon: '⛵' },
};

export interface Stop {
  id: string;
  name: string;
  notes: string;
  address: string;
  images: string[];
}

export interface TripDay {
  id: string;
  label: string;
  stops: Stop[];
  /** Draw the walking-route line between this day's stops on the map. Defaults to true. */
  showRoute?: boolean;
}

// 'checklist' kept for migration compatibility; new picker no longer offers it
export type SectionType = 'list' | 'checklist' | 'note' | 'gallery' | 'map' | 'accommodation';

export const SECTION_TYPE_META: Record<SectionType, { label: string; icon: string; description: string }> = {
  list:          { label: 'List',          icon: '≡',  description: 'Text items with add / remove' },
  checklist:     { label: 'Checklist',     icon: '✓',  description: 'Tickable pack list or to-do' },
  note:          { label: 'Note',          icon: '✎',  description: 'Free-text travel notes' },
  gallery:       { label: 'Gallery',       icon: '▦',  description: 'Photo collection' },
  map:           { label: 'Map',           icon: '⊕',  description: 'Visualize your route on a map' },
  accommodation: { label: 'Accommodation', icon: '🛏',  description: 'Hotel, Airbnb or booking link' },
};

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface CustomSection {
  id: string;
  title: string;
  type: SectionType;
  items: string[];
  checklistItems: ChecklistItem[];
  note: string;
  images: string[];
  accommodationUrl?: string;
  accommodationImage?: string;
  accommodationName?: string;
  accommodationAddress?: string;
  accommodationLat?: number;
  accommodationLng?: number;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface SectionOrderEntry {
  kind: 'day' | 'custom';
  id: string;
}

export interface GuideTranslation {
  title?: string;
  description?: string;
  generalTips?: string[];
  days?: Array<{
    label?: string;
    stops?: Array<{ name?: string; notes?: string }>;
  }>;
}

export interface TravelGuide {
  id: string;
  authorId: string;
  title: string;
  destination: string;
  country: string;
  coverImage: string;
  coverImageOffset?: number; // 0 = top, 50 = center, 100 = bottom
  commentsDisabled?: boolean;
  language?: string;
  galleryImages: string[];
  description: string;
  tags: GuideTag[];
  isPublic: boolean;
  isCompleted: boolean;
  isDraft?: boolean;
  // Set once the "new guide" push has gone out to followers, so re-completing
  // a guide never notifies twice.
  publishNotified?: boolean;
  accessCode?: string;
  shareLink: string;
  upvotes: number;
  views: number;
  authorName: string;
  generalTips: string[];
  days: TripDay[];
  placesToVisit: Stop[];
  customSections: CustomSection[];
  sectionOrder: SectionOrderEntry[];
  comments: Comment[];
  createdAt: string;
  translations?: Record<string, GuideTranslation>;
}

export const ALL_TAGS: GuideTag[] = [
  'party', 'hiking', 'historic', 'cycling', 'walking',
  'city_tour', 'foodie', 'beach', 'road_trip', 'solo', 'budget', 'luxury', 'fitness',
  'music', 'family', 'sailing',
];

export const ADMIN_USER_ID = '4f9ca051-5e1c-47b4-b229-2f33fb42d628';

// ─── Small helpers ───────────────────────────────────────────────────────────

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// 4-character access code for private guides, without look-alike characters (0/O, 1/I/L).
// Pass a cryptographic random source: the app uses expo-crypto, the website crypto.getRandomValues.
export const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generateCode(randomBytes: (n: number) => Uint8Array): string {
  return Array.from(randomBytes(4), b => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

export function moveItem<T>(arr: T[], idx: number, dir: 1 | -1): T[] {
  const to = idx + dir;
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  [copy[idx], copy[to]] = [copy[to], copy[idx]];
  return copy;
}

/** "59.91, 10.75" → coordinates; anything else → null. */
export function parseCoords(address: string): { latitude: number; longitude: number } | null {
  const m = address.trim().match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  return m ? { latitude: parseFloat(m[1]), longitude: parseFloat(m[2]) } : null;
}

// Guides store language as either an ISO code ('en') or a display name ('Norsk').
export const LANG_CODES: Record<string, string> = {
  en: 'en', english: 'en', no: 'no', norsk: 'no', norwegian: 'no',
  es: 'es', 'español': 'es', spanish: 'es', fr: 'fr', 'français': 'fr', french: 'fr',
  pt: 'pt', 'português': 'pt', portuguese: 'pt', th: 'th', 'ไทย': 'th', thai: 'th',
  ja: 'ja', '日本語': 'ja', japanese: 'ja', zh: 'zh', '中文': 'zh', chinese: 'zh',
  '中文（简体）': 'zh',
  ko: 'ko', '한국어': 'ko', korean: 'ko', de: 'de', deutsch: 'de', german: 'de',
};

export function langCode(value?: string): string | undefined {
  if (!value) return undefined;
  return LANG_CODES[value.trim().toLowerCase()];
}

// ─── Countries and languages offered when a guide is created ─────────────────

export const COUNTRIES: { flag: string; name: string }[] = [
  { flag: '🇦🇫', name: 'Afghanistan' }, { flag: '🇦🇱', name: 'Albania' }, { flag: '🇩🇿', name: 'Algeria' },
  { flag: '🇦🇩', name: 'Andorra' }, { flag: '🇦🇴', name: 'Angola' }, { flag: '🇦🇬', name: 'Antigua and Barbuda' },
  { flag: '🇦🇷', name: 'Argentina' }, { flag: '🇦🇲', name: 'Armenia' }, { flag: '🇦🇺', name: 'Australia' },
  { flag: '🇦🇹', name: 'Austria' }, { flag: '🇦🇿', name: 'Azerbaijan' }, { flag: '🇧🇸', name: 'Bahamas' },
  { flag: '🇧🇭', name: 'Bahrain' }, { flag: '🇧🇩', name: 'Bangladesh' }, { flag: '🇧🇧', name: 'Barbados' },
  { flag: '🇧🇾', name: 'Belarus' }, { flag: '🇧🇪', name: 'Belgium' }, { flag: '🇧🇿', name: 'Belize' },
  { flag: '🇧🇯', name: 'Benin' }, { flag: '🇧🇹', name: 'Bhutan' }, { flag: '🇧🇴', name: 'Bolivia' },
  { flag: '🇧🇦', name: 'Bosnia and Herzegovina' }, { flag: '🇧🇼', name: 'Botswana' }, { flag: '🇧🇷', name: 'Brazil' },
  { flag: '🇧🇳', name: 'Brunei' }, { flag: '🇧🇬', name: 'Bulgaria' }, { flag: '🇧🇫', name: 'Burkina Faso' },
  { flag: '🇧🇮', name: 'Burundi' }, { flag: '🇨🇻', name: 'Cabo Verde' }, { flag: '🇰🇭', name: 'Cambodia' },
  { flag: '🇨🇲', name: 'Cameroon' }, { flag: '🇨🇦', name: 'Canada' }, { flag: '🇨🇫', name: 'Central African Republic' },
  { flag: '🇹🇩', name: 'Chad' }, { flag: '🇨🇱', name: 'Chile' }, { flag: '🇨🇳', name: 'China' },
  { flag: '🇨🇴', name: 'Colombia' }, { flag: '🇰🇲', name: 'Comoros' }, { flag: '🇨🇬', name: 'Congo' },
  { flag: '🇨🇷', name: 'Costa Rica' }, { flag: '🇭🇷', name: 'Croatia' }, { flag: '🇨🇺', name: 'Cuba' },
  { flag: '🇨🇾', name: 'Cyprus' }, { flag: '🇨🇿', name: 'Czech Republic' }, { flag: '🇩🇰', name: 'Denmark' },
  { flag: '🇩🇯', name: 'Djibouti' }, { flag: '🇩🇲', name: 'Dominica' }, { flag: '🇩🇴', name: 'Dominican Republic' },
  { flag: '🇪🇨', name: 'Ecuador' }, { flag: '🇪🇬', name: 'Egypt' }, { flag: '🇸🇻', name: 'El Salvador' },
  { flag: '🇬🇶', name: 'Equatorial Guinea' }, { flag: '🇪🇷', name: 'Eritrea' }, { flag: '🇪🇪', name: 'Estonia' },
  { flag: '🇸🇿', name: 'Eswatini' }, { flag: '🇪🇹', name: 'Ethiopia' }, { flag: '🇫🇯', name: 'Fiji' },
  { flag: '🇫🇮', name: 'Finland' }, { flag: '🇫🇷', name: 'France' }, { flag: '🇬🇦', name: 'Gabon' },
  { flag: '🇬🇲', name: 'Gambia' }, { flag: '🇬🇪', name: 'Georgia' }, { flag: '🇩🇪', name: 'Germany' },
  { flag: '🇬🇭', name: 'Ghana' }, { flag: '🇬🇷', name: 'Greece' }, { flag: '🇬🇩', name: 'Grenada' },
  { flag: '🇬🇹', name: 'Guatemala' }, { flag: '🇬🇳', name: 'Guinea' }, { flag: '🇬🇼', name: 'Guinea-Bissau' },
  { flag: '🇬🇾', name: 'Guyana' }, { flag: '🇭🇹', name: 'Haiti' }, { flag: '🇭🇳', name: 'Honduras' },
  { flag: '🇭🇺', name: 'Hungary' }, { flag: '🇮🇸', name: 'Iceland' }, { flag: '🇮🇳', name: 'India' },
  { flag: '🇮🇩', name: 'Indonesia' }, { flag: '🇮🇷', name: 'Iran' }, { flag: '🇮🇶', name: 'Iraq' },
  { flag: '🇮🇪', name: 'Ireland' }, { flag: '🇮🇱', name: 'Israel' }, { flag: '🇮🇹', name: 'Italy' },
  { flag: '🇯🇲', name: 'Jamaica' }, { flag: '🇯🇵', name: 'Japan' }, { flag: '🇯🇴', name: 'Jordan' },
  { flag: '🇰🇿', name: 'Kazakhstan' }, { flag: '🇰🇪', name: 'Kenya' }, { flag: '🇰🇮', name: 'Kiribati' },
  { flag: '🇰🇼', name: 'Kuwait' }, { flag: '🇰🇬', name: 'Kyrgyzstan' }, { flag: '🇱🇦', name: 'Laos' },
  { flag: '🇱🇻', name: 'Latvia' }, { flag: '🇱🇧', name: 'Lebanon' }, { flag: '🇱🇸', name: 'Lesotho' },
  { flag: '🇱🇷', name: 'Liberia' }, { flag: '🇱🇾', name: 'Libya' }, { flag: '🇱🇮', name: 'Liechtenstein' },
  { flag: '🇱🇹', name: 'Lithuania' }, { flag: '🇱🇺', name: 'Luxembourg' }, { flag: '🇲🇬', name: 'Madagascar' },
  { flag: '🇲🇼', name: 'Malawi' }, { flag: '🇲🇾', name: 'Malaysia' }, { flag: '🇲🇻', name: 'Maldives' },
  { flag: '🇲🇱', name: 'Mali' }, { flag: '🇲🇹', name: 'Malta' }, { flag: '🇲🇭', name: 'Marshall Islands' },
  { flag: '🇲🇷', name: 'Mauritania' }, { flag: '🇲🇺', name: 'Mauritius' }, { flag: '🇲🇽', name: 'Mexico' },
  { flag: '🇫🇲', name: 'Micronesia' }, { flag: '🇲🇩', name: 'Moldova' }, { flag: '🇲🇨', name: 'Monaco' },
  { flag: '🇲🇳', name: 'Mongolia' }, { flag: '🇲🇪', name: 'Montenegro' }, { flag: '🇲🇦', name: 'Morocco' },
  { flag: '🇲🇿', name: 'Mozambique' }, { flag: '🇲🇲', name: 'Myanmar' }, { flag: '🇳🇦', name: 'Namibia' },
  { flag: '🇳🇷', name: 'Nauru' }, { flag: '🇳🇵', name: 'Nepal' }, { flag: '🇳🇱', name: 'Netherlands' },
  { flag: '🇳🇿', name: 'New Zealand' }, { flag: '🇳🇮', name: 'Nicaragua' }, { flag: '🇳🇪', name: 'Niger' },
  { flag: '🇳🇬', name: 'Nigeria' }, { flag: '🇰🇵', name: 'North Korea' }, { flag: '🇲🇰', name: 'North Macedonia' },
  { flag: '🇳🇴', name: 'Norway' }, { flag: '🇴🇲', name: 'Oman' }, { flag: '🇵🇰', name: 'Pakistan' },
  { flag: '🇵🇼', name: 'Palau' }, { flag: '🇵🇸', name: 'Palestine' }, { flag: '🇵🇦', name: 'Panama' },
  { flag: '🇵🇬', name: 'Papua New Guinea' }, { flag: '🇵🇾', name: 'Paraguay' }, { flag: '🇵🇪', name: 'Peru' },
  { flag: '🇵🇭', name: 'Philippines' }, { flag: '🇵🇱', name: 'Poland' }, { flag: '🇵🇹', name: 'Portugal' },
  { flag: '🇶🇦', name: 'Qatar' }, { flag: '🇷🇴', name: 'Romania' }, { flag: '🇷🇺', name: 'Russia' },
  { flag: '🇷🇼', name: 'Rwanda' }, { flag: '🇰🇳', name: 'Saint Kitts and Nevis' }, { flag: '🇱🇨', name: 'Saint Lucia' },
  { flag: '🇻🇨', name: 'Saint Vincent and the Grenadines' }, { flag: '🇼🇸', name: 'Samoa' }, { flag: '🇸🇲', name: 'San Marino' },
  { flag: '🇸🇹', name: 'São Tomé and Príncipe' }, { flag: '🇸🇦', name: 'Saudi Arabia' }, { flag: '🇸🇳', name: 'Senegal' },
  { flag: '🇷🇸', name: 'Serbia' }, { flag: '🇸🇨', name: 'Seychelles' }, { flag: '🇸🇱', name: 'Sierra Leone' },
  { flag: '🇸🇬', name: 'Singapore' }, { flag: '🇸🇰', name: 'Slovakia' }, { flag: '🇸🇮', name: 'Slovenia' },
  { flag: '🇸🇧', name: 'Solomon Islands' }, { flag: '🇸🇴', name: 'Somalia' }, { flag: '🇿🇦', name: 'South Africa' },
  { flag: '🇰🇷', name: 'South Korea' }, { flag: '🇸🇸', name: 'South Sudan' }, { flag: '🇪🇸', name: 'Spain' },
  { flag: '🇱🇰', name: 'Sri Lanka' }, { flag: '🇸🇩', name: 'Sudan' }, { flag: '🇸🇷', name: 'Suriname' },
  { flag: '🇸🇪', name: 'Sweden' }, { flag: '🇨🇭', name: 'Switzerland' }, { flag: '🇸🇾', name: 'Syria' },
  { flag: '🇹🇼', name: 'Taiwan' }, { flag: '🇹🇯', name: 'Tajikistan' }, { flag: '🇹🇿', name: 'Tanzania' },
  { flag: '🇹🇭', name: 'Thailand' }, { flag: '🇹🇱', name: 'Timor-Leste' }, { flag: '🇹🇬', name: 'Togo' },
  { flag: '🇹🇴', name: 'Tonga' }, { flag: '🇹🇹', name: 'Trinidad and Tobago' }, { flag: '🇹🇳', name: 'Tunisia' },
  { flag: '🇹🇷', name: 'Turkey' }, { flag: '🇹🇲', name: 'Turkmenistan' }, { flag: '🇹🇻', name: 'Tuvalu' },
  { flag: '🇺🇬', name: 'Uganda' }, { flag: '🇺🇦', name: 'Ukraine' }, { flag: '🇦🇪', name: 'United Arab Emirates' },
  { flag: '🇬🇧', name: 'United Kingdom' }, { flag: '🇺🇸', name: 'United States' }, { flag: '🇺🇾', name: 'Uruguay' },
  { flag: '🇺🇿', name: 'Uzbekistan' }, { flag: '🇻🇺', name: 'Vanuatu' }, { flag: '🇻🇦', name: 'Vatican City' },
  { flag: '🇻🇪', name: 'Venezuela' }, { flag: '🇻🇳', name: 'Vietnam' }, { flag: '🇾🇪', name: 'Yemen' },
  { flag: '🇿🇲', name: 'Zambia' }, { flag: '🇿🇼', name: 'Zimbabwe' },
];

export const LANGUAGES: { name: string }[] = [
  { name: 'English' },
  { name: 'Norsk' },
  { name: 'Español' },
  { name: 'Français' },
  { name: 'Português' },
  { name: 'Svenska' },
  { name: 'Dansk' },
  { name: 'Afrikaans' }, { name: 'Shqip' }, { name: 'አማርኛ' }, { name: 'العربية' },
  { name: 'Հայերեն' }, { name: 'Azərbaycan' }, { name: 'Euskara' }, { name: 'Беларуская' },
  { name: 'বাংলা' }, { name: 'Bosanski' }, { name: 'Български' }, { name: 'Català' },
  { name: '中文（简体）' }, { name: '中文（繁體）' }, { name: 'Hrvatski' }, { name: 'Čeština' },
  { name: 'Nederlands' }, { name: 'Esperanto' }, { name: 'Eesti' }, { name: 'Suomi' },
  { name: 'Galego' }, { name: 'ქართული' }, { name: 'Deutsch' }, { name: 'Ελληνικά' },
  { name: 'ગુજરાતી' }, { name: 'Kreyòl ayisyen' }, { name: 'עברית' }, { name: 'हिन्दी' },
  { name: 'Magyar' }, { name: 'Íslenska' }, { name: 'Igbo' }, { name: 'Bahasa Indonesia' },
  { name: 'Gaeilge' }, { name: 'Italiano' }, { name: '日本語' }, { name: 'Basa Jawa' },
  { name: 'ಕನ್ನಡ' }, { name: 'Қазақша' }, { name: 'ខ្មែរ' }, { name: '한국어' },
  { name: 'Kurdî' }, { name: 'Кыргызча' }, { name: 'ລາວ' }, { name: 'Latviešu' },
  { name: 'Lietuvių' }, { name: 'Lëtzebuergesch' }, { name: 'Македонски' }, { name: 'Malagasy' },
  { name: 'Bahasa Melayu' }, { name: 'മലയാളം' }, { name: 'Malti' }, { name: 'Te Reo Māori' },
  { name: 'मराठी' }, { name: 'မြန်မာဘာသာ' }, { name: 'Монгол' }, { name: 'नेपाली' },
  { name: 'پښتو' }, { name: 'فارسی' }, { name: 'Polski' },
  { name: 'ਪੰਜਾਬੀ' }, { name: 'Română' }, { name: 'Русский' }, { name: 'Samoa' },
  { name: 'Српски' }, { name: 'Sesotho' }, { name: 'Shona' }, { name: 'سنڌي' },
  { name: 'සිංහල' }, { name: 'Slovenčina' }, { name: 'Slovenščina' }, { name: 'Soomaali' },
  { name: 'Basa Sunda' }, { name: 'Kiswahili' }, { name: 'Tagalog' }, { name: 'Тоҷикӣ' },
  { name: 'தமிழ்' }, { name: 'తెలుగు' }, { name: 'ภาษาไทย' }, { name: 'Türkçe' },
  { name: 'Türkmen' }, { name: 'Українська' }, { name: 'اردو' }, { name: 'Oʻzbekcha' },
  { name: 'Tiếng Việt' }, { name: 'Cymraeg' }, { name: 'isiXhosa' }, { name: 'יידיש' },
  { name: 'Yorùbá' }, { name: 'isiZulu' },
];

// ─── Reading: migrate() ──────────────────────────────────────────────────────

// Unknown fields are kept (spread first): data written by a newer app version or by the
// website (tripshare.online) must survive a save from this version.
// See plan/01-arkitektur.md (data contract) and plan/11-fallgruver.md #2.
function migrateStop(raw: any): Stop {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    ...r,
    id: r.id ?? uid(),
    name: r.name ?? '',
    notes: r.notes ?? '',
    address: r.address ?? '',
    images: Array.isArray(r.images) ? r.images : [],
  };
}

export function migrate(raw: any): TravelGuide {
  if (!raw || typeof raw !== 'object') return {} as TravelGuide;
  // Strip the password field that existed in older records
  const { password: _removed, ...rest } = raw;
  const sections: CustomSection[] = (rest.customSections ?? []).map((s: any) => ({
    ...s,
    id: s.id ?? uid(),
    title: s.title ?? '',
    type: s.type ?? 'list',
    items: s.items ?? [],
    checklistItems: s.checklistItems ?? [],
    note: s.note ?? '',
    images: s.images ?? [],
    accommodationUrl: s.accommodationUrl ?? '',
    accommodationImage: s.accommodationImage ?? '',
    accommodationName: s.accommodationName ?? '',
    accommodationAddress: s.accommodationAddress ?? '',
    accommodationLat: s.accommodationLat,
    accommodationLng: s.accommodationLng,
  }));
  const days: TripDay[] = (rest.days ?? []).map((d: any) => ({
    ...d,
    id: d.id ?? uid(),
    label: d.label ?? 'Day 1',
    stops: (d.stops ?? []).map(migrateStop),
    showRoute: d.showRoute !== false,
  }));
  const sectionOrder = rest.sectionOrder ?? [
    ...days.map((d: TripDay) => ({ kind: 'day' as const, id: d.id })),
    ...sections.map((s: CustomSection) => ({ kind: 'custom' as const, id: s.id })),
  ];
  return {
    ...rest,
    authorId: rest.authorId ?? 'user_team',
    title: rest.title ?? '',
    destination: rest.destination ?? '',
    country: rest.country ?? '',
    description: rest.description ?? '',
    coverImage: rest.coverImage ?? '',
    coverImageOffset: typeof rest.coverImageOffset === 'number'
      ? rest.coverImageOffset
      : rest.coverImagePosition === 'top' ? 0
      : rest.coverImagePosition === 'bottom' ? 100
      : 50,
    commentsDisabled: rest.commentsDisabled ?? false,
    language: rest.language ?? '',
    galleryImages: rest.galleryImages ?? [],
    tags: rest.tags ?? [],
    isPublic: rest.isPublic ?? true,
    isCompleted: rest.isCompleted ?? false,
    isDraft: rest.isDraft ?? false,
    // Guides completed before this feature existed count as already notified,
    // so toggling them doesn't spam followers with old news.
    publishNotified: rest.publishNotified ?? rest.isCompleted ?? false,
    accessCode: rest.accessCode ?? '',
    shareLink: rest.shareLink ?? '',
    upvotes: rest.upvotes ?? 0,
    views: rest.views ?? 0,
    authorName: rest.authorName ?? 'TripShare Team',
    generalTips: rest.generalTips ?? [],
    placesToVisit: (rest.placesToVisit ?? []).map(migrateStop),
    comments: [],
    days,
    customSections: sections,
    sectionOrder,
  } as TravelGuide;
}

// ─── Writing: validateGuide() and guideToRow() ───────────────────────────────

// Limits enforced by validateGuide(). The editors use them for maxLength, so a save is never
// silently rejected.
export const LIMITS = { title: 200, destination: 100, country: 100, description: 5000, tags: 12, days: 60 } as const;

export type GuideInvalidReason =
  | 'titleRequired' | 'titleTooLong' | 'destinationRequired' | 'destinationTooLong'
  | 'countryTooLong' | 'descriptionTooLong' | 'tooManyTags' | 'tooManyDays';

export function validateGuide(guide: TravelGuide): GuideInvalidReason | null {
  if (!guide.title?.trim()) return 'titleRequired';
  if (guide.title.length > LIMITS.title) return 'titleTooLong';
  if (!guide.destination?.trim()) return 'destinationRequired';
  if (guide.destination.length > LIMITS.destination) return 'destinationTooLong';
  if ((guide.country ?? '').length > LIMITS.country) return 'countryTooLong';
  if ((guide.description ?? '').length > LIMITS.description) return 'descriptionTooLong';
  if ((guide.tags ?? []).length > LIMITS.tags) return 'tooManyTags';
  if ((guide.days ?? []).length > LIMITS.days) return 'tooManyDays';
  return null;
}

// Only https URLs are ever persisted (no file://, blob:, data: or plain http). Background
// uploads replace local URIs once complete.
export function isRemote(uri: unknown): uri is string {
  return typeof uri === 'string' && uri.startsWith('https://');
}

export function stripLocalUris(guide: TravelGuide): TravelGuide {
  return {
    ...guide,
    coverImage: isRemote(guide.coverImage) ? guide.coverImage : '',
    galleryImages: (guide.galleryImages ?? []).filter(isRemote),
    days: (guide.days ?? []).map(d => ({
      ...d,
      stops: (d.stops ?? []).map(s => ({ ...s, images: (s.images ?? []).filter(isRemote) })),
    })),
    placesToVisit: (guide.placesToVisit ?? []).map(p => ({ ...p, images: (p.images ?? []).filter(isRemote) })),
    customSections: (guide.customSections ?? []).map(s => ({
      ...s,
      images: (s.images ?? []).filter(isRemote),
      accommodationImage: isRemote(s.accommodationImage) ? s.accommodationImage : '',
    })),
  };
}

// The row saved to Supabase. Runtime-only fields are stripped:
// upvotes → managed by the toggle_guide_upvote RPC (SQL column)
// comments → stored in the guide_comments table
// editedOn says where the save came from (data.lastEditedOn): 'app' or 'web'.
export function guideToRow(guide: TravelGuide, editedOn: 'app' | 'web') {
  const { upvotes: _u, comments: _c, ...guideData } = stripLocalUris(guide);
  const isPublic = guide.isPublic ?? true;
  return {
    id: guide.id,
    author_id: guide.authorId,
    title: guide.title.slice(0, LIMITS.title),
    destination: (guide.destination ?? '').slice(0, LIMITS.destination),
    country: (guide.country ?? '').slice(0, LIMITS.country),
    tags: guide.tags ?? [],
    is_completed: guide.isCompleted ?? false,
    is_draft: guide.isDraft ?? false,
    is_public: isPublic,
    updated_at: new Date().toISOString(),
    data: {
      ...guideData,
      // Public rows are readable by everyone. A code that has been visible there must not
      // unlock the guide later if it is made private again, so public guides carry no code.
      accessCode: isPublic ? '' : (guide.accessCode ?? ''),
      lastEditedOn: editedOn,
    },
  };
}

// ─── Creating a guide ────────────────────────────────────────────────────────

export interface NewGuideInput {
  authorId: string;
  authorName: string;
  destination: string;
  country: string;
  language: string;
  title: string;            // empty → "<destination> Guide" (English in every language, as in the app)
  tags: GuideTag[];
  isPublic: boolean;
  commentsDisabled: boolean;
  accessCode: string;       // what the user typed; ignored for public guides
  firstDayLabel: string;    // e.g. t('guideDetail.dayN', { n: 1 })
  randomBytes: (n: number) => Uint8Array;
}

/** Exactly the object the app's "Create guide" screen saves (a draft with one empty day). */
export function createEmptyGuide(input: NewGuideInput): TravelGuide {
  const code = input.accessCode.trim();
  const accessCode = input.isPublic ? '' : (code.length === 4 ? code.toUpperCase() : generateCode(input.randomBytes));
  const id = uid();
  return {
    id,
    authorId: input.authorId,
    authorName: input.authorName,
    title: input.title.trim() || `${input.destination.trim()} Guide`,
    destination: input.destination.trim(),
    country: input.country.trim(),
    language: input.language.trim(),
    commentsDisabled: input.commentsDisabled,
    coverImage: '',
    galleryImages: [],
    isCompleted: false,
    isDraft: true,
    description: '',
    tags: input.tags,
    isPublic: input.isPublic,
    accessCode,
    shareLink: `tripshare://guide/${id}`,
    upvotes: 0,
    views: 0,
    generalTips: [],
    days: [{ id: uid(), label: input.firstDayLabel, stops: [] }],
    placesToVisit: [],
    customSections: [],
    sectionOrder: [],
    comments: [],
    createdAt: new Date().toISOString(),
  };
}

// ─── Order of days and sections ──────────────────────────────────────────────
// Days and custom sections share one order (sectionOrder). An empty sectionOrder means
// "days first, then sections". Always write the whole order back (plan/11-fallgruver.md #5).

export function getOrder(g: TravelGuide): SectionOrderEntry[] {
  return g.sectionOrder?.length
    ? g.sectionOrder
    : [
        ...(g.days ?? []).map(d => ({ kind: 'day' as const, id: d.id })),
        ...(g.customSections ?? []).map(s => ({ kind: 'custom' as const, id: s.id })),
      ];
}

export function addDay(g: TravelGuide, label: string): TravelGuide {
  const newDay = { id: uid(), label, stops: [] };
  return { ...g, days: [...g.days, newDay], sectionOrder: [...getOrder(g), { kind: 'day' as const, id: newDay.id }] };
}

export function removeDay(g: TravelGuide, dayId: string): TravelGuide {
  return { ...g, days: g.days.filter(d => d.id !== dayId), sectionOrder: getOrder(g).filter(e => !(e.kind === 'day' && e.id === dayId)) };
}

/** A new custom section always carries every field (plan/06-fase-3-redigering.md, D). */
export function newCustomSection(title: string, type: SectionType, id: string = uid()): CustomSection {
  return { id, title, type, items: [], checklistItems: [], note: '', images: [], accommodationUrl: '', accommodationImage: '', accommodationName: '' };
}

export function addCustomSection(g: TravelGuide, section: CustomSection): TravelGuide {
  return { ...g, customSections: [...(g.customSections ?? []), section], sectionOrder: [...getOrder(g), { kind: 'custom' as const, id: section.id }] };
}

export function removeCustomSection(g: TravelGuide, id: string): TravelGuide {
  return { ...g, customSections: g.customSections.filter(s => s.id !== id), sectionOrder: getOrder(g).filter(e => !(e.kind === 'custom' && e.id === id)) };
}

export function moveBlock(g: TravelGuide, idx: number, dir: 1 | -1): TravelGuide {
  return { ...g, sectionOrder: moveItem(getOrder(g), idx, dir) };
}

// ─── Images ──────────────────────────────────────────────────────────────────

/** A finished upload: swap the local preview URI for the uploaded URL everywhere. */
export function replaceInGuide(g: TravelGuide, oldUri: string, newUri: string): TravelGuide {
  const rep = (u: string) => u === oldUri ? newUri : u;
  return {
    ...g,
    galleryImages: (g.galleryImages ?? []).map(rep),
    days: g.days.map(d => ({ ...d, stops: d.stops.map(s => ({ ...s, images: s.images.map(rep) })) })),
    customSections: g.customSections.map(s => ({
      ...s,
      images: s.images.map(rep),
      accommodationImage: rep(s.accommodationImage ?? ''),
    })),
  };
}

/** A failed upload: remove the local preview URI everywhere. */
export function removeFromGuide(g: TravelGuide, uri: string): TravelGuide {
  const fil = (arr: string[]) => arr.filter(u => u !== uri);
  return {
    ...g,
    galleryImages: fil(g.galleryImages ?? []),
    days: g.days.map(d => ({ ...d, stops: d.stops.map(s => ({ ...s, images: fil(s.images) })) })),
    customSections: g.customSections.map(s => ({
      ...s,
      images: fil(s.images),
      accommodationImage: s.accommodationImage === uri ? '' : (s.accommodationImage ?? ''),
    })),
  };
}
