import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AnnouncementDetailScreen from '../screens/AnnouncementDetailScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import NewsScreen from '../screens/NewsScreen';
import EventsScreen from '../screens/EventsScreen';
import AppTabs from './AppTabs';
import ChatScreen from '../screens/ChatScreen';
import TeacherProfileScreen from '../screens/TeacherProfileScreen';
import StudentRequestsScreen from '../screens/StudentRequestsScreen';
import TeacherDashboardScreen from '../screens/TeacherDashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { Announcement, Teacher } from '../types/models';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AppRootParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  AnnouncementDetail: { item: Announcement };
  News: undefined;
  Events: undefined;
  Chat: { teacher: Teacher };
  TeacherProfile: { teacher: Teacher };
  StudentRequests: undefined;
  TeacherDashboard: undefined;
  Notifications: undefined;
};

type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppRootStack = createNativeStackNavigator<AppRootParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

const HEADER_THEME = {
  headerStyle: { backgroundColor: '#1E3A5F' },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
  headerBackTitle: '',
  animation: 'slide_from_right' as const,
};

function AppNavigator() {
  return (
    <AppRootStack.Navigator screenOptions={{ headerShown: false }}>
      <AppRootStack.Screen name="MainTabs" component={AppTabs} />
      <AppRootStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <AppRootStack.Screen
        name="AnnouncementDetail"
        component={AnnouncementDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <AppRootStack.Screen
        name="News"
        component={NewsScreen}
        options={{ ...HEADER_THEME, headerShown: true, headerTitle: 'Kampüs Haberleri' }}
      />
      <AppRootStack.Screen
        name="Events"
        component={EventsScreen}
        options={{ ...HEADER_THEME, headerShown: true, headerTitle: 'Etkinlikler' }}
      />
      <AppRootStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <AppRootStack.Screen
        name="TeacherProfile"
        component={TeacherProfileScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <AppRootStack.Screen
        name="StudentRequests"
        component={StudentRequestsScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <AppRootStack.Screen
        name="TeacherDashboard"
        component={TeacherDashboardScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <AppRootStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
    </AppRootStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="App" component={AppNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
