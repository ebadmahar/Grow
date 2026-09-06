import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { InterestSelectionScreen } from '../screens/auth/InterestSelectionScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { PlantationFormScreen } from '../screens/activity/PlantationFormScreen';
import { PlantationConfirmScreen } from '../screens/activity/PlantationConfirmScreen';
import { SeedingFormScreen } from '../screens/activity/SeedingFormScreen';
import { SeedingConfirmScreen } from '../screens/activity/SeedingConfirmScreen';
import { MyActivitiesScreen } from '../screens/activity/MyActivitiesScreen';
import { ActivityDetailsScreen } from '../screens/activity/ActivityDetailsScreen';
import { ActivityMapDetailsScreen } from '../screens/explore/ActivityMapDetailsScreen';
import { AddMonitoringRecordScreen } from '../screens/monitoring/AddMonitoringRecordScreen';
import { CreateTaskScreen } from '../screens/community/CreateTaskScreen';
import { TaskDetailsScreen } from '../screens/community/TaskDetailsScreen';
import { MonthlyGoalScreen } from '../screens/community/MonthlyGoalScreen';
import { LeaderboardScreen } from '../screens/leaderboard/LeaderboardScreen';
import { MyRankingScreen } from '../screens/leaderboard/MyRankingScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { AppSettingsScreen } from '../screens/profile/AppSettingsScreen';
import { ReportActivityScreen } from '../screens/reports/ReportActivityScreen';
import { ReportBugSuggestionScreen } from '../screens/reports/ReportBugSuggestionScreen';
import { SpeciesDetailsScreen } from '../screens/species/SpeciesDetailsScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      {/* Auth Stack */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="InterestSelection" component={InterestSelectionScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />

      {/* Main App Bottom Tabs */}
      <Stack.Screen name="MainApp" component={MainTabNavigator} />

      {/* Activity Logging Flow */}
      <Stack.Screen name="PlantationForm" component={PlantationFormScreen} />
      <Stack.Screen name="PlantationConfirm" component={PlantationConfirmScreen} />
      <Stack.Screen name="SeedingForm" component={SeedingFormScreen} />
      <Stack.Screen name="SeedingConfirm" component={SeedingConfirmScreen} />
      <Stack.Screen name="MyActivities" component={MyActivitiesScreen} />
      <Stack.Screen name="ActivityDetails" component={ActivityDetailsScreen} />
      <Stack.Screen name="ActivityMapDetails" component={ActivityMapDetailsScreen} />

      {/* Monitoring Observations */}
      <Stack.Screen name="AddMonitoringRecord" component={AddMonitoringRecordScreen} />

      {/* Community Tasks & Goals */}
      <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
      <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} />
      <Stack.Screen name="MonthlyGoal" component={MonthlyGoalScreen} />

      {/* Gamification & Leaderboard */}
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="MyRanking" component={MyRankingScreen} />

      {/* Notifications & Settings */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="AppSettings" component={AppSettingsScreen} />

      {/* Issue Reports & Bugs */}
      <Stack.Screen name="ReportActivity" component={ReportActivityScreen} />
      <Stack.Screen name="ReportBugSuggestion" component={ReportBugSuggestionScreen} />
      <Stack.Screen name="SpeciesDetails" component={SpeciesDetailsScreen} />

      {/* Admin Moderation Panel */}
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    </Stack.Navigator>
  );
};
