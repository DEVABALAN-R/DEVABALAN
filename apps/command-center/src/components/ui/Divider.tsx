import { View } from 'react-native';
import { useTheme } from '@/theme';

export function Divider({ vertical = false }: { vertical?: boolean }) {
  const theme = useTheme();
  return (
    <View
      aria-hidden
      style={
        vertical
          ? { width: 1, alignSelf: 'stretch', backgroundColor: theme.colors.border }
          : { height: 1, backgroundColor: theme.colors.border }
      }
    />
  );
}
