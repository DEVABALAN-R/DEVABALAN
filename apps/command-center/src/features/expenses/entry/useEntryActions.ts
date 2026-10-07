import { useState } from 'react';
import { useToast } from '@/components/feedback';
import type { Transaction, TransactionKind } from '@/lib/domain/expenses';
import { formatEntry } from '../format';
import { useExpenseStore } from '../state/expenseStore';
import { useTransactionForm } from '../state/transactionForm';

export const kindLabel: Record<TransactionKind, string> = {
  expense: 'Expense',
  income: 'Income',
  transfer: 'Transfer',
};

/** A save made with Continue, shown inside the still-open sheet with its own Undo. */
export type SavedNotice = { message: string; undo: () => void };

/** Save / continue / delete for the entry sheet, each with an Undo. */
export function useEntryActions() {
  const toast = useToast();
  const [notice, setNotice] = useState<SavedNotice | null>(null);

  const save = (mode: 'save' | 'continue') => {
    const result = useTransactionForm.getState().submit(mode);
    if (!result.ok) return;
    const { transaction, created, previous } = result;
    const store = useExpenseStore.getState();
    const undo = () => {
      if (created) store.deleteTransaction(transaction.id);
      else if (previous) store.restoreTransactions([previous]);
    };
    const message = `${kindLabel[transaction.kind]} ${created ? 'added' : 'updated'} · ${formatEntry(transaction.amount)}`;
    if (mode === 'continue') {
      setNotice({
        message,
        undo: () => {
          undo();
          setNotice(null);
        },
      });
    } else {
      setNotice(null);
      toast.show({ message, action: { label: 'Undo', onPress: undo } });
    }
  };

  const remove = () => {
    const { editingId, close } = useTransactionForm.getState();
    if (!editingId) return;
    const removed: Transaction | null = useExpenseStore.getState().deleteTransaction(editingId);
    close();
    setNotice(null);
    if (removed)
      toast.show({
        message: `${kindLabel[removed.kind]} deleted · ${formatEntry(removed.amount)}`,
        action: {
          label: 'Undo',
          onPress: () => useExpenseStore.getState().restoreTransactions([removed]),
        },
      });
  };

  return { save, remove, notice, clearNotice: () => setNotice(null) };
}
