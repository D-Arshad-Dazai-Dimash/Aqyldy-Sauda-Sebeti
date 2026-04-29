import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { productImageSource } from '../components/ProductImage';
import { useIsFocused } from '@react-navigation/native';
import { getSpendingAnalytics } from '../api/analytics';
import type { SpendingAnalytics } from '../types/api';
import { useHeaderLayout } from '../utils/useHeaderLayout';

const COLORS = ['#2BAE9A', '#F59E0B', '#8B5CF6', '#E63946', '#3B82F6', '#EC4899', '#10B981', '#06B6D4'];

const P = {
  bg: '#F0F8F7',
  dark: '#081C1B',
  card: '#FFFFFF',
  text: '#0A1E1D',
  muted: '#527673',
  teal: '#1A9A88',
  tealDark: '#0D6B5C',
  tealSoft: '#D4F0EB',
  border: '#CAE5E1',
  gold: '#D97706',
  goldSoft: '#FEF3C7',
};

export default function AnalyticsScreen({ navigation }: any) {
  const { topPadding, contentTopOffset } = useHeaderLayout();
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

  const Header = () => (
    <View style={[styles.header, { paddingTop: topPadding }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Feather name="chevron-left" size={22} color={P.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <View style={styles.aiBadge}>
          <Feather name="cpu" size={12} color={P.teal} />
          <Text style={styles.aiBadgeText}>AI ANALYTICS</Text>
        </View>
        <Text style={styles.headerTitle}>Смарт Аналитика</Text>
      </View>
      <TouchableOpacity onPress={load} style={styles.refreshBtn}>
        <Feather name="refresh-cw" size={17} color={P.text} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={P.bg} />
        <Header />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={P.teal} />
          <Text style={styles.loadingText}>Аналитика жүктелуде...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={P.bg} />
        <Header />
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Feather name="bar-chart-2" size={36} color={P.teal} />
          </View>
          <Text style={styles.emptyTitle}>Деректер жоқ</Text>
          <Text style={styles.emptyText}>{error || 'Мәлімет табылмады'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Feather name="refresh-cw" size={15} color="#FFF" />
            <Text style={styles.retryText}>Қайталау</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (data.orderCount === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={P.bg} />
        <Header />
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Feather name="bar-chart-2" size={36} color={P.teal} />
          </View>
          <Text style={styles.emptyTitle}>Аналитика жоқ</Text>
          <Text style={styles.emptyText}>
            Сатып алу жасағаннан кейін мұнда статистика пайда болады
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxMonthly = Math.max(...data.monthlyTrend.map(m => m.amount), 1);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingTop: contentTopOffset }]}>

        {/* ── Summary Cards ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(320)} style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: P.tealSoft, borderColor: P.border }]}>
            <View style={[styles.summaryIconWrap, { backgroundColor: P.teal }]}>
              <Feather name="dollar-sign" size={16} color="#FFF" />
            </View>
            <Text style={styles.summaryValue}>{formatShort(data.totalSpent)}</Text>
            <Text style={styles.summaryLabel}>Жалпы шығын</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#3B82F6' }]}>
              <Feather name="shopping-bag" size={16} color="#FFF" />
            </View>
            <Text style={styles.summaryValue}>{data.orderCount}</Text>
            <Text style={styles.summaryLabel}>Тапсырыс</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: P.goldSoft, borderColor: '#FDE68A' }]}>
            <View style={[styles.summaryIconWrap, { backgroundColor: P.gold }]}>
              <Feather name="trending-up" size={16} color="#FFF" />
            </View>
            <Text style={styles.summaryValue}>{formatShort(data.averageOrderAmount)}</Text>
            <Text style={styles.summaryLabel}>Орташа</Text>
          </View>
        </Animated.View>

        {/* ── ML Prediction ── */}
        {data.predictedNextMonthSpending > 0 && (
          <Animated.View entering={FadeInDown.delay(120).duration(320)} style={styles.predictionCard}>
            <View style={styles.predictionTop}>
              <View style={styles.mlBadge}>
                <Feather name="cpu" size={12} color={P.teal} />
                <Text style={styles.mlBadgeText}>ML болжам</Text>
              </View>
              <View style={styles.mlAccentLine} />
            </View>
            <Text style={styles.predictionTitle}>Келесі айдағы шығын болжамы</Text>
            <Text style={styles.predictionValue}>
              ~{formatAmount(data.predictedNextMonthSpending)} ₸
            </Text>
            <Text style={styles.predictionNote}>
              Сызықтық регрессия негізінде есептелді
            </Text>
          </Animated.View>
        )}

        {/* ── Monthly Bar Chart ── */}
        {data.monthlyTrend.length > 0 && (
          <Animated.View entering={FadeInDown.delay(180).duration(320)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: P.teal }]} />
              <Text style={styles.sectionTitle}>Айлық шығын динамикасы</Text>
            </View>
            <View style={styles.chartContainer}>
              {data.monthlyTrend.slice(-6).map((item, idx) => (
                <View key={item.month} style={styles.barGroup}>
                  <Text style={styles.barValue}>{formatShort(item.amount)}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max((item.amount / maxMonthly) * 100, 6)}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{formatMonthLabel(item.month)}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Category Breakdown ── */}
        {data.categoryBreakdown.length > 0 && (
          <Animated.View entering={FadeInDown.delay(240).duration(320)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.sectionTitle}>Санат бойынша шығын</Text>
            </View>
            {data.categoryBreakdown.map((cat, idx) => (
              <View key={cat.categoryId} style={styles.catRow}>
                <View style={styles.catInfo}>
                  <View style={[styles.catDot, { backgroundColor: COLORS[idx % COLORS.length] }]} />
                  <Text style={styles.catName} numberOfLines={1}>{cat.categoryName}</Text>
                </View>
                <View style={styles.catBarContainer}>
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        width: `${Math.max(cat.percentage, 3)}%`,
                        backgroundColor: COLORS[idx % COLORS.length],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.catAmount}>{cat.percentage}%</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* ── Frequent Products ── */}
        {data.frequentProducts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(320)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: P.gold }]} />
              <Text style={styles.sectionTitle}>Жиі сатып алатын тауарлар</Text>
            </View>
            {data.frequentProducts.map((fp, idx) => (
              <View
                key={fp.productId}
                style={[styles.freqCard, idx === data.frequentProducts.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Image
                  source={productImageSource({ uri: fp.imageUrl, title: fp.title })}
                  style={styles.freqImage}
                  resizeMode="contain"
                />
                <View style={styles.freqInfo}>
                  <Text style={styles.freqTitle} numberOfLines={1}>{fp.title}</Text>
                  <Text style={styles.freqMeta}>
                    {fp.purchaseCount} рет · {formatShort(fp.avgPrice)} ₸
                  </Text>
                </View>
                <View style={styles.freqBadge}>
                  <Text style={styles.freqCount}>×{fp.purchaseCount}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
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
  container: { flex: 1, backgroundColor: P.bg },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(10,30,29,0.08)',
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(43,174,154,0.18)',
    borderWidth: 1, borderColor: 'rgba(43,174,154,0.35)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
    marginBottom: 5,
  },
  aiBadgeText: { color: P.teal, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: P.text, letterSpacing: -0.4 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(10,30,29,0.08)',
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center', alignItems: 'center',
  },

  scroll: { paddingTop: 0, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: P.muted, fontSize: 14 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: P.tealSoft, borderWidth: 2, borderColor: P.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: P.text, marginBottom: 6 },
  emptyText: { fontSize: 13, color: P.muted, textAlign: 'center', lineHeight: 18 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 18, backgroundColor: P.teal,
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14,
  },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    shadowColor: P.tealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  summaryValue: { fontSize: 18, fontWeight: '900', color: P.text, letterSpacing: -0.4 },
  summaryLabel: { fontSize: 11, color: P.muted, fontWeight: '600', textAlign: 'center' },

  predictionCard: {
    marginHorizontal: 14,
    marginTop: 14,
    backgroundColor: P.dark,
    borderRadius: 22,
    padding: 20,
    shadowColor: P.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  predictionTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  mlBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(43,174,154,0.2)',
    borderWidth: 1, borderColor: 'rgba(43,174,154,0.4)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  mlBadgeText: { fontSize: 11, fontWeight: '800', color: P.teal },
  mlAccentLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  predictionTitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  predictionValue: { fontSize: 32, fontWeight: '900', color: '#FFCA28', marginTop: 4, letterSpacing: -1 },
  predictionNote: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 10 },

  section: {
    marginHorizontal: 14,
    marginTop: 14,
    backgroundColor: P.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: P.tealDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: P.text, letterSpacing: -0.3 },

  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 150,
  },
  barGroup: { alignItems: 'center', flex: 1, gap: 4 },
  barValue: { fontSize: 10, color: P.muted, fontWeight: '700' },
  barTrack: {
    width: 30,
    height: 110,
    backgroundColor: '#EFF5F4',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 10, minHeight: 6 },
  barLabel: { fontSize: 10, color: P.muted, fontWeight: '600' },

  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  catInfo: { flexDirection: 'row', alignItems: 'center', width: 90, gap: 6 },
  catDot: { width: 9, height: 9, borderRadius: 5 },
  catName: { fontSize: 12, color: P.text, fontWeight: '600', flex: 1 },
  catBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#EEF5F4',
    borderRadius: 6,
    overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: 6 },
  catAmount: { fontSize: 12, fontWeight: '700', color: P.muted, width: 38, textAlign: 'right' },

  freqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF4F3',
    gap: 12,
  },
  freqImage: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: P.tealSoft,
  },
  freqInfo: { flex: 1 },
  freqTitle: { fontSize: 14, fontWeight: '700', color: P.text },
  freqMeta: { fontSize: 11, color: P.muted, marginTop: 2 },
  freqBadge: {
    backgroundColor: P.tealSoft,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1, borderColor: P.border,
  },
  freqCount: { fontSize: 13, fontWeight: '800', color: P.tealDark },
});

