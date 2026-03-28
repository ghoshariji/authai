import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { TeacherTabParamList } from './types';
import { colors } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';
import TeacherDashboardScreen from '../screens/teacher/DashboardScreen';
import AttendanceScreen from '../screens/teacher/AttendanceScreen';
import AttendanceReportScreen from '../screens/teacher/AttendanceReportScreen';
import ExamsScreen from '../screens/teacher/ExamsScreen';
import ResultsScreen from '../screens/teacher/ResultsScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

const Tab = createBottomTabNavigator<TeacherTabParamList>();
const Stack = createNativeStackNavigator();

const tabIcon = (name: string) => {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    Classes: '📚',
    Attendance: '✅',
    Exams: '📝',
    Chat: '💬',
  };
  return <Text style={{ fontSize: 20 }}>{icons[name] || '•'}</Text>;
};

const TeacherTabs: React.FC = () => {
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
      <Tab.Screen name="Dashboard" component={TeacherDashboardScreen} />
      <Tab.Screen name="Classes" component={AttendanceScreen} />
      <Tab.Screen name="Attendance" component={AttendanceReportScreen} />
      <Tab.Screen name="Exams" component={ExamsScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
    </Tab.Navigator>
  );
};

const TeacherNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TeacherTabs} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default TeacherNavigator;
