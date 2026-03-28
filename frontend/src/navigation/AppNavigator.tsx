import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector, useAppDispatch } from '../store';
import { setCredentials, setLoading } from '../store/slices/authSlice';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { socketService } from '../services/socket';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import SuperAdminNavigator from './SuperAdminNavigator';
import CollegeAdminNavigator from './CollegeAdminNavigator';
import TeacherNavigator from './TeacherNavigator';
import StudentNavigator from './StudentNavigator';
import Loader from '../components/common/Loader';
import { User } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user, accessToken } = useAppSelector(state => state.auth);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const token = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const userData = await storage.getObject<User>(STORAGE_KEYS.USER);
        if (token && userData) {
          dispatch(setCredentials({ user: userData, accessToken: token }));
          socketService.connect(token);
        } else {
          dispatch(setLoading(false));
        }
      } catch {
        dispatch(setLoading(false));
      }
    };
    bootstrapAuth();
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      socketService.connect(accessToken);
    }
  }, [isAuthenticated, accessToken]);

  if (isLoading) {
    return <Loader fullScreen message="Loading..." />;
  }

  const getInitialRoute = (): keyof RootStackParamList => {
    if (!isAuthenticated) return 'Auth';
    switch (user?.role) {
      case 'SUPER_ADMIN': return 'SuperAdmin';
      case 'COLLEGE_ADMIN': return 'CollegeAdmin';
      case 'TEACHER': return 'Teacher';
      case 'STUDENT': return 'Student';
      default: return 'Auth';
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="SuperAdmin" component={SuperAdminNavigator} />
        <Stack.Screen name="CollegeAdmin" component={CollegeAdminNavigator} />
        <Stack.Screen name="Teacher" component={TeacherNavigator} />
        <Stack.Screen name="Student" component={StudentNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
