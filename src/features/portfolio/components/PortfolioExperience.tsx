import { Award } from 'lucide-react';
import type { PortfolioExperience as Experience } from '@/features/portfolio/model/portfolio';

export function PortfolioExperienceSection({ experience }: { experience: Experience[] }) {
  if (!experience.length) return null;
  return <section className="folio-experience" id="experience">
    <div className="folio-section-head" data-portfolio-reveal><div><span className="folio-index">EXPERIENCE</span><h2>Where I’ve worked</h2></div><p>Professional experience across product engineering, customer journeys, backend services, and delivery tooling.</p></div>
    <div className="folio-timeline">{experience.map((item, index) => {
      const organizationLink = /^https?:\/\//i.test(item.organizationUrl) ? item.organizationUrl : '';
      const tags = item.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
      return <article className="folio-role" key={`${item.organization}-${item.title}-${index}`} data-portfolio-reveal>
        <div className="folio-role-period">{item.period}</div><div className="folio-role-marker"><span/></div>
        <div className="folio-role-detail">
          <div className="folio-role-title"><div><h3>{item.title}</h3><p>{organizationLink ? <a href={organizationLink} target="_blank" rel="noreferrer">{item.organization}</a> : item.organization}{item.project && <><span> · </span><span className="folio-project-label">{item.project}</span></>}</p></div>{item.current && <span className="folio-current">CURRENT</span>}</div>
          {(item.employmentType || item.location) && <div className="folio-role-meta">{item.employmentType && <span>{item.employmentType}</span>}{item.location && <span>{item.location}</span>}</div>}
          {item.summary && <p className="folio-role-summary">{item.summary}</p>}
          {item.impact && <p className="folio-role-impact"><b>Impact</b>{item.impact}</p>}
          {item.recognition && <div className="folio-role-recognition"><Award size={15}/><div><b>RECOGNITION</b><p>{item.recognition}</p></div></div>}
          {tags.length > 0 && <div className="folio-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        </div>
      </article>;
    })}</div>
  </section>;
}
