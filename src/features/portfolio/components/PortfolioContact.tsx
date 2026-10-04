import { ArrowDown, ArrowUpRight, ExternalLink, Mail, MapPin } from 'lucide-react';
import type { PortfolioData } from '@/features/portfolio/model/portfolio';

function externalHref(value?: string) {
  if (!value) return '';
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''; } catch { return ''; }
}

function downloadHref(value?: string) {
  if (!value) return '';
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  return externalHref(value);
}

export function PortfolioContact({ data }: { data: PortfolioData }) {
  const linkedin = externalHref(data.linkedin); const github = externalHref(data.github); const resume = downloadHref(data.resumePath);
  const hasContact = Boolean(data.email || data.phone || linkedin || github || resume);
  const hasSideContent = Boolean(data.city || data.phone || linkedin || github || resume);
  return <>
    {hasContact && <section className={`folio-footer${hasSideContent ? '' : ' single-contact'}`} id="contact" aria-label="Contact"><div className="folio-footer-main"><span className="folio-index">CONTACT</span><h2>Let’s talk about<br/><em>what’s next.</em></h2>{data.email && <a className="folio-email" href={`mailto:${data.email}`}><Mail size={17}/>{data.email}<ArrowUpRight size={15}/></a>}</div>{hasSideContent && <div className="folio-footer-side">{data.city && <><span>BASED IN</span><strong><MapPin size={13}/>{data.city}</strong></>}{data.phone && <a href={`tel:${data.phone.replace(/[^+\d]/g, '')}`}>{data.phone}</a>}{linkedin && <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn <ExternalLink size={12}/></a>}{github && <a href={github} target="_blank" rel="noreferrer">GitHub <ExternalLink size={12}/></a>}{resume && <a href={resume} download>Download résumé <ArrowDown size={12}/></a>}</div>}</section>}
    <footer className="folio-bottomline"><a className="folio-wordmark" href="#top"><span>{data.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'D'}</span><b>{data.fullName}</b></a><small>Designed with intent. Built with care.</small><small>© {new Date().getFullYear()}</small></footer>
  </>;
}
