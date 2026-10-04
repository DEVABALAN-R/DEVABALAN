import { DEFAULT_PORTFOLIO, type PortfolioData, type PortfolioCustomField, type PortfolioExperience, type PortfolioProject, type PortfolioSkill } from '@/features/portfolio/model/portfolio';

export const PORTFOLIO_KEY = 'devabalan.portfolio.v1';

export function hasStoredPortfolio(): boolean {
  return localStorage.getItem(PORTFOLIO_KEY) !== null;
}

export function normalizePortfolio(value: unknown): PortfolioData {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_PORTFOLIO;
    const stored = value as Partial<PortfolioData>;
    const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
    return { ...DEFAULT_PORTFOLIO, ...stored,
      fullName: text(stored.fullName, DEFAULT_PORTFOLIO.fullName), headline: text(stored.headline, DEFAULT_PORTFOLIO.headline),
      role: text(stored.role, DEFAULT_PORTFOLIO.role), city: text(stored.city, DEFAULT_PORTFOLIO.city), intro: text(stored.intro, DEFAULT_PORTFOLIO.intro),
      yearsExperience: text(stored.yearsExperience, DEFAULT_PORTFOLIO.yearsExperience), email: text(stored.email, DEFAULT_PORTFOLIO.email), phone: text(stored.phone, DEFAULT_PORTFOLIO.phone),
      linkedin: text(stored.linkedin, DEFAULT_PORTFOLIO.linkedin), github: text(stored.github), resumePath: text(stored.resumePath, DEFAULT_PORTFOLIO.resumePath), availability: text(stored.availability),
      recognition: text(stored.recognition, DEFAULT_PORTFOLIO.recognition), profileImage: text(stored.profileImage, DEFAULT_PORTFOLIO.profileImage), profileImagePositionX: Math.max(0, Math.min(100, Number(stored.profileImagePositionX ?? DEFAULT_PORTFOLIO.profileImagePositionX) || 0)), profileImagePositionY: Math.max(0, Math.min(100, Number(stored.profileImagePositionY ?? DEFAULT_PORTFOLIO.profileImagePositionY) || 0)), degree: text(stored.degree, DEFAULT_PORTFOLIO.degree), institution: text(stored.institution, DEFAULT_PORTFOLIO.institution),
      educationPeriod: text(stored.educationPeriod, DEFAULT_PORTFOLIO.educationPeriod), educationResult: text(stored.educationResult, DEFAULT_PORTFOLIO.educationResult),
      experience: Array.isArray(stored.experience) ? stored.experience.map((item: Partial<PortfolioExperience>) => ({ period: text(item?.period), title: text(item?.title), organization: text(item?.organization, text(item?.company)), project: text(item?.project), employmentType: text(item?.employmentType), location: text(item?.location), organizationUrl: text(item?.organizationUrl), summary: text(item?.summary), tags: text(item?.tags), current: Boolean(item?.current), impact: text(item?.impact), recognition: text(item?.recognition) })) : DEFAULT_PORTFOLIO.experience,
      projects: Array.isArray(stored.projects) ? stored.projects.map((item: Partial<PortfolioProject>) => ({ type: text(item?.type), title: text(item?.title), summary: text(item?.summary), stack: text(item?.stack), impact: text(item?.impact), liveUrl: text(item?.liveUrl), sourceUrl: text(item?.sourceUrl) })) : DEFAULT_PORTFOLIO.projects,
      skills: Array.isArray(stored.skills) ? stored.skills.map((item: Partial<PortfolioSkill>) => ({ name: text(item?.name), items: text(item?.items) })) : DEFAULT_PORTFOLIO.skills,
      certifications: Array.isArray(stored.certifications) ? stored.certifications.map((item: unknown) => text(item)).filter(Boolean) : DEFAULT_PORTFOLIO.certifications,
      customFields: Array.isArray(stored.customFields) ? stored.customFields.map((item: Partial<PortfolioCustomField>) => ({ label: text(item?.label), value: text(item?.value) })) : [],
    } as PortfolioData;
}

export function readPortfolio(): PortfolioData {
  try {
    return normalizePortfolio(JSON.parse(localStorage.getItem(PORTFOLIO_KEY) || 'null'));
  } catch {
    return DEFAULT_PORTFOLIO;
  }
}

export function savePortfolio(data: PortfolioData): void {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(data));
}
