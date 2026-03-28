import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { StudentTabParamList } from './types';
import { colors } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';
import StudentDashboardScreen from '../screens/student/DashboardScreen';
import StudentAttendanceScreen from '../screens/student/AttendanceScreen';
import StudentResultsScreen from '../screens/student/ResultsScreen';
import TimetableScreen from '../screens/student/TimetableScreen';
import StudentNoticesScreen from '../screens/student/NoticesScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
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
      <Tab.Screen name="Attendance" component={StudentAttendanceScreen} />
      <Tab.Screen name="Results" component={StudentResultsScreen} />
      <Tab.Screen name="Timetable" component={TimetableScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
    </Tab.Navigator>
  );
};

const StudentNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={StudentTabs} />
      <Stack.Screen name="Notices" component={StudentNoticesScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default StudentNavigator;
