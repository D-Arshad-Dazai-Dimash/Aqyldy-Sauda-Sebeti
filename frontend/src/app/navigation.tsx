import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAuthStore } from '../store/authStore';

// Экрандарды импорттау
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ScanScreen from '../screens/ScanScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SearchScreen from '../screens/SearchScreen';
import StoreScreen from '../screens/StoreScreen';
import ProductScreen from '../screens/ProductScreen';
<<<<<<< HEAD
import SubCategoryScreen from '../screens/SubCategoryScreen';
import ProductListScreen from '../screens/ProductListScreen';
import BusinessDashboard from '../screens/BusinessDashboard'; 
import BusinessInventoryScreen from '../screens/BusinessInventoryScreen';
import CartScreen from '../screens/CartScreen.tsx';
import AddProductScreen from '../screens/AddProductScreen'; // ЖАҢА: Тауар қосу беті
=======
import SubCategoryScreen from '../screens/SubCategoryScreen'; 
import BusinessDashboard from '../screens/BusinessDashboard'; 
import BusinessInventoryScreen from '../screens/BusinessInventoryScreen';
import CartScreen from '../screens/CartScreen.tsx'; 
>>>>>>> 0d522b1bd6e38864b67ee0518f37010a1c892700

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Сканер батырмасының дизайны (ортадағы дөңгелек)
const ScanButton = ({ children, onPress }: any) => (
  <TouchableOpacity style={styles.scanButtonContainer} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.scanButtonInner}>{children}</View>
  </TouchableOpacity>
);

// --- БИЗНЕС МӘЗІРІ ---
function BusinessTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.businessTabBar,
      }}
    >
      <Tab.Screen 
        name="BusinessHome" 
        component={BusinessDashboard} 
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="home" size={28} color={focused ? '#4AB7B6' : '#CBD5E1'} />
          ),
        }}
      />
      <Tab.Screen 
        name="BusinessInventory" 
        component={BusinessInventoryScreen}
        initialParams={{ initialTab: 'inStock' }}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="grid" size={28} color={focused ? '#4AB7B6' : '#CBD5E1'} />
          ),
        }}
      />
      {/* Бизнес үшін де ортада сканер тұрғаны ыңғайлы */}
      <Tab.Screen 
        name="BusinessScan" 
        component={ScanScreen} 
        initialParams={{ mode: 'business' }}
        options={{
          tabBarIcon: () => <Feather name="maximize" size={28} color="#FFF" />,
          tabBarButton: (props) => <ScanButton {...props} />
        }} 
      />
      <Tab.Screen 
        name="BusinessSearch" 
        component={SearchScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="search" size={28} color={focused ? '#4AB7B6' : '#CBD5E1'} />
          ),
        }} 
      />
      <Tab.Screen 
        name="BusinessOrders" 
        component={FavoritesScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="file-text" size={28} color={focused ? '#4AB7B6' : '#CBD5E1'} />
          ),
        }} 
      />
    </Tab.Navigator>
  );
}

<<<<<<< HEAD
=======

>>>>>>> 0d522b1bd6e38864b67ee0518f37010a1c892700
// --- КЛИЕНТТІК МӘЗІР ---
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{
        tabBarIcon: ({ focused }) => <Feather name="home" size={26} color={focused ? '#27AE60' : '#94A3B8'} />
      }} />
      <Tab.Screen name="Categories" component={CategoriesScreen} options={{
        tabBarIcon: ({ focused }) => <Feather name="grid" size={26} color={focused ? '#27AE60' : '#94A3B8'} />
      }} />
      <Tab.Screen name="Scan" component={ScanScreen} initialParams={{ mode: 'buyer' }} options={{
        tabBarIcon: () => <Feather name="maximize" size={28} color="#FFF" />,
        tabBarButton: (props) => <ScanButton {...props} />
      }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{
        tabBarIcon: ({ focused }) => (
          <Feather name="shopping-cart" size={26} color={focused ? '#27AE60' : '#94A3B8'} />
        )
      }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{
        tabBarIcon: ({ focused }) => <Feather name="user" size={26} color={focused ? '#27AE60' : '#94A3B8'} />
      }} />
    </Tab.Navigator>
  );
}

// --- НЕГІЗГІ СТЕК ---
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="BusinessMain" component={BusinessTabs} />
      
<<<<<<< HEAD
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
=======
      <Stack.Screen name="Favorites" component={FavoritesScreen} /> 
>>>>>>> 0d522b1bd6e38864b67ee0518f37010a1c892700

      <Stack.Screen name="BusinessInventory" component={BusinessInventoryScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="StoreScreen" component={StoreScreen} />
<<<<<<< HEAD
      <Stack.Screen name="SubCategory" component={SubCategoryScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
=======
      <Stack.Screen name="SubCategory" component={SubCategoryScreen} /> 
>>>>>>> 0d522b1bd6e38864b67ee0518f37010a1c892700
      <Stack.Screen name="ProductScreen" component={ProductScreen} />
      {/* Кез келген жерден Scan бетін шақыру үшін Stack-ке де қосамыз */}
      <Stack.Screen name="ScanScreen" component={ScanScreen} /> 
    </Stack.Navigator>
  );
}

export default function RootNavigation() {
  const token = useAuthStore((s) => s.accessToken);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

  if (isBootstrapping) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#27AE60" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <AppStack /> : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 80, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingBottom: 10, elevation: 20,
  },
  businessTabBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 85,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    elevation: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 },
    borderTopWidth: 0,
  },
  scanButtonContainer: { top: -30, justifyContent: 'center', alignItems: 'center' },
  scanButtonInner: {
    width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#4AB7B6',
    justifyContent: 'center', alignItems: 'center', elevation: 8,
    borderWidth: 4, borderColor: '#FFFFFF'
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }
});