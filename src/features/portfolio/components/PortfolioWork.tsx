import React from 'react';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import type { PortfolioProject } from '@/features/portfolio/model/portfolio';

function externalHref(value?: string) {
  if (!value) return '';
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''; } catch { return ''; }
}

export function PortfolioWork({ projects }: { projects: PortfolioProject[] }) {
  if (!projects.length) return null;
  const tags = [...new Set(projects.flatMap((project) => project.stack.split(',').map((tag) => tag.trim()).filter(Boolean)))];
  const [activeTag, setActiveTag] = React.useState('All');
  const sectionRef = React.useRef<HTMLElement>(null);
  const visibleProjects = activeTag === 'All' ? projects : projects.filter((project) => project.stack.split(',').map((tag) => tag.trim()).includes(activeTag));
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => sectionRef.current?.querySelectorAll('[data-portfolio-reveal]').forEach((element) => element.classList.add('is-visible')));
    return () => cancelAnimationFrame(frame);
  }, [activeTag]);
  return <section className="folio-work" id="work" ref={sectionRef}>
    <div className="folio-section-head" data-portfolio-reveal><div><span className="folio-index">SELECTED WORK</span><h2>Selected work</h2></div><div className="folio-work-controls"><p>Explore projects by technology and focus area.</p><div className="folio-project-filters" role="group" aria-label="Filter projects by technology"><button type="button" aria-pressed={activeTag === 'All'} className={activeTag === 'All' ? 'active' : ''} onClick={() => setActiveTag('All')}>All work</button>{tags.map((tag) => <button type="button" key={tag} aria-pressed={activeTag === tag} className={activeTag === tag ? 'active' : ''} onClick={() => setActiveTag(tag)}>{tag}</button>)}</div></div></div>
    <div className="folio-project-list" aria-live="polite">{visibleProjects.map((project, index) => {
      const live = externalHref(project.liveUrl); const source = externalHref(project.sourceUrl);
      const tags = project.stack.split(',').map((tag) => tag.trim()).filter(Boolean);
      return <article className={`folio-project folio-project-${index % 3}`} key={`${project.title}-${index}`} data-portfolio-reveal onPointerMove={(event) => { if (event.pointerType !== 'mouse') return; const bounds = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`); event.currentTarget.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`); }} onPointerLeave={(event) => { event.currentTarget.style.setProperty('--spot-x', '50%'); event.currentTarget.style.setProperty('--spot-y', '50%'); }}>
        <div className="folio-project-visual" aria-hidden="true"><span className="folio-project-number">{String(index + 1).padStart(2, '0')}</span><div className="folio-project-glyph"><i/><i/><i/><i/></div></div>
        <div className="folio-project-copy"><div className="folio-project-topline">{project.type && <span>{project.type}</span>}{live && <a href={live} target="_blank" rel="noreferrer" aria-label={`Open ${project.title}`}><ArrowUpRight size={16}/></a>}</div><h3>{project.title}</h3>{project.summary && <p>{project.summary}</p>}{project.impact && <p className="folio-project-impact"><b>Outcome</b>{project.impact}</p>}{tags.length > 0 && <div className="folio-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
          {(live || source) && <div className="folio-project-links">{live && <a href={live} target="_blank" rel="noreferrer">View project <ExternalLink size={12}/></a>}{source && <a href={source} target="_blank" rel="noreferrer">Source code <ExternalLink size={12}/></a>}</div>}
        </div>
      </article>;
    })}</div>
  </section>;
}
