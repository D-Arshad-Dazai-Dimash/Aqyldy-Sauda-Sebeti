import axios from 'axios';
import { config } from '../config/env';

// AI service URL (конфигурируется в зависимости от платформы)
const aiClient = axios.create({
  baseURL: config.AI_URL,
  timeout: 30000, // AI responses may take longer
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
}

export interface PriceTrendResponse {
  product_id: string;
  product_title: string;
  current_price: number;
  history: PricePoint[];
  predictions: PricePoint[];
  trend: 'rising' | 'falling' | 'stable';
  trend_percentage: number;
}

// ── Chatbot Types ──
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  suggested_products: ProductRecommendation[];
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
): Promise<ChatResponse> {
  const res = await aiClient.post<ChatResponse>('/api/ai/chat', {
    message,
    conversation_history: conversationHistory,
    user_id: userId,
  });
  return res.data;
}
