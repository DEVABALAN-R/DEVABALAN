import { Zap } from '@/components/icons';
import { View } from 'react-native';
import { EmptyState } from '@/components/feedback';
import { Sheet } from '@/components/overlays';
import { Badge } from '@/components/ui';
import { useUiStore } from '@/state/ui';

/**
 * PLACEHOLDER (Phase 1). The real quick-add flow (type switch, amount,
 * category grid, smart defaults) ships with the transactions module in Phase 5.
 * Nothing is saved here.
 */
export function QuickAddSheet() {
  const open = useUiStore((state) => state.quickAddOpen);
  const close = useUiStore((state) => state.closeQuickAdd);
  return (
    <Sheet
      visible={open}
      onClose={close}
      title="Quick add"
      description="Add an expense, income or transfer in a few taps."
    >
      <View style={{ alignItems: 'center' }}>
        <Badge label="Planned · Phase 5" tone="warning" />
        <EmptyState
          icon={Zap}
          title="Not available yet"
          body="Quick add arrives with the new transactions module. Keep using the current app to record transactions until then."
        />
      </View>
    </Sheet>
  );
}
