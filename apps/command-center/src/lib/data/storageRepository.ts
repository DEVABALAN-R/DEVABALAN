import { currentSession, RpcError } from './rpc';
import { supabaseConfig } from './supabaseConfig';

/**
 * Uploads for the portfolio (images and the résumé) in the public `portfolio-media`
 * bucket. Storage policies allow writes only in the signed-in user's own folder, with
 * two-step sign-in, and never overwrite a file: each upload gets a new random name.
 */
export const MEDIA_BUCKET = 'portfolio-media';

export const mediaUrl = (path: string) =>
  supabaseConfig ? `${supabaseConfig.url}/storage/v1/object/public/${MEDIA_BUCKET}/${path}` : '';

async function storage(path: string, init: RequestInit): Promise<Response> {
  const { token } = await currentSession();
  if (!supabaseConfig) throw new RpcError(0, 'not_configured');
  let response: Response;
  try {
    response = await fetch(`${supabaseConfig.url}/storage/v1/${path}`, {
      ...init,
      headers: { apikey: supabaseConfig.key, Authorization: `Bearer ${token}`, ...init.headers },
    });
  } catch {
    throw new RpcError(0, 'network');
  }
  if (!response.ok) throw new RpcError(response.status, 'storage');
  return response;
}

/** The folder uploads must go in (the user's id). */
export const mediaFolder = async () => (await currentSession()).userId;

export async function uploadMedia(path: string, body: Blob, contentType: string): Promise<void> {
  await storage(`object/${MEDIA_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'x-upsert': 'false',
      'cache-control': 'max-age=31536000',
    },
    body,
  });
}

/** Files in the user's folder: name and upload time. */
export async function listMedia(folder: string): Promise<{ path: string; createdAt: string }[]> {
  const response = await storage(`object/list/${MEDIA_BUCKET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: `${folder}/`, limit: 1000, offset: 0 }),
  });
  const rows = (await response.json()) as { name?: string; created_at?: string }[];
  return rows
    .filter((row) => row.name)
    .map((row) => ({ path: `${folder}/${row.name}`, createdAt: row.created_at ?? '' }));
}

export async function removeMedia(paths: string[]): Promise<void> {
  if (!paths.length) return;
  await storage(`object/${MEDIA_BUCKET}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: paths }),
  });
}
