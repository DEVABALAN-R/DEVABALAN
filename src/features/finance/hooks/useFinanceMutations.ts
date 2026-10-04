import { useRef } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { dateKey } from '@/features/finance/model/finance';
import type { Account, Category, Transaction } from '@/features/finance/model/types';

type TransactionModal = 'transaction' | null;
type QuickDraft = { amount: number; description: string; accountId: string } | null;
type Setter<T> = Dispatch<SetStateAction<T>>;

type FinanceMutationsOptions = {
  transactions: Transaction[];
  setTransactions: Setter<Transaction[]>;
  accounts: Account[];
  setAccounts: Setter<Account[]>;
  categories: Category[];
  setCategories: Setter<Category[]>;
  editing: Transaction | null;
  setEditing: Setter<Transaction | null>;
  accountEditing: Account | null;
  setAccountEditing: Setter<Account | null>;
  selectedCategory: string;
  setSelectedCategory: Setter<string>;
  selectedSubcategory: string;
  setSelectedSubcategory: Setter<string>;
  setModal: Setter<TransactionModal>;
  setQuickDraft: Setter<QuickDraft>;
  setToast: (message: string) => void;
};

const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const today = () => dateKey(new Date());

export function useFinanceMutations({
  transactions, setTransactions, accounts, setAccounts, categories, setCategories,
  editing, setEditing, accountEditing, setAccountEditing, selectedCategory, setSelectedCategory,
  selectedSubcategory, setSelectedSubcategory, setModal, setQuickDraft, setToast,
}: FinanceMutationsOptions) {
  const removedSubcategoryTransactions = useRef<Transaction[]>([]);

  function saveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const type = String(data.get('type')) as Transaction['type'];
    const amount = Number(data.get('amount'));
    const description = String(data.get('description') || '').trim();
    const date = String(data.get('date') || today());
    if (!description || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || dateKey(new Date(`${date}T12:00:00`)) !== date) {
      setToast('Enter a valid description, amount, and date');
      return;
    }

    const accountId = String(data.get(type === 'payment' ? 'paymentFrom' : 'accountId') || '');
    const account = accounts.find((item) => item.id === accountId);
    const toAccountId = String(data.get('paymentTo') || '');
    const categoryName = String(data.get('category') || '');
    const subcategory = String(data.get('subcategory') || '');
    const category = categories.find((item) => item.name === categoryName && item.type === type);
    const validAccount = account && (type === 'expense' || account.type === 'bank');
    const validPayment = type !== 'payment' || (account?.type === 'bank' && accounts.some((item) => item.id === toAccountId && item.type === 'credit'));
    const validCategory = type === 'payment' || (category && (!subcategory || category.subcategories.includes(subcategory)));
    if (!validAccount || !validPayment || !validCategory) {
      setToast('Choose a valid account and category for this transaction');
      return;
    }

    const entry: Transaction = {
      id: editing?.id || newId(), description, amount, type, accountId, date,
      note: String(data.get('note') || ''),
      category: type === 'payment' ? undefined : categoryName,
      subcategory: type === 'payment' ? undefined : subcategory,
      toAccountId: type === 'payment' ? toAccountId : undefined,
      created: editing?.created || Date.now(),
    };
    setTransactions((current) => editing ? current.map((item) => item.id === editing.id ? entry : item) : [entry, ...current]);
    setModal(null);
    setEditing(null);
    setQuickDraft(null);
    setToast(editing ? 'Transaction updated' : 'Transaction added');
  }

  function deleteTransaction(id: string) {
    if (!window.confirm('Delete this transaction?')) return;
    setTransactions((current) => current.filter((item) => item.id !== id));
    setToast('Transaction deleted');
  }

  function updateTransactionInline(item: Transaction, field: 'description' | 'amount', value: string) {
    const next = field === 'amount' ? Number(value) : value.trim();
    if (field === 'description' && !next) { setToast('Description cannot be empty'); return; }
    if (field === 'amount' && (!Number.isFinite(next) || Number(next) <= 0)) { setToast('Enter an amount greater than zero'); return; }
    setTransactions((current) => current.map((entry) => entry.id === item.id ? { ...entry, [field]: field === 'amount' ? Number(next) : next } : entry));
    setToast('Transaction updated');
  }

  function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    if (!name) return;
    if (accounts.some((entry) => entry.id !== accountEditing?.id && entry.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setToast('An account with that name already exists');
      return;
    }
    const linked = accountEditing && transactions.some((item) => item.accountId === accountEditing.id || item.toAccountId === accountEditing.id);
    const item: Account = {
      id: accountEditing?.id || newId(), name,
      type: linked ? accountEditing!.type : String(data.get('type')) as Account['type'],
      openingBalance: Number(data.get('openingBalance')) || 0,
    };
    setAccounts((current) => accountEditing ? current.map((entry) => entry.id === item.id ? item : entry) : [...current, item]);
    event.currentTarget.reset();
    setAccountEditing(null);
    setToast(accountEditing ? 'Account updated' : 'Account added');
  }

  function saveCategory(category: Omit<Category, 'subcategories'>) {
    setCategories((current) => [...current, { ...category, id: category.id || crypto.randomUUID(), subcategories: [] }]);
  }

  function addSubcategory(categoryName: string, subcategory: string) {
    if (categories.find((item) => item.name === categoryName)?.subcategories.some((item) => item.toLocaleLowerCase() === subcategory.toLocaleLowerCase())) {
      setToast('That subcategory already exists');
      return;
    }
    setCategories((current) => current.map((item) => item.name === categoryName ? { ...item, subcategories: [...item.subcategories, subcategory] } : item));
  }

  function updateCategory(oldName: string, next: Category) {
    if (categories.some((item) => item.name !== oldName && item.name.toLocaleLowerCase() === next.name.toLocaleLowerCase())) {
      setToast('A category with that name already exists');
      return;
    }
    setCategories((current) => current.map((item) => item.name === oldName ? next : item));
    setTransactions((current) => current.map((item) => item.category === oldName ? { ...item, category: next.name, type: next.type } : item));
    if (selectedCategory === oldName) setSelectedCategory(next.name);
  }

  function moveSubcategory(fromName: string, subcategory: string, toName: string) {
    if (!fromName || fromName === toName) return;
    const target = categories.find((item) => item.name === toName);
    if (!target || target.subcategories.some((item) => item.toLocaleLowerCase() === subcategory.toLocaleLowerCase())) {
      setToast('That subcategory already exists in the destination category');
      return;
    }
    setCategories((current) => current.map((item) => item.name === fromName
      ? { ...item, subcategories: item.subcategories.filter((value) => value !== subcategory) }
      : item.name === toName ? { ...item, subcategories: [...item.subcategories, subcategory] } : item));
    setTransactions((current) => current.map((item) => item.category === fromName && item.subcategory === subcategory ? { ...item, category: toName } : item));
    setToast('Subcategory moved');
  }

  function reorderCategory(fromName: string, toName: string) {
    setCategories((current) => {
      const next = [...current];
      const from = next.findIndex((item) => item.name === fromName);
      const to = next.findIndex((item) => item.name === toName);
      if (from < 0 || to < 0 || from === to) return current;
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function renameSubcategory(category: string, oldName: string, newName: string) {
    const clean = newName.trim();
    if (!clean || categories.find((item) => item.name === category)?.subcategories.some((sub) => sub !== oldName && sub.toLocaleLowerCase() === clean.toLocaleLowerCase())) {
      setToast('That subcategory already exists');
      return;
    }
    setCategories((current) => current.map((item) => item.name === category ? { ...item, subcategories: item.subcategories.map((sub) => sub === oldName ? clean : sub) } : item));
    setTransactions((current) => current.map((item) => item.category === category && item.subcategory === oldName ? { ...item, subcategory: clean } : item));
    if (selectedCategory === category && selectedSubcategory === oldName) setSelectedSubcategory(clean);
    setToast('Subcategory updated');
  }

  function removeSubcategory(category: string, subcategory: string) {
    removedSubcategoryTransactions.current = transactions.filter((item) => item.category === category && item.subcategory === subcategory);
    setCategories((current) => current.map((item) => item.name === category ? { ...item, subcategories: item.subcategories.filter((sub) => sub !== subcategory) } : item));
    setTransactions((current) => current.map((item) => item.category === category && item.subcategory === subcategory ? { ...item, subcategory: '' } : item));
    if (selectedCategory === category && selectedSubcategory === subcategory) setSelectedSubcategory('');
  }

  function undoRemoveSubcategory(category: string, subcategory: string) {
    setCategories((current) => current.map((item) => item.name === category && !item.subcategories.includes(subcategory) ? { ...item, subcategories: [...item.subcategories, subcategory] } : item));
    const removed = removedSubcategoryTransactions.current;
    setTransactions((current) => current.map((item) => removed.find((previous) => previous.id === item.id) || item));
    removedSubcategoryTransactions.current = [];
  }

  function removeAccount(account: Account) {
    if (transactions.some((item) => item.accountId === account.id || item.toAccountId === account.id)) {
      setToast('Account is linked to transactions; rename it instead');
      return;
    }
    if (!window.confirm(`Remove the account “${account.name}”?`)) return;
    setAccounts((current) => current.filter((item) => item.id !== account.id));
    setToast('Account removed');
  }

  function removeCategory(name: string, reassignTo?: string) {
    const target = categories.find((item) => item.name === reassignTo);
    setCategories((current) => current.filter((item) => item.name !== name));
    setTransactions((current) => current.map((item) => item.category !== name ? item : target
      ? { ...item, category: target.name, subcategory: target.subcategories.includes(item.subcategory || '') ? item.subcategory : '', type: target.type }
      : { ...item, category: '', subcategory: '' }));
    if (selectedCategory === name) { setSelectedCategory(''); setSelectedSubcategory(''); }
  }

  return { saveTransaction, deleteTransaction, updateTransactionInline, saveAccount, saveCategory, addSubcategory, updateCategory, moveSubcategory, reorderCategory, renameSubcategory, removeSubcategory, undoRemoveSubcategory, removeAccount, removeCategory };
}
