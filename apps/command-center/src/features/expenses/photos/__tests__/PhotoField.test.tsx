import { act, fireEvent, screen } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { renderWithProviders } from '@/test/render';
import { useTransactionForm } from '../../state/transactionForm';
import { PhotoField } from '../PhotoField';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const asset = (patch: object) => ({
  canceled: false,
  assets: [
    {
      uri: 'file:///receipt.jpg',
      width: 300,
      height: 400,
      mimeType: 'image/jpeg',
      fileSize: 2_000,
      ...patch,
    },
  ],
});

beforeEach(() => {
  useTransactionForm.getState().openNew();
});

describe('PhotoField', () => {
  it('attaches an uploaded photo and removes it', async () => {
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue(asset({}) as never);
    await renderWithProviders(<PhotoField />);
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Upload' }));
    });
    expect(useTransactionForm.getState().draft.photo).toMatchObject({
      uri: 'file:///receipt.jpg',
      mimeType: 'image/jpeg',
      bytes: 2_000,
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Remove the photo' }));
    expect(useTransactionForm.getState().draft.photo).toBeNull();
  });

  it('refuses files that are not photos', async () => {
    jest
      .mocked(ImagePicker.launchImageLibraryAsync)
      .mockResolvedValue(asset({ mimeType: 'application/pdf' }) as never);
    await renderWithProviders(<PhotoField />);
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Upload' }));
    });
    expect(screen.getByText('Choose a photo (JPEG, PNG, WebP or HEIC).')).toBeTruthy();
    expect(useTransactionForm.getState().draft.photo).toBeNull();
  });

  it('asks for camera permission and explains a refusal', async () => {
    jest
      .mocked(ImagePicker.requestCameraPermissionsAsync)
      .mockResolvedValue({ granted: false } as never);
    await renderWithProviders(<PhotoField />);
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Take photo' }));
    });
    expect(screen.getByText('Allow camera access to take a receipt photo.')).toBeTruthy();
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  });
});
