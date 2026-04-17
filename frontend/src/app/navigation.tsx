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
import SubCategoryScreen from '../screens/SubCategoryScreen';
import ProductListScreen from '../screens/ProductListScreen';
import BusinessDashboard from '../screens/BusinessDashboard';
import BusinessInventoryScreen from '../screens/BusinessInventoryScreen';
import CartScreen from '../screens/CartScreen';
import AddProductScreen from '../screens/AddProductScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import BusinessRegisterScreen from '../screens/BusinessRegisterScreen';
import PaymentScreen from '../screens/PaymentScreen';
import BusinessOrdersScreen from '../screens/BusinessOrdersScreen';
import BusinessOrderDetailScreen from '../screens/BusinessOrderDetailScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import AppPinScreen from '../screens/AppPinScreen';
import ChangePinScreen from '../screens/ChangePinScreen';
import MapScreen from '../screens/MapScreen';
import PersonalDataScreen from '../screens/PersonalDataScreen';
import { authenticateWithBiometric, canUseBiometricUnlock, verifyAppPin } from '../utils/appPin';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const linking = {
  prefixes: ['aqyldysebet://'],
  config: {
    screens: {
      ResetPassword: 'reset-password/:token',
    },
  },
};

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
            <Feather name="home" size={25} color={focused ? '#0EA5E9' : '#CBD5E1'} />
          ),
        }}
      />
      <Tab.Screen 
        name="BusinessInventory" 
        component={BusinessInventoryScreen}
        initialParams={{ initialTab: 'inStock' }}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="grid" size={25} color={focused ? '#0EA5E9' : '#CBD5E1'} />
          ),
        }}
      />
      <Tab.Screen 
        name="BusinessScan" 
        component={ScanScreen} 
        initialParams={{ mode: 'business' }}
        options={{
          tabBarIcon: () => <Feather name="maximize" size={26} color="#FFF" />,
          tabBarButton: (props) => <ScanButton {...props} />
        }} 
      />
      <Tab.Screen 
        name="BusinessSearch" 
        component={SearchScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="search" size={25} color={focused ? '#0EA5E9' : '#CBD5E1'} />
          ),
        }} 
      />
      <Tab.Screen
        name="BusinessOrders"
        component={BusinessOrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="file-text" size={25} color={focused ? '#0EA5E9' : '#CBD5E1'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

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
        tabBarIcon: ({ focused }) => <Feather name="home" size={25} color={focused ? '#0EA5E9' : '#CBD5E1'} />
      }} />
      <Tab.Screen name="Categories" component={CategoriesScreen} options={{
        tabBarIcon: ({ focused }) => <Feather name="grid" size={25} color={focused ? '#0EA5E9' : '#CBD5E1'} />
      }} />
      <Tab.Screen name="Scan" component={ScanScreen} initialParams={{ mode: 'buyer' }} options={{
        tabBarIcon: () => <Feather name="maximize" size={26} color="#FFF" />,
        tabBarButton: (props) => <ScanButton {...props} />
      }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{
        tabBarIcon: ({ focused }) => (
          <Feather name="shopping-cart" size={25} color={focused ? '#0EA5E9' : '#CBD5E1'} />
        )
      }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{
        tabBarIcon: ({ focused }) => <Feather name="user" size={25} color={focused ? '#0EA5E9' : '#CBD5E1'} />
      }} />
    </Tab.Navigator>
  );
}

// --- НЕГІЗГІ СТЕК ---
function AppStack() {
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';
  const initialRoute = isAdmin ? 'BusinessMain' : 'Main';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="BusinessMain" component={BusinessTabs} />

      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />

      <Stack.Screen name="BusinessInventory" component={BusinessInventoryScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="StoreScreen" component={StoreScreen} />
      <Stack.Screen name="SubCategory" component={SubCategoryScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductScreen" component={ProductScreen} />
      <Stack.Screen name="ScanScreen" component={ScanScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="BusinessOrderDetail" component={BusinessOrderDetailScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="ChangePin" component={ChangePinScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="PersonalData" component={PersonalDataScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigation() {
  const token = useAuthStore((s) => s.accessToken);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const isPinVerified = useAuthStore((s) => s.isPinVerified);
  const requiresPinSetup = useAuthStore((s) => s.requiresPinSetup);
  const setPinVerified = useAuthStore((s) => s.setPinVerified);
  const setupPin = useAuthStore((s) => s.setupPin);
  const logout = useAuthStore((s) => s.logout);

  if (isBootstrapping) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#27AE60" />
      </View>
    );
  }

  if (token && !isPinVerified) {
    return (
      <AppPinScreen
        mode={requiresPinSetup ? 'setup' : 'unlock'}
        onSetupSuccess={async (pin) => {
          await setupPin(pin);
        }}
        onUnlockSuccess={async (pin) => {
          const ok = await verifyAppPin(pin);
          if (!ok) throw new Error('PIN дұрыс емес');
          setPinVerified(true);
        }}
        onBiometricUnlock={async () => {
          const available = await canUseBiometricUnlock();
          if (!available) {
            throw new Error('Биометрия бұл құрылғыда қолжетімсіз');
          }

          const ok = await authenticateWithBiometric();
          if (!ok) {
            throw new Error('Биометриямен растау сәтсіз аяқталды');
          }

          setPinVerified(true);
        }}
        onLogout={logout}
      />
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {token ? <AppStack /> : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="BusinessRegister" component={BusinessRegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const TAB_SHARED = {
  position: 'absolute' as const,
  bottom: 0, left: 0, right: 0,
  height: 82,
  backgroundColor: '#FFFFFF',
  borderTopWidth: 0,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  paddingBottom: Platform.OS === 'ios' ? 22 : 8,
  elevation: 0,
  shadowColor: '#0F172A',
  shadowOpacity: 0.13,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: -6 },
};

const styles = StyleSheet.create({
  tabBar: {
    ...TAB_SHARED,
  },
  businessTabBar: {
    ...TAB_SHARED,
    height: 88,
    paddingBottom: Platform.OS === 'ios' ? 26 : 10,
  },
  scanButtonContainer: { top: -28, justifyContent: 'center', alignItems: 'center' },
  scanButtonInner: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: '#0EA5E9',
    justifyContent: 'center', alignItems: 'center', elevation: 10,
    borderWidth: 4, borderColor: '#FFFFFF',
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }
});