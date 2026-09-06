import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeDashboardScreen } from '../screens/home/HomeDashboardScreen';
import { ExploreMapScreen } from '../screens/explore/ExploreMapScreen';
import { CreateActivityScreen } from '../screens/activity/CreateActivityScreen';
import { CommunityHubScreen } from '../screens/community/CommunityHubScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { CustomBottomDock } from '../components/navigation/CustomBottomDock';

const Tab = createBottomTabNavigator();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomDock {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeDashboardScreen} />
      <Tab.Screen name="ExploreTab" component={ExploreMapScreen} />
      <Tab.Screen name="CreateTab" component={CreateActivityScreen} />
      <Tab.Screen name="CommunityTab" component={CommunityHubScreen} />
      <Tab.Screen name="ProfileTab" component={UserProfileScreen} />
    </Tab.Navigator>
  );
};
