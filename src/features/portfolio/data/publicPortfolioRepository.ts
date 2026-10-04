import { supabase } from '@/shared/lib/supabaseClient';
import { normalizePortfolio } from './portfolioStorage';
import type { PortfolioData } from '@/features/portfolio/model/portfolio';

export const PORTFOLIO_SLUG = 'devabalan';
export class PortfolioConflictError extends Error {
  constructor() { super('The portfolio changed in another session. Reload it before saving again.'); this.name = 'PortfolioConflictError'; }
}

export async function loadPublicPortfolio(): Promise<{ profile: PortfolioData; revision: number } | null> {
  const { data, error } = await supabase.from('public_portfolios').select('profile, revision').eq('slug', PORTFOLIO_SLUG).eq('is_published', true).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { profile: normalizePortfolio(data.profile), revision: Number(data.revision) || 0 };
}

export async function savePublicPortfolio(userId: string, expectedRevision: number, profile: PortfolioData): Promise<number> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user || user.id !== userId) throw new Error('Your session changed. Sign in again to save your portfolio.');
  const { data, error } = await supabase.rpc('save_public_portfolio', {
    p_expected_revision: expectedRevision,
    p_slug: PORTFOLIO_SLUG,
    p_profile: profile,
  });
  if (error) throw error;
  const revision = Array.isArray(data) ? Number(data[0]) : Number(data);
  if (!Number.isFinite(revision) || revision <= expectedRevision) throw new PortfolioConflictError();
  return revision;
}
