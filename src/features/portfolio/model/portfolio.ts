export type PortfolioExperience = { period: string; title: string; organization: string; project: string; employmentType: string; location: string; organizationUrl: string; summary: string; impact: string; recognition: string; tags: string; current: boolean; company?: string };
export type PortfolioProject = { type: string; title: string; summary: string; stack: string; impact?: string; liveUrl?: string; sourceUrl?: string };
export type PortfolioSkill = { name: string; items: string };
export type PortfolioCustomField = { label: string; value: string };
export type PortfolioData = {
  fullName: string; headline: string; role: string; city: string; intro: string; yearsExperience: string;
  email: string; phone: string; linkedin: string; github?: string; resumePath: string; availability?: string;
  recognition: string; profileImage: string; profileImagePositionX: number; profileImagePositionY: number;
  experience: PortfolioExperience[]; projects: PortfolioProject[]; skills: PortfolioSkill[];
  certifications: string[]; degree: string; institution: string; educationPeriod: string; educationResult: string;
  customFields: PortfolioCustomField[];
};

export const DEFAULT_PORTFOLIO: PortfolioData = {
  fullName: 'Devabalan R',
  headline: 'Building useful things with thoughtful technology.',
  role: 'Software Engineer · Full-stack Developer',
  city: 'Puducherry, India',
  intro: 'I’m Devabalan — a full-stack developer working across Angular, Java, cloud platforms, and AI-enabled engineering workflows.',
  yearsExperience: '2+',
  email: 'devabalan1983@gmail.com',
  phone: '+91 63801 09648',
  linkedin: 'https://www.linkedin.com/in/devabalan-r-59067a19a/',
  github: '',
  availability: '',
  resumePath: '/Devabalan-R-Resume.pdf',
  recognition: 'Recognized with “Star of the Month” for dependable delivery, engineering quality, and contributions to production workflows.',
  profileImage: '/profile.jpg',
  profileImagePositionX: 50,
  profileImagePositionY: 18,
  experience: [
    { period: 'AUG 2025 — PRESENT', title: 'Angular Developer', organization: 'Rogers', project: 'Customer commerce', employmentType: 'Full-time', location: 'Puducherry, India · Remote', organizationUrl: '', summary: 'Building responsive purchase workflows for device catalogs, SIM selection, and package configuration. Connecting Angular experiences to Contentful and creating reusable UI patterns with Signals and RxJS.', impact: '', recognition: '', tags: 'Angular, NgRx, Contentful, RxJS', current: true },
    { period: 'MAY 2024 — AUG 2025', title: 'Software Engineer', organization: 'Tata Consultancy Services', project: 'Marks & Spencer', employmentType: 'Full-time', location: '', organizationUrl: '', summary: 'Developed Java and Spring Boot backend modules for scalable application services, supported production operations, and created an AI-assisted security workflow for earlier vulnerability detection and dependency remediation.', impact: '', recognition: '', tags: 'Java, Spring Boot, GitHub Actions, Snyk, Maven', current: false },
  ],
  projects: [
    { type: 'AI · DEVSECOPS', title: 'AI-assisted dependency upgrades', summary: 'A Maven upgrade workflow that combines AI-assisted remediation with GitHub Actions and Snyk to catch vulnerable dependencies earlier.', stack: 'Mistral AI, GitHub Actions, Snyk, Maven' },
    { type: 'ANGULAR · CMS', title: 'Composable commerce experiences', summary: 'Customer purchase journeys and device selection experiences, connected to Contentful so teams can manage content without code changes.', stack: 'Angular, NgRx, Contentful, RxJS' },
    { type: 'FULL STACK · API', title: 'Task management application', summary: 'A MEAN stack task manager with REST API integration and a focused interface for keeping work moving.', stack: 'MongoDB, Express, Angular, Node.js' },
  ],
  skills: [
    { name: 'Frontend', items: 'Angular · Signals · NgRx · RxJS · TypeScript · HTML & CSS' },
    { name: 'Backend & APIs', items: 'Java · Spring Boot · Microservices · REST APIs · Node.js' },
    { name: 'Cloud & CMS', items: 'Microsoft Azure · Contentful · MCP integrations' },
    { name: 'AI & DevSecOps', items: 'Agentic AI · Prompt engineering · GitHub Actions · Snyk · Maven' },
  ],
  certifications: ['Azure Developer Associate', 'Azure Security Engineer Associate', 'Pega Senior System Architect 8.7', 'Claude Developer Foundations', 'GitHub Copilot'],
  degree: 'Bachelor of Technology, Computer Science & Engineering',
  institution: 'Sri Manakula Vinayagar Engineering College',
  educationPeriod: '2019—2023',
  educationResult: '77.8%',
  customFields: [],
};
