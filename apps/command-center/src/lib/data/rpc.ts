import { getAuth } from './supabaseClient';
import { supabaseConfig } from './supabaseConfig';

/** The database functions the app may call (anything else is refused before sending). */
export type RpcName =
  | 'load_ledger'
  | 'sync_ledger'
  | 'load_market'
  | 'search_funds'
  | 'search_securities'
  | 'nav_on'
  | 'import_legacy_workspace';

/** The Edge Functions the app may call. */
export type FunctionName = 'market-refresh';

/** A failed call. Holds only the HTTP status and Postgres error code: never the payload. */
export class RpcError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
  ) {
    super(`Request failed (${status}${code ? ` ${code}` : ''})`);
    this.name = 'RpcError';
  }

  /** Worth retrying later (offline, server busy, session refresh), not a rejected change. */
  get retryable(): boolean {
    return (
      this.status === 0 ||
      this.status === 401 ||
      this.status === 408 ||
      this.status === 429 ||
      this.status >= 500
    );
  }
}

/**
 * Calls a Postgres function through Supabase's Data API as the signed-in user, so Row
 * Level Security applies. A small fetch instead of the full client library keeps the
 * bundle lean; only the publishable key and the user's access token are sent.
 */
export async function callRpc<T>(name: RpcName, args: Record<string, unknown> = {}): Promise<T> {
  return post<T>(`rest/v1/rpc/${name}`, args);
}

/**
 * Calls one of the project's Edge Functions as the signed-in user (the function checks
 * the token itself). A 404 means the function has not been deployed.
 */
export async function callFunction<T>(name: FunctionName, body: Record<string, unknown> = {}) {
  return post<T>(`functions/v1/${name}`, body);
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const auth = getAuth();
  if (!auth || !supabaseConfig) throw new RpcError(0, 'not_configured');
  let token: string | undefined;
  try {
    token = (await auth.getSession()).data.session?.access_token;
  } catch {
    throw new RpcError(0, 'no_session');
  }
  if (!token) throw new RpcError(401, 'no_session');
  let response: Response;
  try {
    response = await fetch(`${supabaseConfig.url}/${path}`, {
      method: 'POST',
      headers: {
        apikey: supabaseConfig.key,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new RpcError(0, 'network');
  }
  if (!response.ok) {
    let code: string | undefined;
    try {
      code = ((await response.json()) as { code?: string }).code;
    } catch {
      // No JSON body.
    }
    throw new RpcError(response.status, code);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
