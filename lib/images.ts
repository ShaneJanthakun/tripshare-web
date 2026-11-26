// Supabase storage images are resized via /render/image/ (plain /object/ URLs ignore size
// params). Same idea as thumbUrl() in the app. Other URLs (Unsplash) are returned unchanged.
export function renderUrl(url: string, width: number, height?: number, quality = 75): string {
  if (!url?.includes('/storage/v1/object/public/')) return url;
  const base = url.split('?')[0].replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  return `${base}?width=${width}${height ? `&height=${height}&resize=cover` : ''}&quality=${quality}`;
}
