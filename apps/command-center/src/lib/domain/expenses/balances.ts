import type { Account, Transaction } from './types';

/**
 * Signed effect of one transaction on one account (paise).
 * Transfers move `amount` and charge `fee` to the source, so paying a card
 * bill (bank → card) lowers the bank balance and the card's debt.
 */
export function transactionEffect(transaction: Transaction, accountId: string): number {
  let effect = 0;
  if (transaction.kind === 'income' && transaction.accountId === accountId)
    effect += transaction.amount;
  if (transaction.kind === 'expense' && transaction.accountId === accountId)
    effect -= transaction.amount;
  if (transaction.kind === 'transfer') {
    if (transaction.accountId === accountId) effect -= transaction.amount + transaction.fee;
    if (transaction.toAccountId === accountId) effect += transaction.amount;
  }
  return effect;
}

/** Balance at the end of `upTo` (inclusive), or all time. */
export function accountBalance(
  account: Account,
  transactions: Transaction[],
  upTo?: string,
): number {
  return transactions.reduce(
    (balance, transaction) =>
      upTo && transaction.date > upTo
        ? balance
        : balance + transactionEffect(transaction, account.id),
    account.openingBalance,
  );
}

export function accountBalances(accounts: Account[], transactions: Transaction[], upTo?: string) {
  const balances = new Map(accounts.map((account) => [account.id, account.openingBalance]));
  for (const transaction of transactions) {
    if (upTo && transaction.date > upTo) continue;
    const touched = new Set([transaction.accountId, transaction.toAccountId]);
    for (const id of touched) {
      if (id && balances.has(id))
        balances.set(id, balances.get(id)! + transactionEffect(transaction, id));
    }
  }
  return balances;
}

/** Assets = positive balances, liabilities = negative balances, total = sum. */
export function balanceSummary(accounts: Account[], transactions: Transaction[], upTo?: string) {
  const balances = accountBalances(accounts, transactions, upTo);
  let assets = 0;
  let liabilities = 0;
  for (const value of balances.values()) {
    if (value >= 0) assets += value;
    else liabilities += value;
  }
  return { assets, liabilities, total: assets + liabilities, balances };
}
