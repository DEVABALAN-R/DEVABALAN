-- Command Center: your portfolio's starting content, taken from your résumé (CV 08-2025).
-- Committed at the owner's request (public repository; the content is meant to be public once
-- published). Run once in Supabase -> SQL Editor, after migration 0010.
--
-- * Loads the dashboard's working copy only. Nothing is public until you press Publish in
--   Dashboard -> Portfolio (check everything in Preview first).
-- * Your phone number is not included. Your email is set as the public contact address:
--   remove it in Portfolio -> Profile before publishing if you prefer the form only.
-- * Written from the résumé only: update "Years at TCS" (the résumé says 2.5 years as of
--   Aug 2025), add certificate dates and links, and add a photo and résumé PDF.
-- * "Command Center" is added as a draft (hidden) with no links: its repository is public
--   and holds your personal finance data, so decide before linking or showing it.
-- * Refuses to run if the portfolio already has content (so it never overwrites edits).

begin;

select set_config('request.jwt.claims', pg_catalog.json_build_object(
  'sub', (select u.id from auth.users u where pg_catalog.lower(u.email) = pg_catalog.lower('devabalan1983@gmail.com')),
  'role', 'authenticated', 'aal', 'aal2')::text, true);
do $$
begin
  if auth.uid() is null then raise exception 'No account with that email: edit the email above'; end if;
end $$;
set local role authenticated;

do $$
declare
  g jsonb;
