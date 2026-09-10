import { Platform } from 'react-native';

// Platform-adaptive map preview:
// - Native (iOS/Android): uses react-native-maps (HomeMapPreview.native.tsx)
// - Web: uses iframe Leaflet map (HomeMapPreview.web.tsx)
// Metro bundler resolves .native.tsx automatically on native builds.
// This file serves as the fallback for cases where Metro doesn't auto-resolve.

let HomeMapPreviewComponent: any;
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  HomeMapPreviewComponent = require('./HomeMapPreview.web').HomeMapPreview;
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  HomeMapPreviewComponent = require('./HomeMapPreview.native').HomeMapPreview;
}

export const HomeMapPreview = HomeMapPreviewComponent;
export type { HomeMapPreviewProps } from './HomeMapPreview.native';
