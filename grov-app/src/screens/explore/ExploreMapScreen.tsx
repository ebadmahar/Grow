import { Platform } from 'react-native';

// Platform-adaptive ExploreMapScreen:
// - Native (iOS/Android): uses WebView + Leaflet (ExploreMapScreen.native.tsx)
// - Web: uses iframe + Leaflet (ExploreMapScreen.web.tsx)
// Metro resolves .native.tsx automatically on native builds.

let ExploreMapScreenComponent: any;
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExploreMapScreenComponent = require('./ExploreMapScreen.web').ExploreMapScreen;
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExploreMapScreenComponent = require('./ExploreMapScreen.native').ExploreMapScreen;
}

export const ExploreMapScreen = ExploreMapScreenComponent;