begin
  if exists (select 1 from public.portfolio_profile)
     or exists (select 1 from public.portfolio_projects)
     or exists (select 1 from public.portfolio_skill_groups) then
    raise exception 'Your portfolio already has content: nothing was changed.';
  end if;

  -- Profile -----------------------------------------------------------------------------
  perform public.portfolio_save('profile', jsonb_build_object(
    'handle', 'devabalan',
    'full_name', 'Devabalan R',
    'title', 'Full-Stack Developer',
    'headline', 'I build Spring Boot services, Angular interfaces and the AI automation around them.',
    'rotating_words', jsonb_build_array('Spring Boot microservices', 'Angular interfaces', 'agentic AI workflows', 'DevSecOps automation'),
    'intro', 'Full-stack developer (Java/Spring Boot and Angular) at Tata Consultancy Services, developing responsive applications and microservices. Skilled in cloud technologies, CMS integrations, prompt engineering and building agentic AI solutions.',
    'about', E'I''m a full-stack developer at Tata Consultancy Services, working across **Java/Spring Boot** back ends and **Angular** front ends.\n\nOn the Marks & Spencer account I developed and enhanced core backend modules for scalable application services and supported production systems, resolving critical business-as-usual issues quickly. On the Rogers account I build customer purchase workflows in Angular with NgRx, and I am the team''s single point of contact for Contentful CMS.\n\nI like automating the tedious parts: an AI-driven workflow that combines GitHub Actions, Maven and Snyk to catch vulnerable dependencies early, and the Contentful Model Context Protocol (MCP) integration for AI-driven content workflows.\n\n> Passionate learner with a strong ability to acquire new knowledge quickly.',
    'location', 'Pondicherry, India',
    'timezone', 'Asia/Kolkata',
    'public_email', 'devabalan1983@gmail.com',
    'availability', 'hidden',
    'seo_description', 'Full-stack developer (Java/Spring Boot and Angular) building microservices, responsive applications and agentic AI workflows.',
    'hidden_sections', jsonb_build_array()));

  -- Links ---------------------------------------------------------------------------------
  perform public.portfolio_save('link', '{"kind":"github","label":"GitHub","url":"https://github.com/DEVABALAN-R"}');
  perform public.portfolio_save('link', '{"kind":"linkedin","label":"LinkedIn","url":"https://www.linkedin.com/in/devabalan-r-59067a19a"}');

  -- Numbers and highlights -----------------------------------------------------------------
  perform public.portfolio_save('fact', '{"kind":"stat","label":"Years at TCS","value":2.5,"suffix":"+"}');
  perform public.portfolio_save('fact', '{"kind":"stat","label":"Certifications","value":5}');
  perform public.portfolio_save('fact', '{"kind":"stat","label":"Star of the Month awards","value":2}');
  perform public.portfolio_save('fact', jsonb_build_object('kind', 'highlight', 'label', 'AI-driven security automation',
    'detail', 'Designed a workflow combining GitHub Actions, Maven and Snyk to detect vulnerable dependencies early, with AI-assisted remediation that reduced manual fixes.'));
  perform public.portfolio_save('fact', jsonb_build_object('kind', 'highlight', 'label', 'Contentful point of contact',
    'detail', 'Single point of contact for Contentful CMS across the team, driving the Contentful MCP integration for AI-driven workflows.'));
  perform public.portfolio_save('fact', jsonb_build_object('kind', 'highlight', 'label', 'Reusable UI libraries',
    'detail', 'Component libraries built with Angular Signals and RxJS that enforce design-system standards and speed up sprint deliveries.'));

  -- Skills (no levels: add them in the dashboard only if you want them shown) ----------------
  g := public.portfolio_save('skill_group', '{"name":"Programming"}');
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Java', 'icon', 'code-xml', 'featured', true));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'JavaScript', 'icon', 'braces'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Python', 'icon', 'terminal'));

  g := public.portfolio_save('skill_group', '{"name":"Backend"}');
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Spring Boot', 'icon', 'server', 'featured', true));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Microservices', 'icon', 'network'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'RESTful APIs', 'icon', 'braces'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Node.js', 'icon', 'server'));

  g := public.portfolio_save('skill_group', '{"name":"Frontend"}');
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Angular', 'icon', 'layout-dashboard', 'featured', true));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Angular Signals', 'icon', 'sparkles'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'NgRx', 'icon', 'layers'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'RxJS', 'icon', 'workflow'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'HTML/CSS', 'icon', 'palette'));

  g := public.portfolio_save('skill_group', '{"name":"CMS & Cloud"}');
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Contentful CMS', 'icon', 'layers', 'featured', true));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Contentful MCP', 'icon', 'workflow'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Microsoft Azure', 'icon', 'cloud'));

  g := public.portfolio_save('skill_group', '{"name":"Databases & Tools"}');
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'MongoDB', 'icon', 'database'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Git', 'icon', 'git-branch'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Postman', 'icon', 'globe'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Dynatrace', 'icon', 'gauge'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Pega', 'icon', 'workflow'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'SonarQube', 'icon', 'shield-check'));

  g := public.portfolio_save('skill_group', '{"name":"AI & DevSecOps"}');
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Agentic AI', 'icon', 'brain-circuit', 'featured', true));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Prompt Engineering', 'icon', 'sparkles'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'GitHub Copilot', 'icon', 'bot'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'GitHub Actions', 'icon', 'workflow'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Snyk', 'icon', 'shield-check'));
  perform public.portfolio_save('skill', jsonb_build_object('group_id', g ->> 'id', 'name', 'Maven', 'icon', 'box'));

  -- Projects ------------------------------------------------------------------------------
  perform public.portfolio_save('project', jsonb_build_object(
    'slug', 'maven-dependency-automation',
    'title', 'AI-powered Maven dependency upgrades',
    'tagline', 'Finding vulnerable dependencies early and fixing them with AI-assisted upgrades.',
    'summary', 'A GitHub Actions workflow that scans Maven dependencies with the Snyk CLI, proposes upgrades with AI assistance (Mistral AI) and reports the results, so vulnerabilities are caught early and fewer fixes are manual.',
    'body', E'Dependency upgrades are easy to postpone and expensive to forget. This workflow runs in **GitHub Actions** on every change:\n\n- the **Snyk CLI** checks the Maven dependency tree for known vulnerabilities;\n- an AI step (**Mistral AI**) proposes upgrade paths for what it finds;\n- Python scripts collect the results into an automated report.\n\nIt turned security checks from an occasional manual task into part of the CI/CD pipeline.',
    'category', 'DevSecOps',
    'status', 'completed',
    'period', 'Jul 2025',
    'tech', jsonb_build_array('Python', 'GitHub Actions', 'Snyk CLI', 'Maven', 'Mistral AI'),
    'features', jsonb_build_array('Vulnerability detection with the Snyk CLI', 'AI-assisted dependency upgrades', 'CI/CD pipeline in GitHub Actions', 'Automated reporting'),
    'featured', true,
    'accent', 'lime'));
  perform public.portfolio_save('project', jsonb_build_object(
    'slug', 'mean-task-manager',
    'title', 'MEAN stack task manager',
    'tagline', 'A task management application on MongoDB, Express.js, Angular and Node.js.',
    'summary', 'A task manager built end to end on the MEAN stack, with a RESTful API and an Angular user interface.',
    'category', 'Full-stack',
    'status', 'completed',
    'period', 'May 2022',
    'tech', jsonb_build_array('MongoDB', 'Express.js', 'Angular', 'Node.js'),
    'features', jsonb_build_array('RESTful API integration', 'User interface design'),
    'featured', true,
    'accent', 'ion'));
  perform public.portfolio_save('project', jsonb_build_object(
    'slug', 'angular-crud-app',
    'title', 'Angular CRUD application',
    'tagline', 'Create, read, update and delete against an API from an Angular front end.',
    'summary', 'A basic CRUD application with Angular and an API, focused on API integration and front-end development.',
    'category', 'Frontend',
    'status', 'completed',
    'period', 'Apr 2022',
    'tech', jsonb_build_array('Angular', 'REST API'),
    'features', jsonb_build_array('API integration', 'Front-end development'),
    'accent', 'violet'));
  perform public.portfolio_save('project', jsonb_build_object(
    'slug', 'command-center',
    'title', 'Command Center',
    'tagline', 'A personal finance and life dashboard for web, iOS and Android.',
    'summary', 'One Expo codebase for web and phones with an expense manager, mutual fund and stock tracking, notes, and this portfolio, all saved to Supabase behind two-step sign-in.',
    'body', E'### What it does\n\n- Expense manager with budgets, people and splits, and receipt photos\n- Mutual funds and stocks with first-in-first-out gains and XIRR\n- Notes with checklists, labels and pins\n- The editor and publishing for this portfolio\n\n### How it is built\n\nExpo Router and React Native Web for one codebase; Supabase for sign-in, Postgres and storage. Every table uses Row Level Security, accounts with a second factor need it for every read and write, and market prices are fetched on the server by an Edge Function.',
    'category', 'Full-stack',
    'status', 'in_progress',
    'role', 'Solo developer',
    'period', '2026',
    'tech', jsonb_build_array('TypeScript', 'React Native', 'Expo', 'PostgreSQL', 'Supabase', 'Deno'),
    'features', jsonb_build_array('Two-step sign-in (TOTP) and Row Level Security on every table', 'Expense manager with budgets, splits and receipts', 'Mutual fund and stock tracking with XIRR', 'Server-side price updates (Edge Function)', 'Portfolio editor with preview and publish'),
    'featured', true,
    'accent', 'ember',
    'visible', false));

  -- Experience -----------------------------------------------------------------------------
  perform public.portfolio_save('experience', jsonb_build_object(
    'company', 'Tata Consultancy Services',
    'client', 'Rogers',
    'role', 'Angular Developer',
    'started_on', '2025-08-19',
    'responsibilities', jsonb_build_array(
      'Implemented new customer purchase workflows in Angular using NgRx for device catalogues, SIM selection and package configuration, improving in-store sales efficiency.',
      'Integrated Contentful CMS with Angular, enabling dynamic content updates, removing hard-coded asset updates and letting marketing teams manage content independently.',
      'Created reusable UI component libraries with Angular Signals and RxJS, enforcing design-system standards and speeding up sprint deliveries.'),
    'highlights', jsonb_build_array(
      'Contentful SPOC and MCP integration: single point of contact for Contentful CMS across the team, driving the Contentful Model Context Protocol integration for AI-driven workflows.',
      'Architectural optimisation: refactored Contentful data mapping from legacy index-based positioning to a robust ID-based structure using Angular Signals and strict coding standards.'),
    'achievements', jsonb_build_array('Star of the Month: for the Contentful mapping migration, high coding standards and resolving critical data-rendering issues.'),
    'tech', jsonb_build_array('Angular', 'JavaScript', 'NgRx', 'Java', 'Contentful')));
  perform public.portfolio_save('experience', jsonb_build_object(
    'company', 'Tata Consultancy Services',
    'client', 'Marks & Spencer Plc',
    'role', 'Engineer',
    'started_on', '2024-05-30',
    'ended_on', '2025-08-19',
    'responsibilities', jsonb_build_array(
      'Developed and enhanced core backend modules in Java and Spring Boot for scalable application services.',
      'Provided operational support for production systems, troubleshooting and resolving critical business-as-usual issues quickly.'),
    'highlights', jsonb_build_array(
      'Designed an AI-driven security automation workflow integrating GitHub Actions, Maven and Snyk for early vulnerability detection.',
      'Automated dependency upgrades with AI-assisted remediation, reducing manual fixes.'),
    'achievements', jsonb_build_array('Star of the Month: for consistent contributions to Tech BAU activities, ensuring smooth operations and timely deliveries.'),
    'tech', jsonb_build_array('Java', 'Spring Boot')));

  -- Education and certifications ------------------------------------------------------------
  perform public.portfolio_save('education', jsonb_build_object('kind', 'degree',
    'title', 'B.Tech, Computer Science and Engineering', 'issuer', 'Sri Manakula Vinayagar Engineering College',
    'started_on', '2019-01-01', 'ended_on', '2023-01-01', 'grade', '77.8%'));
  perform public.portfolio_save('education', jsonb_build_object('kind', 'certification',
    'title', 'Pega Certified Senior System Architect 8.7', 'issuer', 'Pegasystems',
    'description', 'Designing and implementing scalable business process management solutions using Pega.'));
  perform public.portfolio_save('education', jsonb_build_object('kind', 'certification',
    'title', 'Microsoft Certified: Azure Developer Associate', 'issuer', 'Microsoft',
    'description', 'Building, deploying and securing cloud applications on Microsoft Azure.'));
  perform public.portfolio_save('education', jsonb_build_object('kind', 'certification',
    'title', 'Microsoft Certified: Azure Security Engineer Associate', 'issuer', 'Microsoft',
    'description', 'Threat protection, identity management and securing cloud workloads.'));
  perform public.portfolio_save('education', jsonb_build_object('kind', 'certification',
    'title', 'Claude Certified Developer – Foundations', 'issuer', 'Anthropic',
    'description', 'Building, integrating and deploying AI solutions with the Claude API, prompt engineering, agentic workflows and MCP.'));
  perform public.portfolio_save('education', jsonb_build_object('kind', 'certification',
    'title', 'GitHub Certified: Copilot', 'issuer', 'GitHub',
    'description', 'AI-assisted development and prompt engineering with GitHub Copilot to improve delivery and code quality.'));
end $$;

commit;
