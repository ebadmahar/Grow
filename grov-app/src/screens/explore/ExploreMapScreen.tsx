import { Platform } from 'react-native';
import { ExploreMapScreen as WebExploreMapScreen } from './ExploreMapScreen.web';
import { ExploreMapScreen as NativeExploreMapScreen } from './ExploreMapScreen.native';

export const ExploreMapScreen = Platform.OS === 'web' ? WebExploreMapScreen : NativeExploreMapScreen;
