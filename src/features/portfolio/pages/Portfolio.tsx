import React from 'react';
import { ArrowUpRight, Menu, LayoutDashboard } from 'lucide-react';
import type { PortfolioData } from '@/features/portfolio/model/portfolio';
import { PortfolioHero } from '@/features/portfolio/components/PortfolioHero';
import { PortfolioWork } from '@/features/portfolio/components/PortfolioWork';
import { PortfolioExperienceSection } from '@/features/portfolio/components/PortfolioExperience';
import { PortfolioAbout } from '@/features/portfolio/components/PortfolioAbout';
import { PortfolioContact } from '@/features/portfolio/components/PortfolioContact';
import '@/shared/styles/portfolio-v3.css';
import '@/shared/styles/portfolio-command.css';

type Props = { onOpenDashboard: () => void; data: PortfolioData };

export default function Portfolio({ onOpenDashboard, data }: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const pageRef = React.useRef<HTMLDivElement>(null);
  const initials = data.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'D';
  const projects = data.projects.filter((project) => project.title.trim());
  const experience = data.experience.filter((item) => item.title.trim() || item.organization.trim());
  const skills = data.skills.filter((skill) => skill.name.trim() || skill.items.trim());
  const certifications = data.certifications.map((item) => item.trim()).filter(Boolean);
  const customFields = data.customFields.filter((field) => field.label.trim() && field.value.trim());

  React.useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  React.useEffect(() => {
    const page = pageRef.current;
    if (!page || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setRevealed(true);
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    page.querySelectorAll('[data-portfolio-reveal]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 0);
      });
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', updateProgress); window.removeEventListener('resize', updateProgress); };
  }, []);

  return <div className={`portfolio-page portfolio-v3${revealed ? ' motion-ready' : ''}`} ref={pageRef}>
    <div className="folio-progress" aria-hidden="true"><span style={{ transform: `scaleX(${scrollProgress / 100})` }}/></div>
    <div className="folio-atmosphere" aria-hidden="true"><i/><i/><i/></div>
    <a className="folio-skip-link" href="#main-content">Skip to content</a>
    <header className="folio-header">
      <a className="folio-wordmark" href="#top" aria-label={`${data.fullName} home`}><span>{initials}</span><b>{data.fullName}</b></a>
      <button type="button" className="folio-menu" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-controls="portfolio-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Menu size={19}/></button>
      <nav id="portfolio-navigation" className={menuOpen ? 'folio-nav is-open' : 'folio-nav'} aria-label="Portfolio navigation">
        {projects.length > 0 && <a href="#work" onClick={() => setMenuOpen(false)}>Work</a>}
        {experience.length > 0 && <a href="#experience" onClick={() => setMenuOpen(false)}>Experience</a>}
        {(skills.length > 0 || certifications.length > 0 || customFields.length > 0 || data.degree || data.institution || data.educationPeriod || data.educationResult) && <a href="#about" onClick={() => setMenuOpen(false)}>About</a>}
        {(data.email || data.phone || data.linkedin || data.github) && <a className="folio-nav-contact" href="#contact" onClick={() => setMenuOpen(false)}>Get in touch <ArrowUpRight size={14}/></a>}
        <button type="button" className="folio-nav-dashboard" onClick={() => { setMenuOpen(false); onOpenDashboard(); }}><LayoutDashboard size={14}/> Dashboard</button>
      </nav>
    </header>

    <main id="main-content">
      <PortfolioHero data={data} initials={initials} hasProjects={projects.length > 0}/>
      <PortfolioWork projects={projects}/>
      <PortfolioExperienceSection experience={experience}/>
      <PortfolioAbout data={data} skills={skills} certifications={certifications} customFields={customFields}/>
      <PortfolioContact data={data}/>
    </main>
  </div>;
}
