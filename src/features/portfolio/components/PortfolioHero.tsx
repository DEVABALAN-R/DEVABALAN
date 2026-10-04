import { ArrowDownRight, ArrowUpRight, MapPin } from 'lucide-react';
import type { PortfolioData } from '@/features/portfolio/model/portfolio';

function downloadHref(value: string) {
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''; } catch { return ''; }
}

export function PortfolioHero({ data, initials, hasProjects }: { data: PortfolioData; initials: string; hasProjects: boolean }) {
  const resume = downloadHref(data.resumePath);
  return <section className="folio-hero" id="top">
    <div className="folio-hero-copy" data-portfolio-reveal>
      <span className="folio-eyebrow"><i/><strong>{data.fullName}</strong>{data.role && <><b>·</b>{data.role}</>}{data.city && <><b>·</b>{data.city}</>}</span>
      <h1>{data.headline}</h1>
      <p className="folio-intro">{data.intro}</p>
      {data.availability && <p className="folio-availability"><i/>{data.availability}</p>}
      <div className="folio-hero-actions">{hasProjects && <a className="folio-primary" href="#work">Explore selected work <ArrowDownRight size={16}/></a>}{resume && <a className="folio-resume" href={resume} download>Résumé <ArrowUpRight size={14}/></a>}</div>
      {data.yearsExperience && <div className="folio-hero-meta"><span>{data.yearsExperience} years of experience</span></div>}
    </div>
    <div className="folio-hero-portrait" data-portfolio-reveal>
      <div className="folio-portrait-frame">{data.profileImage ? <img src={data.profileImage} alt={`Portrait of ${data.fullName}`} fetchPriority="high" decoding="async" style={{ objectPosition: `${data.profileImagePositionX}% ${data.profileImagePositionY}%` }}/> : <span>{initials}</span>}</div>
      <div className="folio-portrait-orbit orbit-a"/><div className="folio-portrait-orbit orbit-b"/>
      {data.city && <div className="folio-portrait-caption"><span>BASED IN</span><strong><MapPin size={13}/>{data.city}</strong></div>}
    </div>
  </section>;
}
