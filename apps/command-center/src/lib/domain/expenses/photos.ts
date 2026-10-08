/**
 * A receipt photo attached to a transaction. In the preview it lives in memory only;
 * from Phase 3 it is uploaded to the private `attachments` bucket (plan §8.5): served
 * through 60-second signed URLs, with location data stripped before upload.
 */
export type Photo = {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
  bytes: number;
};

export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/** Why a picked file cannot be attached, or null. */
export function photoError(mimeType: string | null | undefined, bytes: number): string | null {
  if (!mimeType || !PHOTO_TYPES.includes(mimeType.toLowerCase())) {
    return 'Choose a photo (JPEG, PNG, WebP or HEIC).';
  }
  if (bytes > PHOTO_MAX_BYTES) return 'That photo is larger than 10 MB.';
  return null;
}

/** Size of a `data:` URL's payload in bytes (web pickers do not always report it). */
export function dataUrlBytes(uri: string): number {
  const comma = uri.indexOf(',');
  if (!uri.startsWith('data:') || comma < 0) return 0;
  const payload = uri.slice(comma + 1);
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  return Math.floor((payload.length * 3) / 4) - padding;
}
