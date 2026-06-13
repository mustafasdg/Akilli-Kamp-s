import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../context/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import MenuScreen from '../screens/MenuScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import AcademicsScreen from '../screens/AcademicsScreen';
import TeacherMessagesScreen from '../screens/TeacherMessagesScreen';

export type AppTabParamList = {
  Home: undefined;
  Menu: undefined;
  Academics: undefined;
  Map: undefined;
  Messages: undefined;
  Profile: undefined;
  Admin: undefined;
};
// Not: Öğretmenler için "Academics" sekmesi artık gösterilmiyor.
// StudentRequestsScreen'e TeacherDashboard → Randevu Talepleri üzerinden ulaşılır.

const Tab = createBottomTabNavigator<AppTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<
  keyof AppTabParamList,
  { label: string; icon: IoniconName; iconOutline: IoniconName }
> = {
  Home:      { label: 'Ana Sayfa',       icon: 'home',           iconOutline: 'home-outline' },
  Menu:      { label: 'Yemekhane',       icon: 'restaurant',     iconOutline: 'restaurant-outline' },
  Academics: { label: 'Akademisyenler',  icon: 'school',         iconOutline: 'school-outline' },
  Map:       { label: 'Harita',          icon: 'map',            iconOutline: 'map-outline' },
  Messages:  { label: 'Mesajlar',        icon: 'chatbubbles',    iconOutline: 'chatbubbles-outline' },
  Profile:   { label: 'Profil',          icon: 'person',         iconOutline: 'person-outline' },
  Admin:     { label: 'Admin',           icon: 'shield',         iconOutline: 'shield-outline' },
};

export default function AppTabs() {
  const { user } = useAuth();
  const colors    = useColors();
  const isAdmin   = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = TAB_CONFIG[route.name as keyof AppTabParamList];
        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.primary,
            borderTopColor: colors.primaryDark,
            borderTopWidth: 1,
            paddingBottom: 6,
            paddingTop: 4,
            height: 62,
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarLabel: cfg.label,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? cfg.icon : cfg.iconOutline}
              size={size}
              color={color}
            />
          ),
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
      {/* Öğrenci → Akademisyenler listesi; Hoca → Akademisyenler sekmesi yok */}
      {!isTeacher && (
        <Tab.Screen name="Academics" component={AcademicsScreen} />
      )}
      <Tab.Screen name="Map" component={MapScreen} />
      {/* Öğretmenler için birleşik Sohbetler sekmesi */}
      {isTeacher && (
        <Tab.Screen
          name="Messages"
          component={TeacherMessagesScreen}
          options={{
            tabBarLabel: 'Sohbetler',
          }}
        />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'shield' : 'shield-outline'} size={size} color={color} />
            ),
            tabBarActiveTintColor: '#C4B5FD',
          }}
        />
      )}
    </Tab.Navigator>
  );
}
