import { GraduationCap } from 'lucide-react';
import type { PortfolioCustomField, PortfolioData, PortfolioSkill } from '@/features/portfolio/model/portfolio';

export function PortfolioAbout({ data, skills, certifications, customFields }: { data: PortfolioData; skills: PortfolioSkill[]; certifications: string[]; customFields: PortfolioCustomField[] }) {
  const hasEducation = Boolean(data.degree || data.institution || data.educationPeriod || data.educationResult);
  const hasToolkit = Boolean(skills.length || certifications.length);
  if (!skills.length && !certifications.length && !customFields.length && !hasEducation) return null;
  return <section className={`folio-about${hasEducation ? '' : ' is-single'}`} id="about">
    <div className="folio-about-main" data-portfolio-reveal><span className="folio-index">ABOUT</span><h2>{hasToolkit ? <>My toolkit &amp;<br/><em>background.</em></> : <>A little more<br/><em>about me.</em></>}</h2>
      {skills.length > 0 && <div className="folio-skill-grid">{skills.map((skill, index) => <article className="folio-skill" key={`${skill.name}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><div>{skill.name && <h3>{skill.name}</h3>}{skill.items && <p>{skill.items}</p>}</div></article>)}</div>}
      {certifications.length > 0 && <div className="folio-certifications"><span className="folio-index">CERTIFICATIONS</span><div>{certifications.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div></div>}
      {customFields.length > 0 && <div className="folio-custom-fields">{customFields.map((field, index) => <div key={`${field.label}-${index}`}><span>{field.label || 'DETAIL'}</span><strong>{field.value}</strong></div>)}</div>}
    </div>
    {hasEducation && <aside className="folio-education" data-portfolio-reveal><span className="folio-education-icon"><GraduationCap size={20}/></span><span className="folio-index">EDUCATION</span>{data.educationPeriod && <small>{data.educationPeriod}</small>}{data.degree && <h3>{data.degree}</h3>}{data.institution && <p>{data.institution}</p>}{data.educationResult && <span className="folio-result">{data.educationResult}</span>}</aside>}
  </section>;
}
