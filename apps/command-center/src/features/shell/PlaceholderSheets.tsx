import { View } from 'react-native';
import { Search, Zap, type LucideIcon } from '@/components/icons';
import { EmptyState } from '@/components/feedback';
import { Sheet } from '@/components/overlays';
import { Badge } from '@/components/ui';
import { useUiStore } from '@/state/ui';

/**
 * PLACEHOLDERS. Quick add (type switch, amount, category grid, smart defaults)
 * and global search / command palette ship in Phase 5. Nothing is saved here.
 */
export function PlaceholderSheets() {
  const quickAddOpen = useUiStore((state) => state.quickAddOpen);
  const closeQuickAdd = useUiStore((state) => state.closeQuickAdd);
  const searchOpen = useUiStore((state) => state.searchOpen);
  const closeSearch = useUiStore((state) => state.closeSearch);
  return (
    <>
      <Planned
        visible={quickAddOpen}
        onClose={closeQuickAdd}
        title="Quick add"
        description="Add an expense, income or transfer in a few taps."
        icon={Zap}
        body="Quick add arrives with the expense manager. Keep using the current app to record transactions until then."
      />
      <Planned
        visible={searchOpen}
        onClose={closeSearch}
        title="Search"
        description="Find transactions, funds, stocks and pages — or type a command."
        icon={Search}
        body="Global search and the ⌘K command palette arrive with the expense manager."
      />
    </>
  );
}

function Planned(props: {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: LucideIcon;
  body: string;
}) {
  return (
    <Sheet
      visible={props.visible}
      onClose={props.onClose}
      title={props.title}
      description={props.description}
    >
      <View style={{ alignItems: 'center' }}>
        <Badge label="Planned · Phase 5" tone="warning" />
        <EmptyState icon={props.icon} title="Not available yet" body={props.body} />
      </View>
    </Sheet>
  );
}
