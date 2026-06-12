import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../context/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import MenuScreen from '../screens/MenuScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import AcademicsScreen from '../screens/AcademicsScreen';
import StudentRequestsScreen from '../screens/StudentRequestsScreen';

export type AppTabParamList = {
  Home: undefined;
  Announcements: undefined;
  Menu: undefined;
  Academics: undefined;
  Map: undefined;
  Profile: undefined;
  Admin: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<
  keyof AppTabParamList,
  { label: string; icon: IoniconName; iconOutline: IoniconName }
> = {
  Home:          { label: 'Ana Sayfa',  icon: 'home',        iconOutline: 'home-outline' },
  Announcements: { label: 'Duyurular', icon: 'megaphone',    iconOutline: 'megaphone-outline' },
  Menu:          { label: 'Yemekhane', icon: 'restaurant',   iconOutline: 'restaurant-outline' },
  Academics:     { label: 'Akademik',  icon: 'school',       iconOutline: 'school-outline' },
  Map:           { label: 'Harita',    icon: 'map',          iconOutline: 'map-outline' },
  Profile:       { label: 'Profil',    icon: 'person',       iconOutline: 'person-outline' },
  Admin:         { label: 'Admin',     icon: 'shield',       iconOutline: 'shield-outline' },
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
      <Tab.Screen name="Announcements" component={AnnouncementsScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
      {/* Öğrenci → Akademisyenler listesi  |  Hoca → Randevu talepleri */}
      <Tab.Screen
        name="Academics"
        component={isTeacher ? StudentRequestsScreen : AcademicsScreen}
        options={{
          tabBarLabel: isTeacher ? 'Öğrenciler' : 'Akademik',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused
                ? (isTeacher ? 'people' : 'school')
                : (isTeacher ? 'people-outline' : 'school-outline')}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen name="Map" component={MapScreen} />
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
