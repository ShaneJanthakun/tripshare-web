import type { SupabaseClient } from '@supabase/supabase-js';

// Profile photo (plan F5.5), as the app's picker: square (centre crop), quality 0.8, at most
// 1024 px, uploaded next to the guide photos (guide-images/covers/…) and saved as photo_url.
const SIDE = 1024;

export async function uploadAvatar(sb: SupabaseClient, file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const crop = Math.min(bitmap.width, bitmap.height);
  const side = Math.min(SIDE, crop);
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - crop) / 2, (bitmap.height - crop) / 2, crop, crop, 0, 0, side, side);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.8));
  const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const { error } = await sb.storage.from('guide-images').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return sb.storage.from('guide-images').getPublicUrl(path).data.publicUrl;
}
