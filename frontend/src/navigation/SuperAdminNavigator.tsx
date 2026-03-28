import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { SuperAdminTabParamList } from './types';
import { colors } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';
import SuperAdminDashboardScreen from '../screens/superAdmin/DashboardScreen';
import CollegesScreen from '../screens/superAdmin/CollegesScreen';
import CollegeDetailScreen from '../screens/superAdmin/CollegeDetailScreen';
import AnalyticsScreen from '../screens/superAdmin/AnalyticsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

const Tab = createBottomTabNavigator<SuperAdminTabParamList>();
const Stack = createNativeStackNavigator();

const tabIcon = (label: string, focused: boolean, color: string) => {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    Colleges: '🏫',
    Analytics: '📊',
    Settings: '⚙️',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22 }}>{icons[label] || '•'}</Text>
    </View>
  );
};

const SuperAdminTabs: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? colors.surface.dark : colors.surface.light,
          borderTopColor: isDark ? colors.border.dark : colors.border.light,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? colors.text.secondary.dark : colors.text.secondary.light,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => tabIcon(route.name, focused, color),
      })}>
      <Tab.Screen name="Dashboard" component={SuperAdminDashboardScreen} />
      <Tab.Screen name="Colleges" component={CollegesScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Settings" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const SuperAdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={SuperAdminTabs} />
      <Stack.Screen name="CollegeDetail" component={CollegeDetailScreen} />
    </Stack.Navigator>
  );
};

export default SuperAdminNavigator;
