import { BriefcaseBusiness, Plus, Trash2 } from 'lucide-react';
import type { PortfolioExperience } from '@/features/portfolio/model/portfolio';

type Props = { value: PortfolioExperience[]; onChange: (items: PortfolioExperience[]) => void };

const emptyExperience = (): PortfolioExperience => ({
  period: '', title: '', organization: '', project: '', employmentType: '', location: '', organizationUrl: '',
  summary: '', impact: '', recognition: '', tags: '', current: false,
});

export default function PortfolioExperienceEditor({ value, onChange }: Props) {
  const update = (index: number, key: keyof PortfolioExperience, next: string | boolean) =>
    onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: next } : item));

  return <section className="editor-card experience-editor-card">
    <div className="editor-card-heading"><span className="editor-section-icon"><BriefcaseBusiness size={17}/></span><div><h2>Experience</h2><p>Show where you worked, what you delivered, and recognition earned at each organization.</p></div><button type="button" className="editor-add-button" onClick={() => onChange([...value, emptyExperience()])}><Plus size={14}/> Add experience</button></div>
    <div className="editor-repeat-list">{value.map((item, index) => <article className="editor-repeat-card experience-edit-card" key={index}>
      <div className="editor-repeat-title"><span><strong>POSITION {String(index + 1).padStart(2, '0')}</strong>{item.current && <em>Current role</em>}</span><button type="button" className="editor-remove-button" onClick={() => { if (window.confirm(`Remove ${item.title || `position ${index + 1}`} from the portfolio draft?`)) onChange(value.filter((_, itemIndex) => itemIndex !== index)); }} aria-label={`Remove ${item.title || `position ${index + 1}`}`}><Trash2 size={14}/></button></div>
      <div className="editor-fields-grid">
        <label className="portfolio-field"><span>Job title</span><input value={item.title} onChange={(event) => update(index, 'title', event.target.value)} placeholder="e.g. Software Engineer"/></label>
        <label className="portfolio-field"><span>Organization name</span><input value={item.organization} onChange={(event) => update(index, 'organization', event.target.value)} placeholder="Company or organization"/></label>
        <label className="portfolio-field"><span>Period</span><input value={item.period} onChange={(event) => update(index, 'period', event.target.value)} placeholder="e.g. May 2024 – Aug 2025"/></label>
        <label className="portfolio-field"><span>Employment type</span><input value={item.employmentType} onChange={(event) => update(index, 'employmentType', event.target.value)} placeholder="Full-time, contract, internship"/></label>
        <label className="portfolio-field"><span>Project, client, or team</span><input value={item.project} onChange={(event) => update(index, 'project', event.target.value)} placeholder="e.g. Customer commerce"/></label>
        <label className="portfolio-field"><span>Location / work mode</span><input value={item.location} onChange={(event) => update(index, 'location', event.target.value)} placeholder="City · Hybrid / Remote"/></label>
        <label className="portfolio-field"><span>Organization website · optional</span><input type="url" value={item.organizationUrl} onChange={(event) => update(index, 'organizationUrl', event.target.value)} placeholder="https://"/></label>
        <label className="portfolio-field"><span>Technologies · comma separated</span><input value={item.tags} onChange={(event) => update(index, 'tags', event.target.value)} placeholder="Angular, TypeScript, RxJS"/></label>
        <label className="portfolio-field is-multiline"><span>Role overview</span><textarea rows={3} value={item.summary} onChange={(event) => update(index, 'summary', event.target.value)} placeholder="Describe your responsibilities, scope, and collaborators."/></label>
        <label className="portfolio-field is-multiline"><span>Key contribution / measurable impact · optional</span><textarea rows={2} value={item.impact} onChange={(event) => update(index, 'impact', event.target.value)} placeholder="What improved because of your work? Add measurable results when available."/></label>
        <label className="portfolio-field is-multiline"><span>Recognition or award at this organization · optional</span><textarea rows={2} value={item.recognition} onChange={(event) => update(index, 'recognition', event.target.value)} placeholder="Award name and why it was awarded. Leave blank if none."/></label>
        <label className="editor-checkbox"><input type="checkbox" checked={item.current} onChange={(event) => update(index, 'current', event.target.checked)}/><span>Mark as current position</span></label>
      </div>
    </article>)}</div>
  </section>;
}
