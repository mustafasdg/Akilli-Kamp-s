import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import HomeScreen from '../screens/HomeScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import MenuScreen from '../screens/MenuScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type AppTabParamList = {
  Home: undefined;
  Announcements: undefined;
  Menu: undefined;
  Map: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<
  keyof AppTabParamList,
  { label: string; icon: IoniconName; iconOutline: IoniconName }
> = {
  Home:          { label: 'Ana Sayfa',  icon: 'home',       iconOutline: 'home-outline' },
  Announcements: { label: 'Duyurular', icon: 'megaphone',   iconOutline: 'megaphone-outline' },
  Menu:          { label: 'Yemekhane', icon: 'restaurant',  iconOutline: 'restaurant-outline' },
  Map:           { label: 'Harita',    icon: 'map',         iconOutline: 'map-outline' },
  Profile:       { label: 'Profil',    icon: 'person',      iconOutline: 'person-outline' },
};

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = TAB_CONFIG[route.name as keyof AppTabParamList];
        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: 6,
            height: 60,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
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
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
