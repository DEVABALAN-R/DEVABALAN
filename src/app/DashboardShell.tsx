import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, BriefcaseBusiness, ChartNoAxesCombined, ChevronDown, CircleDollarSign, CirclePlus, Home, Landmark, LogOut, PanelLeftClose, PanelLeftOpen, Wallet, X, Sun, Moon, Plus, ShieldCheck } from 'lucide-react';
import PortfolioEditor from '@/features/portfolio/pages/PortfolioEditor';
import ExpenseLedger from '@/features/finance/pages/ExpenseLedger';
import CategoryManager from '@/features/finance/pages/CategoryManager';
import TransactionDayContext from '@/shared/components/TransactionDayContext';
import DashboardHome from '@/features/dashboard/pages/DashboardHome';
import AccountManagerPage from '@/features/finance/pages/AccountManagerPage';
import MutualFundsPage from '@/features/stocks/pages/MutualFundsPage';
import { accountBalance, dateKey } from '@/features/finance/model/finance';
import { clearLegacyFinanceStorage, hasCategorySetup, readLegacyArray, STORAGE } from '@/features/finance/data/legacyFinanceStorage';
import type { PortfolioData } from '@/features/portfolio/model/portfolio';
import { loadWorkspace, saveWorkspace, WorkspaceConflictError } from '@/features/workspace/data/workspaceRepository';
import { readRecentSearches, readThemePreference, saveRecentSearches, saveThemePreference } from '@/shared/lib/preferencesStorage';
import { normalizeAccount, normalizeCategory, normalizeTransaction, type Account, type Category, type Transaction } from '@/features/finance/model/types';
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_PRESENTATION } from '@/features/finance/model/defaultCategories';
import { useFinanceMutations } from '@/features/finance/hooks/useFinanceMutations';
import { normalizeFundPurchase, normalizeMutualFund, type FundPurchase, type MutualFund } from '@/features/stocks/model/mutualFunds';
import { dashboardPathForView, dashboardViewFromPath, type DashboardView } from './dashboardRouting';
import '@/shared/styles/dashboard.css';
export function DashboardApp({ userId, onLogout, portfolioData, portfolioReady, onSavePortfolio, onPreviewPortfolio }: { userId: string; onLogout: () => void; portfolioData: PortfolioData; portfolioReady: boolean; onSavePortfolio: (value: PortfolioData) => Promise<void>; onPreviewPortfolio: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const view = dashboardViewFromPath(location.pathname) || 'home';
  const setView = (next: DashboardView) => navigate(dashboardPathForView(next));
  const [transactions, setTransactions] = React.useState<Transaction[]>(() => readLegacyArray(STORAGE.transactions).map(normalizeTransaction).filter((item): item is Transaction => item !== null));
  const [accounts, setAccounts] = React.useState<Account[]>(() => readLegacyArray(STORAGE.accounts).map(normalizeAccount).filter((item): item is Account => item !== null));
  const [categories, setCategories] = React.useState<Category[]>(() => {
    const saved = readLegacyArray(STORAGE.categories);
    // Seed setup choices only on first use. An intentionally emptied category list stays empty.
    const setupComplete = hasCategorySetup();
    const initial = !saved.length && !setupComplete ? DEFAULT_CATEGORIES : saved;
    return initial.map(normalizeCategory).filter((item): item is Category => item !== null).map((item, index) => { const style = DEFAULT_CATEGORY_PRESENTATION[item.name.toLocaleLowerCase()] || { icon: item.type === 'income' ? '💵' : '🧾', color: ['#D97706', '#2563EB', '#7C3AED', '#0F766E', '#DB2777', '#059669'][index % 6] }; const legacyIcon = item.icon === '🧾' || item.icon === '💵'; const legacyColor = ['#648A78', '#7186A2', '#A6786A', '#89799A', '#9A875E', '#5F9095'].includes(item.color || ''); return { ...item, icon: item.icon && !legacyIcon ? item.icon : style.icon, color: item.color && !legacyColor ? item.color : style.color }; });
  });
  const [mutualFunds, setMutualFunds] = React.useState<MutualFund[]>([]);
  const [fundPurchases, setFundPurchases] = React.useState<FundPurchase[]>([]);
  const [month, setMonth] = React.useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = React.useState(() => dateKey(new Date()));
  const [moneySection, setMoneySection] = React.useState<'transactions' | 'calendar' | 'insights'>('calendar');
  const [modal, setModal] = React.useState<'transaction' | null>(null);
  const transactionDialogRef = React.useRef<HTMLDialogElement>(null);
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [quickDraft, setQuickDraft] = React.useState<{ amount: number; description: string; accountId: string } | null>(null);
  const [accountEditing, setAccountEditing] = React.useState<Account | null>(null);
  const [categoryEditing, setCategoryEditing] = React.useState<Category | null>(null);
  const [showAddCategory, setShowAddCategory] = React.useState(false);
  const [transactionType, setTransactionType] = React.useState<Transaction['type']>('expense');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedSubcategory, setSelectedSubcategory] = React.useState('');
  const [toast, setToast] = React.useState('');
  const [financeOpen, setFinanceOpen] = React.useState(true);
  const [mobileFinanceOpen, setMobileFinanceOpen] = React.useState(false);
  const [mobileStocksOpen, setMobileStocksOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [recentSearches, setRecentSearches] = React.useState<string[]>(readRecentSearches);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const [theme, setTheme] = React.useState<'light' | 'dark'>(readThemePreference);
  const [workspaceReady, setWorkspaceReady] = React.useState(false);
  const [workspaceError, setWorkspaceError] = React.useState('');
  const [workspaceConflict, setWorkspaceConflict] = React.useState(false);
  const [legacyMigrationPending, setLegacyMigrationPending] = React.useState(false);
  const [legacyCounts, setLegacyCounts] = React.useState({ transactions: 0, accounts: 0, categories: 0 });
  const workspaceSaveQueue = React.useRef<Promise<void>>(Promise.resolve());
  const {
    saveTransaction, deleteTransaction, updateTransactionInline, saveAccount,
    saveCategory, addSubcategory: addSubcategoryValue, updateCategory, moveSubcategory,
    reorderCategory, renameSubcategory, removeSubcategory, undoRemoveSubcategory,
    removeAccount, removeCategory,
  } = useFinanceMutations({
    transactions, setTransactions, accounts, setAccounts, categories, setCategories,
    editing, setEditing, accountEditing, setAccountEditing,
    selectedCategory, setSelectedCategory, selectedSubcategory, setSelectedSubcategory,
    setModal, setQuickDraft, setToast,
  });
  React.useEffect(() => { saveThemePreference(theme); }, [theme]);
  React.useEffect(() => { saveRecentSearches(recentSearches); }, [recentSearches]);
  React.useEffect(() => {
    let active = true;
    setWorkspaceReady(false); setWorkspaceError('');
    (async () => {
      try {
        const saved = await loadWorkspace(userId);
        if (!active) return;
        if (saved) {
          setTransactions(saved.transactions);
          setAccounts(saved.accounts);
          setCategories(saved.categories);
          setMutualFunds(saved.mutualFunds);
          setFundPurchases(saved.fundPurchases);
        } else {
          // Never silently assign unowned browser data to a newly authenticated
          // account. Require the account owner to choose whether to import it.
          const oldTransactions = readLegacyArray(STORAGE.transactions);
          const oldAccounts = readLegacyArray(STORAGE.accounts);
          const oldCategories = readLegacyArray(STORAGE.categories);
          if (oldTransactions.length || oldAccounts.length || oldCategories.length) {
            setLegacyCounts({ transactions: oldTransactions.length, accounts: oldAccounts.length, categories: oldCategories.length });
            setLegacyMigrationPending(true);
            return;
          }
          await saveWorkspace(userId, { transactions: [], accounts: [], categories, mutualFunds: [], fundPurchases: [] });
        }
        if (active) setWorkspaceReady(true);
      } catch (error) {
        if (active) setWorkspaceError('Could not load your private workspace. Confirm the Supabase migration has been applied and try again.');
      }
    })();
    return () => { active = false; };
  }, [userId]);
  async function finishLegacyMigration(importExisting: boolean) {
    setWorkspaceError('');
    try {
      const snapshot = importExisting
        ? { transactions, accounts, categories, mutualFunds, fundPurchases }
        : { transactions: [], accounts: [], categories: [], mutualFunds: [], fundPurchases: [] };
      await saveWorkspace(userId, snapshot);
      if (!importExisting) { setTransactions([]); setAccounts([]); setCategories([]); setMutualFunds([]); setFundPurchases([]); }
      clearLegacyFinanceStorage();
      setLegacyMigrationPending(false); setWorkspaceReady(true);
    } catch {
      setWorkspaceError('Could not create the private workspace. Check the Supabase migration and connection, then retry.');
    }
  }
  React.useEffect(() => {
    if (!workspaceReady || workspaceError) return;
    const timer = window.setTimeout(async () => {
      const snapshot = { transactions, accounts, categories, mutualFunds, fundPurchases };
      workspaceSaveQueue.current = workspaceSaveQueue.current.catch(() => undefined).then(async () => {
        try {
          const synced = await saveWorkspace(userId, snapshot);
          setTransactions((current) => JSON.stringify(current) === JSON.stringify(synced.transactions) ? current : synced.transactions);
          setAccounts((current) => JSON.stringify(current) === JSON.stringify(synced.accounts) ? current : synced.accounts);
          setCategories((current) => JSON.stringify(current) === JSON.stringify(synced.categories) ? current : synced.categories);
          setMutualFunds((current) => JSON.stringify(current) === JSON.stringify(synced.mutualFunds) ? current : synced.mutualFunds);
          setFundPurchases((current) => JSON.stringify(current) === JSON.stringify(synced.fundPurchases) ? current : synced.fundPurchases);
          setWorkspaceError('');
          setWorkspaceConflict(false);
          clearLegacyFinanceStorage();
        } catch (error) {
          if (error instanceof WorkspaceConflictError) setWorkspaceConflict(true);
          setWorkspaceError('Cloud save failed. Your latest changes may not be synced. Check your connection and choose Retry sync.');
        }
      });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [userId, workspaceReady, workspaceError, transactions, accounts, categories, mutualFunds, fundPurchases]);

  async function reloadCloudWorkspace() {
    setWorkspaceError('');
    setWorkspaceConflict(false);
    try {
      const latest = await loadWorkspace(userId);
      if (!latest) throw new Error('The cloud workspace is unavailable.');
      setTransactions(latest.transactions); setAccounts(latest.accounts); setCategories(latest.categories); setMutualFunds(latest.mutualFunds); setFundPurchases(latest.fundPurchases);
      setToast('Loaded the latest cloud data.');
    } catch {
      setWorkspaceError('Could not reload the latest cloud data. Check your connection and retry.');
    }
  }
  function downloadLocalCopy() {
    const blob = new Blob([JSON.stringify({ transactions, accounts, categories, mutualFunds, fundPurchases }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `devabalan-finance-local-${new Date().toISOString().slice(0, 10)}.json`;
    link.click(); URL.revokeObjectURL(url);
  }
  function saveMutualFund(value: MutualFund) {
    const normalized = normalizeMutualFund(value);
    if (!normalized) { setToast('Check the fund name and NAV, then try again.'); return; }
    setMutualFunds((current) => current.some((item) => item.id === normalized.id) ? current.map((item) => item.id === normalized.id ? normalized : item) : [...current, normalized]);
  }
  function removeMutualFund(id: string) {
    setMutualFunds((current) => current.filter((item) => item.id !== id));
    setFundPurchases((current) => current.filter((item) => item.fundId !== id));
  }
  function saveFundPurchase(value: FundPurchase) {
    if (!mutualFunds.some((item) => item.id === value.fundId)) { setToast('Choose a valid mutual fund first.'); return; }
    const normalized = normalizeFundPurchase(value);
    if (!normalized) { setToast('Check the investment amount, date, stamp duty and NAV.'); return; }
    setFundPurchases((current) => current.some((item) => item.id === normalized.id) ? current.map((item) => item.id === normalized.id ? normalized : item) : [...current, normalized]);
  }
  function removeFundPurchase(id: string) { setFundPurchases((current) => current.filter((item) => item.id !== id)); }
  React.useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2400); return () => window.clearTimeout(timer); }, [toast]);
  React.useEffect(() => {
    if (!profileMenuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setProfileMenuOpen(false); };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [profileMenuOpen]);
  React.useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 180); return () => window.clearTimeout(timer); }, [searchTerm]);
  React.useEffect(() => {
    if (!modal) return;
    const oldBodyOverflow = document.body.style.overflow;
    const oldRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => { document.body.style.overflow = oldBodyOverflow; document.documentElement.style.overflow = oldRootOverflow; };
  }, [modal]);
  React.useEffect(() => { if (!modal) return; const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeModal(); }; window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape); }, [modal]);
  React.useEffect(() => {
    const dialog = transactionDialogRef.current;
    if (!modal || !dialog) { if (!modal) returnFocusRef.current?.focus(); return; }
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')].filter((element) => element.getAttribute('aria-hidden') !== 'true');
    const frame = window.requestAnimationFrame(() => (dialog.querySelector<HTMLElement>('input:not([type="hidden"]):not([disabled])') || focusable()[0] || dialog).focus());
    const keepFocusInside = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      const first = items[0]; const last = items[items.length - 1];
      if (!dialog.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener('keydown', keepFocusInside);
    return () => { window.cancelAnimationFrame(frame); dialog.removeEventListener('keydown', keepFocusInside); };
  }, [modal]);

  function closeModal() { setModal(null); setEditing(null); setQuickDraft(null); setAccountEditing(null); setCategoryEditing(null); }
  function openAccountsPage() { setAccountEditing(null); setView('accounts'); setModal(null); }
  function openCategoriesPage() { setCategoryEditing(null); setView('categories'); setModal(null); }
  function openTransaction(item?: Transaction, date = item?.date || selectedDate) { if (!modal) returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setEditing(item || null); setQuickDraft(null); setTransactionType(item?.type || 'expense'); setSelectedCategory(item?.category || ''); setSelectedSubcategory(item?.subcategory || ''); setSelectedDate(date); setModal('transaction'); }
  function openQuickAdd(command: string) {
    const amountMatch = command.match(/(?:₹\s*)?\b(\d+(?:\.\d{1,2})?)\b/);
    if (!amountMatch) { openTransaction(); setToast('Enter an amount, for example: 250 groceries HDFC'); return; }
    const account = accounts.find((item) => command.toLocaleLowerCase().includes(item.name.toLocaleLowerCase()));
    const category = categories.find((item) => item.type === 'expense' && (command.toLocaleLowerCase().includes(item.name.toLocaleLowerCase()) || item.subcategories.some((sub) => command.toLocaleLowerCase().includes(sub.toLocaleLowerCase()))));
    const subcategory = category?.subcategories.find((item) => command.toLocaleLowerCase().includes(item.toLocaleLowerCase())) || '';
    let description = command.replace(amountMatch[0], '');
    if (account) description = description.replace(new RegExp(account.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
    if (category) description = description.replace(new RegExp(category.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
    if (subcategory) description = description.replace(new RegExp(subcategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
    const cleanDescription = description.replace(/[,:]/g, ' ').replace(/\s+/g, ' ').trim() || category?.name || 'Expense';
    if (!modal) returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditing(null); setQuickDraft({ amount: Number(amountMatch[1]), description: cleanDescription, accountId: account?.id || '' }); setTransactionType('expense'); setSelectedCategory(category?.name || ''); setSelectedSubcategory(subcategory); setModal('transaction');
  }
  React.useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (modal || view !== 'money' || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      const typing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(target.tagName));
      if (event.key === '/' && !typing) { event.preventDefault(); setMoneySection('transactions'); window.setTimeout(() => document.querySelector<HTMLInputElement>('.ledger-transaction-search input')?.focus(), 0); }
      if ((event.key === 'n' || event.key === 'N') && !typing) { event.preventDefault(); openTransaction(undefined, selectedDate); }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [modal, view, selectedDate]);

  const nav = (current: 'home' | 'money' | 'stock' | 'portfolio', label: string, icon: React.ReactNode) => <button type="button" title={sidebarCollapsed ? label : undefined} aria-label={label} className={`nav-link${view === current ? ' active' : ''}`} onClick={() => setView(current)}>{icon}<span className="nav-text">{label}</span></button>;
  if (!dashboardViewFromPath(location.pathname)) return <Navigate to="/dashboard" replace/>;
  if (legacyMigrationPending) return <main className="access-page"><section className="access-card"><div className="access-card-icon"><ShieldCheck size={18}/></div><span className="portfolio-section-index">PRIVATE DATA SETUP</span><h2>Choose how to start</h2><p>This browser contains older local data. To prevent another account on this device from receiving it, choose whether to import it into your signed-in account.</p><div className="access-test-credentials"><strong>Found in this browser</strong><span>{legacyCounts.transactions} transactions</span><span>{legacyCounts.accounts} accounts</span><span>{legacyCounts.categories} categories</span></div>{workspaceError && <p className="access-error" role="alert">{workspaceError}</p>}<button className="access-submit" onClick={() => void finishLegacyMigration(true)}>Import existing browser data</button><button className="access-reset" onClick={() => void finishLegacyMigration(false)}>Start with an empty workspace</button></section></main>;
  if (!workspaceReady) return <main className="access-page"><section className="access-card" role={workspaceError ? 'alert' : 'status'}><h2>{workspaceError ? 'Workspace unavailable' : 'Connecting to your secure workspace…'}</h2>{workspaceError && <><p>{workspaceError}</p><button className="access-submit" onClick={onLogout}>Return to portfolio</button></>}</section></main>;
  return <div data-theme={theme} className={`app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}${theme === 'dark' ? ' theme-dark' : ''}`}>
    <aside className="sidebar">
      <div className="sidebar-heading"><a className="brand" href="/dashboard" title="Personal dashboard" onClick={(event) => { event.preventDefault(); setView('home'); }}><span className="brand-mark"><Wallet size={21}/></span><span className="brand-name">Workspace<span className="brand-period">.</span></span></a><button type="button" className="sidebar-toggle" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!sidebarCollapsed} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{sidebarCollapsed ? <PanelLeftOpen size={17}/> : <PanelLeftClose size={17}/>}</button></div>
      <div className="side-label">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">{nav('home', 'Dashboard', <Home className="nav-icon" size={17}/>)}{nav('portfolio', 'Portfolio', <BriefcaseBusiness className="nav-icon" size={17}/>)}</nav>
      <div className="finance-nav-group"><button type="button" title={sidebarCollapsed ? 'Finance' : undefined} aria-label="Finance" className="nav-link finance-toggle" onClick={() => setFinanceOpen((open) => !open)} aria-expanded={financeOpen}><Landmark className="nav-icon" size={17}/><span className="nav-text">Finance</span><ChevronDown size={14} className="nav-chevron"/></button>{financeOpen && <nav className="tracker-subnav finance-nav-items" aria-label="Finance navigation"><div className="expense-tracker-nav-group"><button title={sidebarCollapsed ? 'Expense tracker' : undefined} className={`nav-link${view === 'money' ? ' active' : ''}`} onClick={() => setView('money')}><ArrowUpRight className="nav-icon" size={17}/><span className="nav-text">Expense tracker</span></button><nav className="expense-tracker-subnav" aria-label="Expense tracker pages"><button title={sidebarCollapsed ? 'Accounts' : undefined} className={`nav-link${view === 'accounts' ? ' active' : ''}`} onClick={openAccountsPage}><Landmark className="nav-icon" size={15}/><span className="nav-text">Accounts</span></button><button title={sidebarCollapsed ? 'Categories' : undefined} className={`nav-link${view === 'categories' ? ' active' : ''}`} onClick={openCategoriesPage}><CirclePlus className="nav-icon" size={15}/><span className="nav-text">Categories</span></button></nav></div><div className="stock-nav-group"><button title={sidebarCollapsed ? 'Stock' : undefined} className={`nav-link${['stock','mutual-funds'].includes(view) ? ' active' : ''}`} onClick={() => setView('stock')}><ChartNoAxesCombined className="nav-icon" size={17}/><span className="nav-text">Stock</span></button><nav className="stock-subnav" aria-label="Stock pages"><button title={sidebarCollapsed ? 'Mutual Funds' : undefined} className={`nav-link${view === 'mutual-funds' ? ' active' : ''}`} onClick={() => setView('mutual-funds')}><CircleDollarSign className="nav-icon" size={15}/><span className="nav-text">Mutual Funds</span></button></nav></div></nav>}</div>
      <div className="side-bottom"></div>
    </aside>
    <main className="main-content"><header className="topbar"><div className="topbar-context"><div className="mobile-brand"><span className="brand-mark"><Wallet size={20}/></span>Workspace<span className="brand-period">.</span></div><div className="breadcrumb">My dashboard <span>/</span> <strong>{view === 'home' ? 'Dashboard' : view === 'money' ? 'Expense tracker' : view === 'accounts' ? 'Accounts' : view === 'categories' ? 'Categories' : view === 'portfolio' ? 'Portfolio editor' : view === 'mutual-funds' ? 'Mutual Funds' : 'Stock'}</strong></div></div>
      <div className="top-actions"><div className="header-popover-wrap" ref={profileMenuRef}><button type="button" className="top-profile-trigger" aria-label="Open profile menu" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((open) => !open)}><span className="top-avatar">D</span><span className="top-profile-name">Devabalan</span><ChevronDown size={14}/></button>{profileMenuOpen && <div className="header-popover profile-popover"><strong>Devabalan</strong><small>Personal dashboard</small><button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme((mode) => mode === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>} {theme === 'dark' ? 'Light theme' : 'Dark theme'}</button><button type="button" onClick={onLogout}><LogOut size={14}/> Log out</button></div>}</div></div>
    </header>
      {workspaceError && <div className="workspace-sync-warning" role="alert"><span>{workspaceConflict ? 'Another device changed the same record. Download this copy or load the latest cloud data before continuing.' : workspaceError}</span>{workspaceConflict ? <><button type="button" onClick={downloadLocalCopy}>Download local copy</button><button type="button" onClick={() => void reloadCloudWorkspace()}>Use latest cloud data</button></> : <button type="button" onClick={() => setWorkspaceError('')}>Retry sync</button>}</div>}
      {view === 'home' && <DashboardHome transactions={transactions} categories={categories} accounts={accounts} onOpenExpense={() => setView('money')} onOpenMutualFunds={() => setView('mutual-funds')}/>}
      {view === 'stock' && <section className="stock-view"><div className="stock-placeholder-mark">▥</div><h1>Stock</h1><p>Stock insights will be added here later.</p><button type="button" className="mf-primary-button" onClick={() => setView('mutual-funds')}>Open Mutual Funds</button></section>}
      {view === 'mutual-funds' && <MutualFundsPage funds={mutualFunds} purchases={fundPurchases} onSaveFund={saveMutualFund} onRemoveFund={removeMutualFund} onSavePurchase={saveFundPurchase} onRemovePurchase={removeFundPurchase}/>}
      {view === 'portfolio' && (portfolioReady ? <PortfolioEditor value={portfolioData} onSave={onSavePortfolio} onPreview={onPreviewPortfolio}/> : <div className="access-page" role="status">Loading portfolio details…</div>)}
      {view === 'accounts' && <AccountManagerPage accounts={accounts} transactions={transactions} accountEditing={accountEditing} setAccountEditing={setAccountEditing} accountBalance={(account) => accountBalance(account, transactions)} onSave={saveAccount} onRemove={removeAccount} onOpenCategories={openCategoriesPage} onOpenExpense={() => setView('money')}/>}
      {view === 'categories' && <section className="money-setup-page category-setup-page" aria-labelledby="categoriesPageTitle"><header className="money-setup-heading"><div><span className="eyebrow">FINANCE · MONEY SETUP</span><h1 id="categoriesPageTitle">Categories</h1><p>Manage income, expenses, and subcategories.</p></div><button type="button" className="category-page-add-button" onClick={() => setShowAddCategory(true)}><Plus size={15}/> Add category</button></header><div className="category-setup-surface"><CategoryManager categories={categories} transactions={transactions} month={month} showAddCategory={showAddCategory} setShowAddCategory={setShowAddCategory} categoryEditing={categoryEditing} setCategoryEditing={setCategoryEditing} onAddCategory={saveCategory} onAddSubcategory={addSubcategoryValue} onUpdateCategory={updateCategory} onRenameSubcategory={renameSubcategory} onRemoveSubcategory={removeSubcategory} onUndoRemoveSubcategory={undoRemoveSubcategory} onRemoveCategory={removeCategory} onMoveSubcategory={moveSubcategory} onReorderCategory={reorderCategory} onNotice={setToast}/></div></section>}
      {view === 'money' && <ExpenseLedger month={month} setMonth={setMonth} selectedDate={selectedDate} setSelectedDate={setSelectedDate} transactions={transactions} accounts={accounts} categories={categories} search={searchTerm} searchQuery={debouncedSearch} recentSearches={recentSearches} onSearchChange={setSearchTerm} onSearchCommit={() => { const value = searchTerm.trim(); if (value) setRecentSearches((old) => [value, ...old.filter((item) => item.toLocaleLowerCase() !== value.toLocaleLowerCase())].slice(0, 5)); }} onSelectRecentSearch={setSearchTerm} onClearSearch={() => setSearchTerm('')} section={moneySection} onSectionChange={setMoneySection} onAdd={(date) => openTransaction(undefined, date || selectedDate)} onQuickAdd={openQuickAdd} onInlineUpdate={updateTransactionInline} onEdit={openTransaction} onDelete={deleteTransaction} onManageAccounts={openAccountsPage} onManageCategories={openCategoriesPage}/>}
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation"><button className={view === 'home' ? 'active' : ''} onClick={() => { setMobileFinanceOpen(false); setMobileStocksOpen(false); setView('home'); }}><Home size={18}/>Home</button><button className={['money', 'accounts', 'categories'].includes(view) ? 'active' : ''} aria-expanded={mobileFinanceOpen} onClick={() => { setMobileStocksOpen(false); setMobileFinanceOpen((open) => !open); }}><Landmark size={18}/>Finance</button><button className={['stock','mutual-funds'].includes(view) ? 'active' : ''} aria-expanded={mobileStocksOpen} onClick={() => { setMobileFinanceOpen(false); setMobileStocksOpen((open) => !open); }}><ChartNoAxesCombined size={18}/>Stock</button><button className={view === 'portfolio' ? 'active' : ''} onClick={() => { setMobileFinanceOpen(false); setMobileStocksOpen(false); setView('portfolio'); }}><BriefcaseBusiness size={18}/>Portfolio</button>{mobileFinanceOpen && <div className="mobile-finance-menu" role="menu" aria-label="Finance pages"><button role="menuitem" className={view === 'money' ? 'active' : ''} onClick={() => { setMobileFinanceOpen(false); setView('money'); }}><ArrowUpRight size={16}/>Expense tracker</button><button role="menuitem" className={view === 'accounts' ? 'active' : ''} onClick={() => { setMobileFinanceOpen(false); openAccountsPage(); }}><Landmark size={16}/>Accounts</button><button role="menuitem" className={view === 'categories' ? 'active' : ''} onClick={() => { setMobileFinanceOpen(false); openCategoriesPage(); }}><CirclePlus size={16}/>Categories</button></div>}{mobileStocksOpen&&<div className="mobile-finance-menu mobile-stock-menu" role="menu" aria-label="Stock pages"><button role="menuitem" className={view==='stock'?'active':''} onClick={()=>{setMobileStocksOpen(false);setView('stock');}}><ChartNoAxesCombined size={16}/>Stock overview</button><button role="menuitem" className={view==='mutual-funds'?'active':''} onClick={()=>{setMobileStocksOpen(false);setView('mutual-funds');}}><CircleDollarSign size={16}/>Mutual Funds</button></div>}</nav>
    {modal && <button className="dialog-scrim" aria-label="Close dialog" onClick={closeModal}/>} 
    {modal === 'transaction' && <dialog ref={transactionDialogRef} open role="dialog" aria-modal="true" aria-labelledby="transactionDialogTitle" tabIndex={-1} className="react-dialog transaction-dialog"><form key={editing?.id || 'new-transaction'} className="transaction-form" onSubmit={saveTransaction}>
      <div className="transaction-dialog-header"><div><div className="eyebrow">{editing ? 'UPDATE ENTRY' : 'MONEY TRACKER'}</div><h2 id="transactionDialogTitle">{editing ? 'Edit transaction' : 'Add transaction'}</h2><p>Record the amount, then add a few details.</p></div><button type="button" className="close-button" onClick={closeModal} aria-label="Close"><X size={18}/></button></div>
      <div className="transaction-dialog-body">
      <div className="transaction-form-content">
        <div className="transaction-type-switch" role="group" aria-label="Transaction type">
          {(['expense', 'income', 'payment'] as const).map((type) => <button key={type} type="button" className={transactionType === type ? 'selected' : ''} aria-pressed={transactionType === type} onClick={() => { if (transactionType !== type) { setTransactionType(type); setSelectedCategory(''); setSelectedSubcategory(''); } }}>{type === 'payment' ? 'Card payment' : type === 'expense' ? 'Expense' : 'Income'}</button>)}
          <input type="hidden" name="type" value={transactionType}/>
        </div>
        <label className="transaction-amount-field"><span>Amount</span><span className="amount-input-wrap"><span aria-hidden="true">₹</span><input name="amount" required type="number" min="0.01" step="0.01" defaultValue={editing?.amount ?? quickDraft?.amount} placeholder="0.00" aria-label="Amount in Indian rupees"/></span></label>
        <div className="transaction-field-grid">
          <label className="field-span-all">Description<input name="description" required maxLength={60} defaultValue={editing?.description ?? quickDraft?.description} placeholder={transactionType === 'income' ? 'e.g. Monthly salary' : transactionType === 'payment' ? 'e.g. Card bill payment' : 'e.g. Groceries'}/></label>
          {transactionType !== 'payment' && <>
            <label>Category<select name="category" required value={selectedCategory} onChange={(event) => { setSelectedCategory(event.target.value); setSelectedSubcategory(''); }}><option value="">Choose category</option>{categories.filter((category) => category.type === transactionType).map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}</select></label>
            <label>Subcategory <span className="optional">Optional</span><select name="subcategory" value={selectedSubcategory} onChange={(event) => setSelectedSubcategory(event.target.value)} disabled={!selectedCategory}><option value="">No subcategory</option>{categories.find((category) => category.name === selectedCategory)?.subcategories.map((sub) => <option key={sub} value={sub}>{sub}</option>)}</select></label>
          </>}
          <label>{transactionType === 'payment' ? 'Pay from' : 'Account'}<select key={`${transactionType}-${quickDraft?.accountId || editing?.accountId || ''}`} name={transactionType === 'payment' ? 'paymentFrom' : 'accountId'} required defaultValue={editing?.accountId || quickDraft?.accountId || ''}><option value="">Choose account</option>{accounts.filter((account) => transactionType === 'income' || transactionType === 'payment' ? account.type === 'bank' : true).map((account) => <option key={account.id} value={account.id}>{account.name} · {account.type === 'bank' ? 'Bank' : 'Credit card'}</option>)}</select></label>
          {transactionType === 'payment' ? <label>Pay card<select name="paymentTo" required defaultValue={editing?.toAccountId || ''}><option value="">Choose card</option>{accounts.filter((account) => account.type === 'credit').map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label> : <label>Date<input name="date" required type="date" defaultValue={editing?.date || selectedDate}/></label>}
          {transactionType === 'payment' && <label>Date<input name="date" required type="date" defaultValue={editing?.date || selectedDate}/></label>}
        </div>
        <details className="transaction-note-details" open={Boolean(editing?.note)}><summary>Add a note <span>Optional</span></summary><label className="field-span-all"><span className="sr-only">Note</span><input name="note" maxLength={100} defaultValue={editing?.note} placeholder="Add any useful details"/></label></details>
      </div>
      <aside className="transaction-day-panel" aria-label="Selected day activity"><TransactionDayContext date={selectedDate} transactions={transactions} accounts={accounts} onEdit={openTransaction} onDelete={deleteTransaction}/></aside>
      </div>
      <div className="transaction-form-footer"><button className="primary-button transaction-save-button" type="submit">{editing ? 'Save changes' : 'Save transaction'} <span>→</span></button></div>
    </form></dialog>}
    {toast && <div className="toast show" role="status" aria-live="polite">{toast}</div>}
  </div>;
}
