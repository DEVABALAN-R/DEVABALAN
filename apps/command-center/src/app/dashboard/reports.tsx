import { PlannedScreen } from '@/features/shell/PlannedScreen';
import { plannedScreens } from '@/features/shell/plannedScreens';

export default function Route() {
  return <PlannedScreen {...plannedScreens['reports']} />;
}
