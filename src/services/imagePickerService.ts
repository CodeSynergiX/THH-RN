import { Platform, PermissionsAndroid, Alert } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';

export interface PickedMedia {
  uri: string;
  fileName: string;
  type: string;
  fileSize: number;
  base64?: string;
  formattedSize: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission Required',
        message: 'The Helping Hand needs camera access to capture documents and profile photos.',
        buttonPositive: 'Grant Permission',
        buttonNegative: 'Cancel',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Camera permission request error:', err);
    return false;
  }
}

function extractAsset(response: ImagePickerResponse): PickedMedia | null {
  if (response.didCancel) {
    return null;
  }
  if (response.errorCode) {
    console.warn('ImagePicker Error: ', response.errorMessage);
    Alert.alert('Image Picker Error', response.errorMessage || 'Failed to capture image');
    return null;
  }
  const asset: Asset | undefined = response.assets && response.assets[0];
  if (!asset || !asset.uri) {
    return null;
  }

  const fileName =
    asset.fileName ||
    `IMG_${Date.now()}.${asset.type?.includes('png') ? 'png' : 'jpg'}`;
  const type = asset.type || 'image/jpeg';
  const fileSize = asset.fileSize || 0;

  return {
    uri: asset.uri,
    fileName,
    type,
    fileSize,
    base64: asset.base64 ? `data:${type};base64,${asset.base64}` : undefined,
    formattedSize: formatBytes(fileSize),
  };
}

/**
 * Capture a photo using real device camera.
 */
export async function captureFromCamera(): Promise<PickedMedia | null> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    Alert.alert(
      'Permission Denied',
      'Camera permission is required to take photos. Please enable it in system settings.',
    );
    return null;
  }

  try {
    const response = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      quality: 0.8,
      maxWidth: 1280,
      maxHeight: 1280,
      includeBase64: true,
      saveToPhotos: false,
    });
    return extractAsset(response);
  } catch (err) {
    console.warn('launchCamera error:', err);
    return null;
  }
}

/**
 * Pick an image from device gallery / photo library.
 */
export async function pickFromGallery(): Promise<PickedMedia | null> {
  try {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1280,
      maxHeight: 1280,
      includeBase64: true,
      selectionLimit: 1,
    });
    return extractAsset(response);
  } catch (err) {
    console.warn('launchImageLibrary error:', err);
    return null;
  }
}
