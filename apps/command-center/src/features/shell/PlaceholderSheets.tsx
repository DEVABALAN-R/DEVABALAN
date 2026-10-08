import { View } from 'react-native';
import { Search, type LucideIcon } from '@/components/icons';
import { EmptyState } from '@/components/feedback';
import { Sheet } from '@/components/overlays';
import { Badge } from '@/components/ui';
import { useUiStore } from '@/state/ui';

/**
 * PLACEHOLDER. Global search / command palette ships in Phase 5.
 */
export function PlaceholderSheets() {
  const searchOpen = useUiStore((state) => state.searchOpen);
  const closeSearch = useUiStore((state) => state.closeSearch);
  return (
    <PlannedSheet
      visible={searchOpen}
      onClose={closeSearch}
      title="Search"
      description="Find transactions, funds, stocks and pages — or type a command."
      icon={Search}
      phase="Phase 5"
      body="Global search and the ⌘K command palette are not built yet."
    />
  );
}

type PlannedSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Plan phase that delivers the feature, e.g. "Phase 6". */
  phase: string;
  body: string;
};

/** Clearly labelled stand-in for an action that is planned but not built. Saves nothing. */
export function PlannedSheet({
  visible,
  onClose,
  title,
  description,
  icon,
  phase,
  body,
}: PlannedSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title} description={description}>
      <View style={{ alignItems: 'center' }}>
        <Badge label={`Planned · ${phase}`} tone="warning" />
        <EmptyState icon={icon} title="Not available yet" body={body} />
      </View>
    </Sheet>
  );
}
