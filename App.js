import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useState, useEffect } from 'react';
import { auth ,onAuthStateChanged} from './firebase/config';
import { useColorScheme, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './theme/theme';

import ProfileScreen from './screens/ProfileScreen';
import AuthScreen from './screens/AuthScreen';
import UsersScreen from './screens/UsersScreen';
import ChatScreen from './screens/ChatScreen';
import SearchScreen from './screens/SearchScreen';
import UserProfile from './screens/UserProfile';
import NotificationsScreen from './screens/NotificationsScreen';
import SplashScreen from './screens/SplashScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const profileScreenConfig = {
  animation: 'slide_from_right',
  presentation: 'card',
  animationDuration: 300,
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.5, 1],
        }),
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
};

function MainTabs() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Chats') {
            return (
              <Image
                source={colorScheme === 'dark' 
                  ? require('./assets/darklogo.png')
                  : require('./assets/lightlogo.png')
                }
                style={{
                  width: size,
                  height: size,
                  opacity: focused ? 1 : 0.5
                }}
              />
            );
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return iconName ? <Ionicons name={iconName} size={size} color={color} /> : null;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      })}
    >
      <Tab.Screen 
        name="Chats" 
        component={UsersScreen}
        options={{ headerShown: true }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ title: 'Search Users' }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.colors.background,
          text: theme.colors.text,
          border: theme.colors.border,
          card: theme.colors.surface,
        },
      }}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
        }}
      >
        {!user ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="UserProfile" 
              component={UserProfile}
              options={profileScreenConfig}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
