import { isValidIsoDate } from './dates';
import type { Account, Category, Transaction, TransactionKind } from './types';

/** ₹100 crore in paise — a sanity ceiling for a personal ledger. */
export const MAX_AMOUNT = 100_000_000_000;
export const MAX_NOTE_LENGTH = 120;
export const MAX_NAME_LENGTH = 30;

/**
 * Parses user input like "1,250.50", "₹ 250" or "99." into integer paise.
 * Returns null for anything that is not a plain non-negative amount with at
 * most two decimals (no floating-point arithmetic involved).
 */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, '');
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!match) return null;
  const rupees = Number(match[1]);
  const paise = Number((match[2] ?? '').padEnd(2, '0'));
  const value = rupees * 100 + paise;
  return Number.isSafeInteger(value) ? value : null;
}

/** Paise → editable text without grouping ("1250.5" → "1250.50"). */
export function amountToInput(paise: number): string {
  if (!paise) return '';
  const rupees = Math.floor(paise / 100);
  const fraction = paise % 100;
  return fraction ? `${rupees}.${String(fraction).padStart(2, '0')}` : String(rupees);
}

export type TransactionDraft = {
  kind: TransactionKind;
  date: string;
  amountText: string;
  categoryId: string | null;
  accountId: string | null;
  toAccountId: string | null;
  feeText: string;
  note: string;
};

export type DraftField = 'date' | 'amount' | 'category' | 'account' | 'toAccount' | 'fee' | 'note';
export type DraftErrors = Partial<Record<DraftField, string>>;
export type ValidTransaction = Omit<Transaction, 'id' | 'createdAt'>;

/** Field order used to focus the first invalid field. */
export const DRAFT_FIELD_ORDER: DraftField[] = [
  'date',
  'amount',
  'category',
  'account',
  'toAccount',
  'fee',
  'note',
];

export function validateDraft(
  draft: TransactionDraft,
  context: { accounts: Account[]; categories: Category[] },
): { errors: DraftErrors; value: ValidTransaction | null } {
  const errors: DraftErrors = {};
  const amount = parseAmount(draft.amountText);
  if (!isValidIsoDate(draft.date)) errors.date = 'Choose a valid date.';
  if (amount === null) errors.amount = 'Enter an amount like 250 or 1,250.50.';
  else if (amount <= 0) errors.amount = 'Amount must be more than zero.';
  else if (amount > MAX_AMOUNT) errors.amount = 'Amount is too large.';

  const accountIds = new Set(context.accounts.map((account) => account.id));
  if (!draft.accountId || !accountIds.has(draft.accountId)) {
    errors.account =
      draft.kind === 'transfer' ? 'Choose the account money leaves.' : 'Choose an account.';
  }

  let fee = 0;
  if (draft.kind === 'transfer') {
    if (!draft.toAccountId || !accountIds.has(draft.toAccountId))
      errors.toAccount = 'Choose the account money goes to.';
    else if (draft.toAccountId === draft.accountId)
      errors.toAccount = 'Choose a different account.';
    if (draft.feeText.trim()) {
      const parsed = parseAmount(draft.feeText);
      if (parsed === null || parsed > MAX_AMOUNT)
        errors.fee = 'Enter a valid fee or leave it empty.';
      else fee = parsed;
    }
  } else {
    const category = context.categories.find((item) => item.id === draft.categoryId);
    if (!category) errors.category = 'Choose a category.';
    else if (category.kind !== draft.kind) errors.category = `Choose an ${draft.kind} category.`;
  }

  const note = draft.note.trim();
  if (note.length > MAX_NOTE_LENGTH)
    errors.note = `Keep the note under ${MAX_NOTE_LENGTH} characters.`;

  if (Object.keys(errors).length || amount === null || !draft.accountId)
    return { errors, value: null };
  return {
    errors,
    value: {
      kind: draft.kind,
      date: draft.date,
      amount,
      accountId: draft.accountId,
      toAccountId: draft.kind === 'transfer' ? draft.toAccountId : null,
      fee: draft.kind === 'transfer' ? fee : 0,
      categoryId: draft.kind === 'transfer' ? null : draft.categoryId,
      note,
    },
  };
}

/** Name rules shared by categories, subcategories and accounts. Returns an error or null. */
export function validateName(
  name: string,
  siblings: { id: string; name: string }[],
  excludeId?: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a name.';
  if (trimmed.length > MAX_NAME_LENGTH) return `Keep it under ${MAX_NAME_LENGTH} characters.`;
  const key = trimmed.toLocaleLowerCase();
  if (
    siblings.some((item) => item.id !== excludeId && item.name.trim().toLocaleLowerCase() === key)
  ) {
    return 'That name is already used here.';
  }
  return null;
}
