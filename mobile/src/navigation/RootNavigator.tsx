import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import OnboardingScreen, { ONBOARDING_KEY } from '../screens/OnboardingScreen';
import AnnouncementDetailScreen from '../screens/AnnouncementDetailScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import AppTabs from './AppTabs';
import { Announcement } from '../types/models';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AppRootParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  AnnouncementDetail: { item: Announcement };
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

function AppNavigator() {
  return (
    <AppRootStack.Navigator screenOptions={{ headerShown: false }}>
      <AppRootStack.Screen name="MainTabs" component={AppTabs} />
      <AppRootStack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_right' }} />
      <AppRootStack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} options={{ animation: 'slide_from_right' }} />
    </AppRootStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => setOnboardingDone(val === 'true'));
  }, []);

  if (isLoading || onboardingDone === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!onboardingDone) {
    return <OnboardingScreen onDone={() => setOnboardingDone(true)} />;
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
