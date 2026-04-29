import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { config } from '../config/env';

// AI service URL (конфигурируется в зависимости от платформы)
const aiClient = axios.create({
  baseURL: config.AI_URL,
  timeout: 60000, // Gemini may stream slowly on first token; allow up to 60s
});

// Attach the same JWT token that is used for the Spring Boot API so that
// the AI service can verify the caller's identity.
aiClient.interceptors.request.use(async (reqConfig) => {
  const token = await AsyncStorage.getItem('auth:accessToken');
  if (token) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }
  return reqConfig;
});

// ── Recommendation Types ──
export interface ProductRecommendation {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  discount: number | null;
  score: number;
}

export interface RecommendationResponse {
  product_id: string;
  recommendations: ProductRecommendation[];
  strategy: string;
}

// ── Price Trend Types ──
export interface PricePoint {
  date: string;
  price: number;
  lower?: number | null;
  upper?: number | null;
}

export interface PriceTrendResponse {
  product_id: string;
  product_title: string;
  current_price: number;
  history: PricePoint[];
  predictions: PricePoint[];
  trend: 'rising' | 'falling' | 'stable';
  trend_percentage: number;
  confidence?: 'low' | 'medium' | 'high';
  model_type?: 'flat' | 'linear';
  volatility?: number;
  is_promo_recent?: boolean;
  horizon_days?: number;
}

// ── Chatbot Types ──
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IngredientChecklistItem {
  key: string;
  name: string;
  product_id?: string | null;
  product_title?: string | null;
  estimated_price?: number | null;
  available: boolean;
  checked: boolean;
}

export interface StoreSuggestion {
  store_id: string;
  store_name: string;
  store_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coverage_count: number;
  coverage_ratio: number;
  distance_meters?: number | null;
  estimated_total?: number | null;
  matched_products: ProductRecommendation[];
}

export interface ChatResponse {
  reply: string;
  suggested_products: ProductRecommendation[];
  ingredient_checklist: IngredientChecklistItem[];
  store_suggestions: StoreSuggestion[];
}

export interface ChatLocation {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

// ── API Calls ──
export async function getProductRecommendations(
  productId: string,
  limit = 8,
): Promise<RecommendationResponse> {
  const res = await aiClient.get<RecommendationResponse>(
    `/api/ai/recommendations/product/${productId}`,
    {params: {limit}},
  );
  return res.data;
}

export async function getUserRecommendations(
  userId: string,
  limit = 10,
): Promise<RecommendationResponse> {
  const res = await aiClient.get<RecommendationResponse>(
    `/api/ai/recommendations/user/${userId}`,
    {params: {limit}},
  );
  return res.data;
}

export async function getPriceTrend(
  productId: string,
  daysAhead = 14,
): Promise<PriceTrendResponse> {
  const res = await aiClient.get<PriceTrendResponse>(
    `/api/ai/price-trends/${productId}`,
    {params: {days_ahead: daysAhead}},
  );
  return res.data;
}

export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[] = [],
  userId?: string,
  location?: ChatLocation,
): Promise<ChatResponse> {
  const res = await aiClient.post<ChatResponse>('/api/ai/chat', {
    message,
    conversation_history: conversationHistory,
    user_id: userId,
    user_latitude: location?.latitude,
    user_longitude: location?.longitude,
    radius_meters: location?.radiusMeters ?? 5000,
  });
  return res.data;
}
