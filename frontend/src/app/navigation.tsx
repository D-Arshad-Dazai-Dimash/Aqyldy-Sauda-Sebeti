import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../store/authStore';

// Импорты экранов
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ScanScreen from '../screens/ScanScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SearchScreen from '../screens/SearchScreen';
import StoreScreen from '../screens/StoreScreen'; // СЕНІҢ БЕТІҢ
import ProductScreen from '../screens/ProductScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerShown: false,
  animation: 'fade_from_bottom' as const,
};

// Кастомная центральная кнопка сканера
const ScanButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={styles.scanButtonContainer}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.scanButtonInner}>
      {children}
    </View>
  </TouchableOpacity>
);

// 1. Нижнее меню (Вкладки)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="home" size={26} color={focused ? '#27AE60' : '#94A3B8'} />
          ),
        }}
      />
      <Tab.Screen 
        name="Categories" 
        component={CategoriesScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="grid" size={26} color={focused ? '#27AE60' : '#94A3B8'} />
          ),
        }}
      />
      <Tab.Screen 
        name="Scan" 
        component={ScanScreen} 
        options={{
          tabBarIcon: () => <Feather name="maximize" size={28} color="#FFF" />,
          tabBarButton: (props) => <ScanButton {...props} />
        }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="heart" size={26} color={focused ? '#27AE60' : '#94A3B8'} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="user" size={26} color={focused ? '#27AE60' : '#94A3B8'} />
          ),
        }} 
      />
    </Tab.Navigator>
  );
}

// 2. Стек для авторизованного пользователя
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {/* Төменгі мәзірі бар негізгі бет */}
      <Stack.Screen name="Main" component={MainTabs} />
      
      {/* Төменгі мәзірсіз ашылатын сенің беттерің */}
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="StoreScreen" component={StoreScreen} />
      <Stack.Screen name="ProductScreen" component={ProductScreen} />
    </Stack.Navigator>
  );
}

// 3. Главный входной навигатор
export default function RootNavigation() {
  const token = useAuthStore((s) => s.accessToken);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#27AE60" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <AppStack /> : (
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    height: 80, 
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9',
    paddingBottom: 10, 
    elevation: 20,
  },
  scanButtonContainer: { 
    top: -30, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scanButtonInner: {
    width: 65, 
    height: 65, 
    borderRadius: 32.5, 
    backgroundColor: '#58B9B9',
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 8,
    borderWidth: 4, 
    borderColor: '#FFFFFF'
  }
});