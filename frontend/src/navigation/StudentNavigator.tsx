import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useSelector } from 'react-redux';
import { StudentTabParamList } from './types';
import { colors } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';
import { selectFeatureConfig } from '../store/slices/authSlice';
import StudentDashboardScreen from '../screens/student/DashboardScreen';
import StudentAttendanceScreen from '../screens/student/AttendanceScreen';
import StudentResultsScreen from '../screens/student/ResultsScreen';
import TimetableScreen from '../screens/student/TimetableScreen';
import StudentNoticesScreen from '../screens/student/NoticesScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import ContactsScreen from '../screens/student/ContactsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

const Tab = createBottomTabNavigator<StudentTabParamList>();
const Stack = createNativeStackNavigator();

const tabIcon = (name: string) => {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    Attendance: '✅',
    Results: '📊',
    Timetable: '📅',
    Chat: '💬',
  };
  return <Text style={{ fontSize: 20 }}>{icons[name] || '•'}</Text>;
};

const StudentTabs: React.FC = () => {
  const { isDark } = useTheme();
  const featureConfig = useSelector(selectFeatureConfig);

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
        tabBarIcon: () => tabIcon(route.name),
      })}>
      <Tab.Screen name="Dashboard" component={StudentDashboardScreen} />
      {featureConfig.is_attendance_display && (
        <Tab.Screen name="Attendance" component={StudentAttendanceScreen} />
      )}
      {featureConfig.is_results_display && (
        <Tab.Screen name="Results" component={StudentResultsScreen} />
      )}
      {featureConfig.is_timetable_display && (
        <Tab.Screen name="Timetable" component={TimetableScreen} />
      )}
      {featureConfig.is_chat_feature_enabled && (
        <Tab.Screen name="Chat" component={ChatListScreen} />
      )}
    </Tab.Navigator>
  );
};

const StudentNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={StudentTabs} />
      {/* Notices accessible from Dashboard even when tab hidden */}
      <Stack.Screen name="Notices" component={StudentNoticesScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      {/* Contacts for starting 1-on-1 DM with college peers */}
      <Stack.Screen name="Contacts" component={ContactsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default StudentNavigator;
