import React from 'react';
import { CreditCard, Landmark, Pencil, Plus, Wallet } from 'lucide-react';
import { formatMoney } from '@/features/finance/model/finance';
import type { Account, Transaction } from '@/features/finance/model/types';

type Props = {
  accounts: Account[];
  transactions: Transaction[];
  accountEditing: Account | null;
  setAccountEditing: (account: Account | null) => void;
  accountBalance: (account: Account) => number;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onRemove: (account: Account) => void;
  onOpenCategories: () => void;
  onOpenExpense: () => void;
};

export default function AccountManagerPage({ accounts, transactions, accountEditing, setAccountEditing, accountBalance, onSave, onRemove, onOpenCategories, onOpenExpense }: Props) {
  const banks = accounts.filter((account) => account.type === 'bank');
  const cards = accounts.filter((account) => account.type === 'credit');
  const bankTotal = banks.reduce((sum, account) => sum + accountBalance(account), 0);

  return <section className="money-setup-page" aria-labelledby="accountsPageTitle">
    <header className="money-setup-heading">
      <div><span className="eyebrow">FINANCE · MONEY SETUP</span><h1 id="accountsPageTitle">Accounts</h1><p>Manage the bank accounts and cards used by your transactions.</p></div>
      <div className="money-setup-actions"><button type="button" className="select-button" onClick={onOpenExpense}>Expense tracker</button><button type="button" className="select-button" onClick={onOpenCategories}>Categories</button></div>
    </header>
    <div className="setup-summary-grid" aria-label="Account summary">
      <article><span><Landmark size={15}/> Bank accounts</span><strong>{banks.length}</strong></article>
      <article><span><CreditCard size={15}/> Credit cards</span><strong>{cards.length}</strong></article>
      <article><span><Wallet size={15}/> Bank balance</span><strong>{formatMoney(bankTotal)}</strong></article>
    </div>
    <div className="accounts-management-grid">
      <form className="setup-form-card" key={accountEditing?.id || 'new-account'} onSubmit={onSave}>
        <div className="setup-section-title"><span className="setup-title-icon"><Plus size={17}/></span><span><strong>{accountEditing ? 'Edit account' : 'Add an account'}</strong><small>Choose a name, account type, and opening balance.</small></span></div>
        <label>Account name<input name="name" required maxLength={35} defaultValue={accountEditing?.name} placeholder="e.g. Main bank account"/></label>
        <div className="form-row"><label>Account type<select name="type" defaultValue={accountEditing?.type || 'bank'} disabled={Boolean(accountEditing && transactions.some((item) => item.accountId === accountEditing.id || item.toAccountId === accountEditing.id))}><option value="bank">Bank account</option><option value="credit">Credit card</option></select></label><label>Starting balance (₹)<input name="openingBalance" type="number" min="0" step="0.01" defaultValue={accountEditing?.openingBalance ?? 0}/></label></div>
        <p className="setup-help">Credit card balances are tracked separately and excluded from your bank balance.</p>
        <div className="setup-form-actions">{accountEditing && <button type="button" className="select-button" onClick={() => setAccountEditing(null)}>Cancel</button>}<button className="primary-button" type="submit">{accountEditing ? 'Save account' : 'Add account'} <Plus size={15}/></button></div>
      </form>
      <section className="setup-list-card" aria-labelledby="yourAccountsTitle">
        <div className="setup-list-heading"><div><h2 id="yourAccountsTitle">Your accounts</h2><p>{accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} · Bank balance excludes cards</p></div></div>
        {accounts.length ? <div className="setup-account-list">{accounts.map((account) => <article className="setup-account-row" key={account.id}><span className={`setup-account-icon ${account.type}`}>{account.type === 'bank' ? <Landmark size={17}/> : <CreditCard size={17}/>}</span><span className="setup-account-copy"><strong>{account.name}</strong><small>{account.type === 'bank' ? 'Bank account' : 'Credit card'} · Opening {formatMoney(account.openingBalance)}</small></span><strong className="setup-account-balance">{formatMoney(accountBalance(account))}</strong><span className="setup-account-actions"><button type="button" className="edit-category" aria-label={`Edit ${account.name}`} onClick={() => setAccountEditing(account)}><Pencil size={15}/></button><button type="button" className="remove-category" onClick={() => onRemove(account)}>Remove</button></span></article>)}</div> : <div className="manager-empty-state"><Landmark size={18}/><span>No accounts yet. Add a bank account or card to assign it to a transaction.</span></div>}
      </section>
    </div>
  </section>;
}
