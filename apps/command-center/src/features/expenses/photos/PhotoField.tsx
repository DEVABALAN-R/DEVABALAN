import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Camera, ImagePlus, X } from '@/components/icons';
import { Button, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import { FieldRow } from '../entry/FieldRow';
import { useTransactionForm } from '../state/transactionForm';
import { pickPhoto } from './pickPhoto';
import { PhotoViewer } from './PhotoViewer';

/** "Photo" line of the entry form: take or upload a receipt, see it, or remove it. */
export function PhotoField() {
  const theme = useTheme();
  const photo = useTransactionForm((state) => state.draft.photo);
  const update = useTransactionForm((state) => state.update);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);
  const choose = async (source: 'camera' | 'library') => {
    const result = await pickPhoto(source);
    if (!result) return;
    if ('error' in result) setError(result.error);
    else {
      setError(null);
      update({ photo: result.photo });
    }
  };
  return (
    <>
      <FieldRow label="Photo" active={false} error={error ?? undefined}>
        {photo ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
            <Pressable
              role="button"
              accessibilityLabel="View the receipt photo"
              onPress={() => setViewing(true)}
            >
              <Image
                source={{ uri: photo.uri }}
                style={{ width: 44, height: 44, borderRadius: theme.radius.sm }}
                accessibilityIgnoresInvertColors
              />
            </Pressable>
            <Text variant="caption" color="textTertiary" style={{ flex: 1 }} numberOfLines={1}>
              Not uploaded in the preview
            </Text>
            <Pressable
              role="button"
              accessibilityLabel="Remove the photo"
              hitSlop={8}
              onPress={() => update({ photo: null })}
            >
              <X size={16} color={theme.colors.textTertiary} />
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: theme.space[2], paddingVertical: 4 }}>
            <Button
              label="Take photo"
              icon={Camera}
              size="sm"
              variant="secondary"
              onPress={() => choose('camera')}
            />
            <Button
              label="Upload"
              icon={ImagePlus}
              size="sm"
              variant="secondary"
              onPress={() => choose('library')}
            />
          </View>
        )}
      </FieldRow>
      <PhotoViewer photo={photo} visible={viewing} onClose={() => setViewing(false)} />
    </>
  );
}
