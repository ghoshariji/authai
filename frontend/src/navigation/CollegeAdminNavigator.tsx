import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { CollegeAdminTabParamList } from './types';
import { colors } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';
import CollegeAdminDashboardScreen from '../screens/collegeAdmin/DashboardScreen';
import DepartmentsScreen from '../screens/collegeAdmin/DepartmentsScreen';
import StudentsScreen from '../screens/collegeAdmin/StudentsScreen';
import AddStudentScreen from '../screens/collegeAdmin/AddStudentScreen';
import TeachersScreen from '../screens/collegeAdmin/TeachersScreen';
import AddTeacherScreen from '../screens/collegeAdmin/AddTeacherScreen';
import NoticesScreen from '../screens/collegeAdmin/NoticesScreen';
import SubscriptionScreen from '../screens/collegeAdmin/SubscriptionScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

const Tab = createBottomTabNavigator<CollegeAdminTabParamList>();
const Stack = createNativeStackNavigator();

const tabIcon = (name: string) => {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    Departments: '🏛️',
    Teachers: '👨‍🏫',
    Students: '🎓',
    More: '☰',
  };
  return <Text style={{ fontSize: 20 }}>{icons[name] || '•'}</Text>;
};

const CollegeAdminTabs: React.FC = () => {
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
      <Tab.Screen name="Dashboard" component={CollegeAdminDashboardScreen} />
      <Tab.Screen name="Departments" component={DepartmentsScreen} />
      <Tab.Screen name="Teachers" component={TeachersScreen} />
      <Tab.Screen name="Students" component={StudentsScreen} />
      <Tab.Screen name="More" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const CollegeAdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={CollegeAdminTabs} />
      <Stack.Screen name="AddStudent" component={AddStudentScreen} />
      <Stack.Screen name="AddTeacher" component={AddTeacherScreen} />
      <Stack.Screen name="Notices" component={NoticesScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default CollegeAdminNavigator;
