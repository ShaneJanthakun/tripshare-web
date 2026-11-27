import type { SupabaseClient } from '@supabase/supabase-js';

// Photos from the browser (plan/01-arkitektur.md, Bilder): longest side at most 2048 px, JPEG
// 0.85, same bucket and naming as the app (guide-images/covers/<time>-<random>.jpg).
const MAX_SIDE = 2048;
const MAX_BYTES = 10 * 1024 * 1024;

export const isHeic = (file: File) => /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

/** Safari reads HEIC itself; Chrome and Firefox can't, so heic2any (≈1 MB) is loaded only then. */
async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch (e) {
    if (!isHeic(file)) throw e;
    const heic2any = (await import('heic2any')).default;
    const jpeg = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    return createImageBitmap(Array.isArray(jpeg) ? jpeg[0] : jpeg);
  }
}

async function toJpeg(file: File): Promise<Blob> {
  const bitmap = await decode(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.85));
}

export async function uploadImage(supabase: SupabaseClient, file: File): Promise<string> {
  const blob = await toJpeg(file);
  if (blob.size > MAX_BYTES) throw new Error('too large');
  const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const { error } = await supabase.storage.from('guide-images').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return supabase.storage.from('guide-images').getPublicUrl(path).data.publicUrl;
}

/** Image files from a file picker or a drop (anything else is ignored). */
export function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter(f => f.type.startsWith('image/') || isHeic(f));
}
