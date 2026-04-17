import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useIsFocused } from '@react-navigation/native';
import { getSpendingAnalytics } from '../api/analytics';
import type { SpendingAnalytics, MonthlySpending, CategorySpending } from '../types/api';

const COLORS = ['#4AB7B6', '#FDAA5D', '#EF4444', '#22C55E', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4'];

export default function AnalyticsScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const [data, setData] = useState<SpendingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getSpendingAnalytics();
      setData(result);
    } catch {
      setError('Деректерді жүктеу мүмкін болмады');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) load();
  }, [isFocused, load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4AB7B6" />
          <Text style={styles.loadingText}>Аналитика жүктелуде...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={30} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Аналитика</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.center}>
          <Feather name="bar-chart-2" size={60} color="#CBD5E1" />
          <Text style={styles.emptyText}>{error || 'Деректер жоқ'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Қайталау</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (data.orderCount === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={30} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Аналитика</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="bar-chart-2" size={60} color="#CBD5E1" />
          <Text style={styles.emptyText}>Аналитика жоқ</Text>
          <Text style={styles.emptySubtext}>
            Сатып алу жасағаннан кейін мұнда статистика пайда болады
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxMonthly = Math.max(...data.monthlyTrend.map(m => m.amount), 1);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={30} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Смарт Аналитика</Text>
        <View style={styles.aiBadge}>
          <Feather name="cpu" size={14} color="#4AB7B6" />
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ───── Summary Cards ───── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#DCFCE7' }]}>
            <Feather name="dollar-sign" size={20} color="#166534" />
            <Text style={styles.summaryValue}>{formatAmount(data.totalSpent)}</Text>
            <Text style={styles.summaryLabel}>Жалпы шығын</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#E0F2FE' }]}>
            <Feather name="shopping-bag" size={20} color="#075985" />
            <Text style={styles.summaryValue}>{data.orderCount}</Text>
            <Text style={styles.summaryLabel}>Тапсырыс</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF9C3' }]}>
            <Feather name="trending-up" size={20} color="#854D0E" />
            <Text style={styles.summaryValue}>{formatAmount(data.averageOrderAmount)}</Text>
            <Text style={styles.summaryLabel}>Орташа</Text>
          </View>
        </View>

        {/* ───── ML Prediction Card ───── */}
        {data.predictedNextMonthSpending > 0 && (
          <View style={styles.predictionCard}>
            <View style={styles.predictionHeader}>
              <View style={styles.mlBadge}>
                <Feather name="cpu" size={12} color="#FFF" />
                <Text style={styles.mlBadgeText}>ML болжам</Text>
              </View>
            </View>
            <Text style={styles.predictionTitle}>Келесі айдағы шығын болжамы</Text>
            <Text style={styles.predictionValue}>
              ~{formatAmount(data.predictedNextMonthSpending)} ₸
            </Text>
            <Text style={styles.predictionNote}>
              Сызықтық регрессия негізінде есептелді
            </Text>
          </View>
        )}

        {/* ───── Monthly Bar Chart ───── */}
        {data.monthlyTrend.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Айлық шығын динамикасы</Text>
            <View style={styles.chartContainer}>
              {data.monthlyTrend.slice(-6).map((item, idx) => (
                <View key={item.month} style={styles.barGroup}>
                  <Text style={styles.barValue}>{formatShort(item.amount)}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max((item.amount / maxMonthly) * 100, 5)}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{formatMonthLabel(item.month)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ───── Category Breakdown ───── */}
        {data.categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Санат бойынша шығын</Text>
            {data.categoryBreakdown.map((cat, idx) => (
              <View key={cat.categoryId} style={styles.catRow}>
                <View style={styles.catInfo}>
                  <View style={[styles.catDot, { backgroundColor: COLORS[idx % COLORS.length] }]} />
                  <Text style={styles.catName}>{cat.categoryName}</Text>
                </View>
                <View style={styles.catBarContainer}>
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        width: `${Math.max(cat.percentage, 2)}%`,
                        backgroundColor: COLORS[idx % COLORS.length],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.catAmount}>{cat.percentage}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* ───── Frequent Products ───── */}
        {data.frequentProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Жиі сатып алатын тауарлар</Text>
            {data.frequentProducts.map((fp) => (
              <View key={fp.productId} style={styles.freqCard}>
                <Image
                  source={fp.imageUrl ? { uri: fp.imageUrl } : require('../assets/p1.png')}
                  style={styles.freqImage}
                  resizeMode="contain"
                />
                <View style={styles.freqInfo}>
                  <Text style={styles.freqTitle} numberOfLines={1}>{fp.title}</Text>
                  <Text style={styles.freqMeta}>
                    {fp.purchaseCount} рет сатып алынды · Орташа {formatAmount(fp.avgPrice)} ₸
                  </Text>
                </View>
                <View style={styles.freqBadge}>
                  <Text style={styles.freqCount}>×{fp.purchaseCount}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {data.orderCount === 0 && (
          <View style={styles.emptySection}>
            <Feather name="bar-chart-2" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              Тапсырыс тарихы жоқ. Тапсырыс жасаған соң аналитика пайда болады.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function formatAmount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return Math.round(n).toLocaleString('ru');
  return n.toFixed(0);
}

function formatShort(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toFixed(0);
}

function formatMonthLabel(month: string): string {
  const parts = month.split('-');
  const monthNames = ['Қаң', 'Ақп', 'Нау', 'Сәу', 'Мам', 'Мау', 'Шіл', 'Там', 'Қыр', 'Қаз', 'Қар', 'Жел'];
  const idx = parseInt(parts[1], 10) - 1;
  return monthNames[idx] || parts[1];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 0,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  aiBadgeText: { fontSize: 12, fontWeight: '700', color: '#4AB7B6' },
  scroll: { paddingBottom: 100 },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  summaryLabel: { fontSize: 11, color: '#64748B', fontWeight: '500' },

  // Prediction
  predictionCard: {
    marginHorizontal: 15,
    marginTop: 16,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
  },
  predictionHeader: { flexDirection: 'row', marginBottom: 10 },
  mlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4AB7B6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  mlBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  predictionTitle: { fontSize: 14, color: '#94A3B8' },
  predictionValue: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginTop: 4 },
  predictionNote: { fontSize: 11, color: '#64748B', marginTop: 8 },

  // Section
  section: {
    marginHorizontal: 15,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 16 },

  // Bar Chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
  },
  barGroup: { alignItems: 'center', flex: 1, gap: 4 },
  barValue: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  barTrack: {
    width: 28,
    height: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 8, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '500' },

  // Category Breakdown
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  catInfo: { flexDirection: 'row', alignItems: 'center', width: 100, gap: 6 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { fontSize: 12, color: '#1E293B', fontWeight: '500', flex: 1 },
  catBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: 5 },
  catAmount: { fontSize: 12, fontWeight: '600', color: '#64748B', width: 40, textAlign: 'right' },

  // Frequent Products
  freqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  freqImage: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#F8FAFC' },
  freqInfo: { flex: 1 },
  freqTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  freqMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  freqBadge: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freqCount: { fontSize: 13, fontWeight: '700', color: '#4AB7B6' },

  // Empty
  emptySection: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptySubtext: { color: '#CBD5E1', fontSize: 12, textAlign: 'center', marginTop: 8 },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#4AB7B6',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryText: { color: '#FFF', fontWeight: '600' },
});
