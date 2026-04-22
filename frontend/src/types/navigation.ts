export type MainTabParamList = {
  HomeTab: undefined;
  Categories: undefined;
  Scan: { mode: 'buyer' } | undefined;
  Cart: undefined;
  Profile: undefined;
};

export type BusinessTabParamList = {
  BusinessHome: undefined;
  BusinessInventory: { initialTab?: string } | undefined;
  BusinessScan: { mode: 'business' } | undefined;
  BusinessSearch: undefined;
  BusinessOrders: undefined;
  BusinessProfile: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  BusinessMain: { screen?: keyof BusinessTabParamList } | undefined;
  Favorites: undefined;
  AddProduct: { barcode?: string } | undefined;
  BusinessInventory: { initialTab?: string } | undefined;
  Search: undefined;
  StoreScreen: { storeId?: string } | undefined;
  SubCategory: { categoryId?: string; categoryName?: string } | undefined;
  ProductList: { categoryId?: string; query?: string } | undefined;
  ProductScreen: { productId: string };
  ScanScreen: { mode?: 'buyer' | 'business' } | undefined;
  Orders: undefined;
  OrderDetail: { orderId: string };
  BusinessOrderDetail: { orderId: string };
  PaymentScreen: { orderId?: string; amount?: number } | undefined;
  Chatbot: undefined;
  Analytics: undefined;
  ChangePin: undefined;
  Map: undefined;
  PersonalData: undefined;
  Promotions: undefined;
  SmartShopping: undefined;
  NotificationsTab: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  BusinessRegister: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
};