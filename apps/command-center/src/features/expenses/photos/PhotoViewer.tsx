import { Image } from 'react-native';
import { Sheet } from '@/components/overlays';
import type { Photo } from '@/lib/domain/expenses';

/** Full-size receipt photo. */
export function PhotoViewer({
  photo,
  visible,
  onClose,
}: {
  photo: Photo | null;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible && !!photo} onClose={onClose} title="Receipt photo" width={640}>
      {photo ? (
        <Image
          source={{ uri: photo.uri }}
          accessibilityLabel="Receipt photo"
          resizeMode="contain"
          style={{
            width: '100%',
            aspectRatio: photo.width && photo.height ? photo.width / photo.height : 3 / 4,
            maxHeight: 640,
          }}
        />
      ) : null}
    </Sheet>
  );
}
