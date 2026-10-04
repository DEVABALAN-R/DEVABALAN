import React from 'react';
import { Ellipsis, Plus, Search, Tags, Trash2, X, Pencil, Save, GripVertical, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { formatMoney } from '@/features/finance/model/finance';
import type { Category, Transaction } from '@/features/finance/model/types';
type Props = {
  categories: Category[];
  transactions: Transaction[];
  month: Date;
  showAddCategory: boolean;
  setShowAddCategory: (show: boolean) => void;
  categoryEditing: Category | null;
  setCategoryEditing: (category: Category | null) => void;
  onAddCategory: (category: Omit<Category, 'subcategories'>) => void;
  onAddSubcategory: (category: string, subcategory: string) => void;
  onUpdateCategory: (oldName: string, next: Category) => void;
  onRenameSubcategory: (category: string, oldName: string, newName: string) => void;
  onRemoveSubcategory: (category: string, subcategory: string) => void;
  onUndoRemoveSubcategory: (category: string, subcategory: string) => void;
  onRemoveCategory: (category: string, reassignTo?: string) => void;
  onMoveSubcategory: (fromCategory: string, subcategory: string, toCategory: string) => void;
  onReorderCategory: (fromName: string, toName: string) => void;
  onNotice: (message: string) => void;
};

const PALETTE = ['#648A78', '#7186A2', '#A6786A', '#89799A', '#9A875E', '#5F9095', '#8A7182', '#78865C'];
const formatMonth = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export default function CategoryManager({ categories, transactions, month, showAddCategory, setShowAddCategory, categoryEditing, setCategoryEditing, onAddCategory, onAddSubcategory, onUpdateCategory, onRenameSubcategory, onRemoveSubcategory, onUndoRemoveSubcategory, onRemoveCategory, onMoveSubcategory, onReorderCategory, onNotice }: Props) {
  const [type, setType] = React.useState<'expense' | 'income'>('expense');
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<'all' | 'budget' | 'spending' | 'empty'>('all');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [undoSubcategory, setUndoSubcategory] = React.useState<{ category: string; subcategory: string } | null>(null);
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const [subMenu, setSubMenu] = React.useState<{ category: string; subcategory: string } | null>(null);
  const [editingCategoryName, setEditingCategoryName] = React.useState<string | null>(null);
  const [categoryNameDraft, setCategoryNameDraft] = React.useState('');
  const [editingSubcategory, setEditingSubcategory] = React.useState<{ category: string; name: string } | null>(null);
  const [subcategoryDraft, setSubcategoryDraft] = React.useState('');
  const [addingTo, setAddingTo] = React.useState<string | null>(null);
  const [newSubcategory, setNewSubcategory] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);
  const [deleteSubcategoryTarget, setDeleteSubcategoryTarget] = React.useState<{ category: string; subcategory: string } | null>(null);
  const [reassignTo, setReassignTo] = React.useState('');
  const [draftError, setDraftError] = React.useState('');
  const [dragCategory, setDragCategory] = React.useState<string | null>(null);
  const [categoryForm, setCategoryForm] = React.useState<Category>({ name: '', type: 'expense', subcategories: [], icon: '🏷️', color: PALETTE[0], monthlyBudget: undefined });
  const monthKey = formatMonth(month);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (!showAddCategory && !categoryEditing && !deleteTarget && !deleteSubcategoryTarget) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setShowAddCategory(false); setCategoryEditing(null); setDeleteTarget(null); setDeleteSubcategoryTarget(null); setDraftError(''); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showAddCategory, categoryEditing, deleteTarget, deleteSubcategoryTarget, setShowAddCategory, setCategoryEditing]);

  const monthStats = (category: Category) => {
    const total = transactions.filter((item) => item.category === category.name && item.type === category.type && item.date.startsWith(monthKey)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const count = transactions.filter((item) => item.category === category.name).length;
    const budget = Number(category.monthlyBudget || 0);
    return { total, count, budget, progress: budget > 0 ? Math.min(100, total / budget * 100) : 0 };
  };
  const counts = { expense: categories.filter((item) => item.type === 'expense').length, income: categories.filter((item) => item.type === 'income').length };
  const visible = categories.filter((category) => {
    if (category.type !== type) return false;
    const stats = monthStats(category);
    if (categoryFilter === 'budget' && !stats.budget) return false;
    if (categoryFilter === 'spending' && !stats.total) return false;
    if (categoryFilter === 'empty' && (stats.count || category.subcategories.length)) return false;
    const query = search.trim().toLocaleLowerCase();
    return !query || [category.name, ...category.subcategories].some((value) => value.toLocaleLowerCase().includes(query));
  });
  React.useEffect(() => { if (!undoSubcategory) return; const timer = window.setTimeout(() => setUndoSubcategory(null), 5000); return () => window.clearTimeout(timer); }, [undoSubcategory]);

  const openCreate = () => {
    setDraftError('');
    setCategoryForm({ name: '', type, subcategories: [], icon: '🏷️', color: PALETTE[categories.length % PALETTE.length], monthlyBudget: undefined });
    setShowAddCategory(true);
  };
  const saveNewCategory = (event: React.FormEvent) => {
    event.preventDefault();
    const name = categoryForm.name.trim();
    if (!name) { setDraftError('Enter a category name.'); return; }
    if (categories.some((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { setDraftError('A category with that name already exists.'); return; }
    onAddCategory({ name, type, icon: categoryForm.icon, color: categoryForm.color, monthlyBudget: categoryForm.monthlyBudget });
    setShowAddCategory(false);
    onNotice('Category added');
  };
  const saveCategoryEdit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryEditing) return;
    const name = categoryForm.name.trim();
    if (!name) { setDraftError('Enter a category name.'); return; }
    if (categories.some((item) => item.name !== categoryEditing.name && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { setDraftError('A category with that name already exists.'); return; }
    onUpdateCategory(categoryEditing.name, { ...categoryEditing, ...categoryForm, name, subcategories: categoryEditing.subcategories });
    setCategoryEditing(null);
    setDraftError('');
    onNotice('Category updated');
  };
  const openEdit = (category: Category) => {
    setCategoryForm({ ...category, icon: category.icon || '🏷️', color: category.color || PALETTE[0], monthlyBudget: category.monthlyBudget || undefined });
    setDraftError('');
    setCategoryEditing(category);
    setOpenMenu(null);
  };
  const commitCategoryRename = (category: Category) => {
    const name = categoryNameDraft.trim();
    setEditingCategoryName(null);
    if (!name || name === category.name) return;
    if (categories.some((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { onNotice('A category with that name already exists'); return; }
    onUpdateCategory(category.name, { ...category, name });
  };
  const commitSubcategory = (category: Category, oldName?: string) => {
    const name = subcategoryDraft.trim();
    if (!name) { setEditingSubcategory(null); setAddingTo(null); return; }
    if (category.subcategories.some((item) => item.toLocaleLowerCase() === name.toLocaleLowerCase() && item !== oldName)) { onNotice('That subcategory already exists'); return; }
    if (oldName) onRenameSubcategory(category.name, oldName, name);
    setEditingSubcategory(null); setAddingTo(null); setSubcategoryDraft('');
    if (!oldName) onNotice('Subcategory added');
  };
  const commitNewSubcategory = (category: Category) => {
    const name = newSubcategory.trim();
    if (!name) return;
    if (category.subcategories.some((item) => item.toLocaleLowerCase() === name.toLocaleLowerCase())) { onNotice('That subcategory already exists'); return; }
    onAddSubcategory(category.name, name);
    setNewSubcategory(''); setAddingTo(null); onNotice('Subcategory added');
  };
  const getDragData = (event: React.DragEvent) => { try { return JSON.parse(event.dataTransfer.getData('text/plain')) as { kind: string; category: string; subcategory?: string }; } catch { return null; } };

  return <div className="category-manager-content">
    <div className="category-manager-toolbar" role="region" aria-label="Category filters">
      <div className="category-segmented" role="tablist" aria-label="Category type">
        <button type="button" role="tab" aria-selected={type === 'expense'} className={type === 'expense' ? 'active' : ''} onClick={() => setType('expense')}>Expense <span>{counts.expense}</span></button>
        <button type="button" role="tab" aria-selected={type === 'income'} className={type === 'income' ? 'active' : ''} onClick={() => setType('income')}>Income <span>{counts.income}</span></button>
      </div>
      <label className="category-search"><Search size={14}/><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" aria-label="Search categories"/>{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={13}/></button>}</label>
      <div className="category-filter-wrap"><button type="button" className="category-filter-trigger" aria-label="Filter categories" aria-expanded={filterOpen} onClick={() => setFilterOpen(!filterOpen)}><SlidersHorizontal size={15}/><span>{categoryFilter === 'all' ? 'Filter' : ({ budget: 'Has budget', spending: 'Has spending', empty: 'Empty' } as const)[categoryFilter]}</span></button>{filterOpen && <div className="category-filter-popover" role="group" aria-label="Category filters">{([['all', 'All'], ['budget', 'Has budget'], ['spending', 'Has spending'], ['empty', 'Empty']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={categoryFilter === value} onClick={() => { setCategoryFilter(value); setFilterOpen(false); }}>{label}</button>)}</div>}</div>
    </div>

    {visible.length ? <div className="category-card-grid"><AnimatePresence initial={false}>
      {visible.map((category) => {
      const stats = monthStats(category);
      const menuIsOpen = openMenu === category.name;
      return <motion.article key={category.name} layout className="category-card" style={{ '--category-accent': category.color || '#7186a2' } as React.CSSProperties}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: reduceMotion ? 0 : 0.18 }}
        draggable onDragStartCapture={(event) => { setDragCategory(category.name); event.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'category', category: category.name })); }}
        onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const dropped = getDragData(event); if (dropped?.kind === 'category' && dropped.category !== category.name) onReorderCategory(dropped.category, category.name); else if (dropped?.kind === 'subcategory' && dropped.subcategory) onMoveSubcategory(dropped.category, dropped.subcategory, category.name); setDragCategory(null); }}
        onDragEnd={() => setDragCategory(null)} data-dragging={dragCategory === category.name}>
        <div className="category-card-head"><span className="category-icon-badge" aria-hidden="true">{category.icon || '🏷️'}</span><div className="category-card-title">
          {editingCategoryName === category.name ? <form onSubmit={(event) => { event.preventDefault(); commitCategoryRename(category); }}><input autoFocus aria-label="Rename category" value={categoryNameDraft} onChange={(event) => setCategoryNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setEditingCategoryName(null); }}/></form> : <button type="button" className="category-name-button" onDoubleClick={() => { setEditingCategoryName(category.name); setCategoryNameDraft(category.name); }} onKeyDown={(event) => { if (event.key === 'Enter') { setEditingCategoryName(category.name); setCategoryNameDraft(category.name); } }} title="Double-click or press Enter to rename">{category.name}</button>}
        </div><button type="button" className="category-menu-trigger" aria-label={`More actions for ${category.name}`} aria-expanded={menuIsOpen} onClick={() => setOpenMenu(menuIsOpen ? null : category.name)}><Ellipsis size={18}/></button>
          {menuIsOpen && <div className="category-action-menu"><button type="button" onClick={() => openEdit(category)}><Pencil size={13}/> Edit category</button><button type="button" onClick={() => openEdit(category)}><Tags size={13}/> Change icon</button><button type="button" onClick={() => { const same = categories.filter((item) => item.type === category.type); const index = same.findIndex((item) => item.name === category.name); if (index > 0) onReorderCategory(category.name, same[index - 1].name); setOpenMenu(null); }}><ArrowUp size={13}/> Move up</button><button type="button" onClick={() => { const same = categories.filter((item) => item.type === category.type); const index = same.findIndex((item) => item.name === category.name); if (index >= 0 && index < same.length - 1) onReorderCategory(category.name, same[index + 1].name); setOpenMenu(null); }}><ArrowDown size={13}/> Move down</button><button type="button" className="delete-action" onClick={() => { setDeleteTarget(category); setReassignTo(''); setOpenMenu(null); }}><Trash2 size={13}/> Delete category</button></div>}
        </div>
        <div className="category-stats"><div><span>Subcategories</span><strong>{category.subcategories.length}</strong></div><div><span>{type === 'income' ? 'Earned this month' : 'Spent this month'}</span><strong>{formatMoney(stats.total)}</strong></div></div>
        {stats.budget > 0 && <div className="category-budget"><div><span>Budget</span><span>{formatMoney(stats.total)} / {formatMoney(stats.budget)}</span></div><div className="category-budget-track" role="progressbar" aria-label={`${category.name} budget used`} aria-valuenow={Math.round(stats.progress)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${stats.progress}%` }}/></div></div>}
        <div className="category-subcategories"><div className="category-subcategories-heading"><strong>Subcategories</strong></div>
          <div className="subcategory-chip-list">{category.subcategories.map((subcategory) => <div className="subcategory-chip-wrap" key={subcategory} draggable onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'subcategory', category: category.name, subcategory })); }}>
            {editingSubcategory?.category === category.name && editingSubcategory.name === subcategory ? <form className="subcategory-inline-edit" onSubmit={(event) => { event.preventDefault(); commitSubcategory(category, subcategory); }}><input autoFocus aria-label="Rename subcategory" value={subcategoryDraft} onChange={(event) => setSubcategoryDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setEditingSubcategory(null); }}/><button type="submit" aria-label="Save subcategory"><Save size={12}/></button></form> : <button type="button" className="subcategory-chip" onDoubleClick={() => { setEditingSubcategory({ category: category.name, name: subcategory }); setSubcategoryDraft(subcategory); }} onKeyDown={(event) => { if (event.key === 'Enter') { setEditingSubcategory({ category: category.name, name: subcategory }); setSubcategoryDraft(subcategory); } }} title="Double-click or press Enter to rename">{subcategory}</button>}
            <button type="button" className="subcategory-menu-trigger" aria-label={`Actions for ${subcategory}`} aria-expanded={subMenu?.category === category.name && subMenu.subcategory === subcategory} onClick={() => setSubMenu(subMenu?.category === category.name && subMenu.subcategory === subcategory ? null : { category: category.name, subcategory })}><Ellipsis size={13}/></button>
            {subMenu?.category === category.name && subMenu.subcategory === subcategory && <div className="subcategory-action-menu"><button type="button" onClick={() => { setEditingSubcategory({ category: category.name, name: subcategory }); setSubcategoryDraft(subcategory); setSubMenu(null); }}><Pencil size={12}/> Rename</button><button type="button" className="delete-action" onClick={() => { setDeleteSubcategoryTarget({ category: category.name, subcategory }); setSubMenu(null); }}><Trash2 size={12}/> Delete</button></div>}
          </div>)}</div>
          {addingTo === category.name ? <form className="subcategory-add-inline" onSubmit={(event) => { event.preventDefault(); commitNewSubcategory(category); }}><input autoFocus aria-label={`Add a subcategory to ${category.name}`} value={newSubcategory} onChange={(event) => setNewSubcategory(event.target.value)} placeholder="Subcategory name"/><button type="submit" aria-label="Save subcategory"><Plus size={13}/></button><button type="button" aria-label="Cancel" onClick={() => { setAddingTo(null); setNewSubcategory(''); }}><X size={13}/></button></form> : <button type="button" className="add-subcategory-inline-trigger" onClick={() => { setAddingTo(category.name); setNewSubcategory(''); }}><Plus size={13}/> Add subcategory</button>}
        </div>
        <span className="category-drag-hint"><GripVertical size={12}/> Drag to reorder or move a chip</span>
      </motion.article>;
    })}</AnimatePresence></div> : <div className="category-empty-state"><span className="category-empty-illustration"><Tags size={28}/></span><h2>{categories.filter((item) => item.type === type).length === 0 ? `No ${type} categories yet` : 'No categories match'}</h2><p>{categories.filter((item) => item.type === type).length === 0 ? `Add your first ${type} category to keep your finances organized.` : 'Try another search or adjust the active filters.'}</p>{categories.filter((item) => item.type === type).length === 0 && <button type="button" onClick={openCreate}><Plus size={14}/> Add {type} category</button>}</div>}

    {showAddCategory && <div className="category-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAddCategory(false); }}><section className="category-modal-card" role="dialog" aria-modal="true" aria-labelledby="addCategoryTitle"><header><div><span>NEW CATEGORY</span><h2 id="addCategoryTitle">Add category</h2></div><button type="button" aria-label="Close" onClick={() => setShowAddCategory(false)}><X size={17}/></button></header><form onSubmit={saveNewCategory}><label>Category name<input autoFocus required maxLength={30} value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="e.g. Home essentials"/></label><label>Type<select value={type} onChange={(event) => setType(event.target.value as typeof type)}><option value="expense">Expense</option><option value="income">Income</option></select></label><div className="category-customize-row"><label>Emoji<input aria-label="Category emoji" maxLength={4} value={categoryForm.icon || ''} onChange={(event) => setCategoryForm({ ...categoryForm, icon: event.target.value })}/></label><label>Monthly budget <small>Optional</small><input type="number" min="0" step="0.01" value={categoryForm.monthlyBudget ?? ''} onChange={(event) => setCategoryForm({ ...categoryForm, monthlyBudget: event.target.value ? Number(event.target.value) : undefined })} placeholder="0"/></label></div><div className="category-icon-presets" role="group" aria-label="Choose a category icon">{["🍽️","🚗","🏠","🛍️","⚡","💵","💻","✨","🧾","🏷️"].map((icon) => <button type="button" key={icon} aria-label={`Choose ${icon} icon`} aria-pressed={categoryForm.icon === icon} onClick={() => setCategoryForm({ ...categoryForm, icon })}>{icon}</button>)}</div>{draftError && <p className="category-form-error" role="alert">{draftError}</p>}<footer><button type="button" className="category-modal-cancel" onClick={() => setShowAddCategory(false)}>Cancel</button><button type="submit" className="category-modal-save"><Plus size={14}/> Create category</button></footer></form></section></div>}

    {categoryEditing && <div className="category-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCategoryEditing(null); }}><section className="category-modal-card" role="dialog" aria-modal="true" aria-labelledby="editCategoryTitle"><header><div><span>UPDATE CATEGORY</span><h2 id="editCategoryTitle">Edit category</h2></div><button type="button" aria-label="Close" onClick={() => setCategoryEditing(null)}><X size={17}/></button></header><form onSubmit={saveCategoryEdit}><label>Category name<input autoFocus required maxLength={30} value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}/></label><label>Type<select value={categoryForm.type} onChange={(event) => setCategoryForm({ ...categoryForm, type: event.target.value as typeof type })}><option value="expense">Expense</option><option value="income">Income</option></select></label><div className="category-customize-row"><label>Emoji<input aria-label="Category emoji" maxLength={4} value={categoryForm.icon || ''} onChange={(event) => setCategoryForm({ ...categoryForm, icon: event.target.value })}/></label><label>Monthly budget <small>Optional</small><input type="number" min="0" step="0.01" value={categoryForm.monthlyBudget ?? ''} onChange={(event) => setCategoryForm({ ...categoryForm, monthlyBudget: event.target.value ? Number(event.target.value) : undefined })}/></label></div><div className="category-icon-presets" role="group" aria-label="Choose a category icon">{["🍽️","🚗","🏠","🛍️","⚡","💵","💻","✨","🧾","🏷️"].map((icon) => <button type="button" key={icon} aria-label={`Choose ${icon} icon`} aria-pressed={categoryForm.icon === icon} onClick={() => setCategoryForm({ ...categoryForm, icon })}>{icon}</button>)}</div>{draftError && <p className="category-form-error" role="alert">{draftError}</p>}<footer><button type="button" className="category-modal-cancel" onClick={() => setCategoryEditing(null)}>Cancel</button><button type="submit" className="category-modal-save"><Save size={14}/> Save changes</button></footer></form></section></div>}

    {deleteTarget && <div className="category-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}><section className="category-modal-card" role="alertdialog" aria-modal="true" aria-labelledby="deleteCategoryTitle"><header><div><span>DELETE CATEGORY</span><h2 id="deleteCategoryTitle">Remove {deleteTarget.name}?</h2></div><button type="button" aria-label="Close" onClick={() => setDeleteTarget(null)}><X size={17}/></button></header><div className="category-delete-content">{monthStats(deleteTarget).count > 0 ? <><p>This category is used by {monthStats(deleteTarget).count} transaction{monthStats(deleteTarget).count === 1 ? '' : 's'}.</p><label>Reassign transactions to<select value={reassignTo} onChange={(event) => setReassignTo(event.target.value)}><option value="">Leave uncategorized</option>{categories.filter((item) => item.name !== deleteTarget.name && item.type === deleteTarget.type).map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label></> : <p>This category has no linked transactions.</p>}<footer><button type="button" className="category-modal-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button><button type="button" className="category-modal-delete" onClick={() => { onRemoveCategory(deleteTarget.name, reassignTo); setDeleteTarget(null); onNotice('Category removed'); }}>Delete category</button></footer></div></section></div>}

    {deleteSubcategoryTarget && <div className="category-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteSubcategoryTarget(null); }}><section className="category-modal-card" role="alertdialog" aria-modal="true" aria-labelledby="deleteSubcategoryTitle"><header><div><span>DELETE SUBCATEGORY</span><h2 id="deleteSubcategoryTitle">Remove {deleteSubcategoryTarget.subcategory}?</h2></div><button type="button" aria-label="Close" onClick={() => setDeleteSubcategoryTarget(null)}><X size={17}/></button></header><div className="category-delete-content"><p>Transactions using this subcategory will remain in {deleteSubcategoryTarget.category} without a subcategory.</p><footer><button type="button" className="category-modal-cancel" onClick={() => setDeleteSubcategoryTarget(null)}>Cancel</button><button type="button" className="category-modal-delete" onClick={() => { onRemoveSubcategory(deleteSubcategoryTarget.category, deleteSubcategoryTarget.subcategory); setUndoSubcategory(deleteSubcategoryTarget); setDeleteSubcategoryTarget(null); }}>Delete subcategory</button></footer></div></section></div>}
    {undoSubcategory && <div className="category-undo-toast" role="status" aria-live="polite">Subcategory removed <button type="button" onClick={() => { onUndoRemoveSubcategory(undoSubcategory.category, undoSubcategory.subcategory); setUndoSubcategory(null); onNotice('Subcategory restored'); }}>Undo</button><button type="button" aria-label="Dismiss undo message" onClick={() => setUndoSubcategory(null)}><X size={13}/></button></div>}
  </div>;
}
