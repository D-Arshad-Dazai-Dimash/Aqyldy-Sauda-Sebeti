import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {getPriceTrend, type PriceTrendResponse, type PricePoint} from '../api/ai';

interface Props {
  productId: string;
}

function MiniChart({
  points,
  predictions,
  width,
  height,
}: {
  points: PricePoint[];
  predictions: PricePoint[];
  width: number;
  height: number;
}) {
  const allPrices = [...points, ...predictions].map(p => p.price);
  if (allPrices.length < 2) return null;

  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;
  const padding = 4;

  const toY = (price: number) =>
    padding + ((maxP - price) / range) * (height - padding * 2);
  const totalPoints = points.length + predictions.length;
  const stepX = (width - padding * 2) / Math.max(totalPoints - 1, 1);

  // Build path segments as bar chart style
  const historyBars = points.map((p, i) => ({
    x: padding + i * stepX,
    y: toY(p.price),
    h: height - padding - toY(p.price),
    isPrediction: false,
  }));

  const predBars = predictions.map((p, i) => ({
    x: padding + (points.length + i) * stepX,
    y: toY(p.price),
    h: height - padding - toY(p.price),
    isPrediction: true,
  }));

  const barWidth = Math.max(2, stepX * 0.6);

  return (
    <View style={{width, height, flexDirection: 'row', alignItems: 'flex-end'}}>
      {[...historyBars, ...predBars].map((bar, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: bar.x - barWidth / 2,
            bottom: padding,
            width: barWidth,
            height: Math.max(1, bar.h),
            backgroundColor: bar.isPrediction ? '#94A3B8' : '#4AB7B6',
            borderRadius: 1,
            opacity: bar.isPrediction ? 0.5 : 0.8,
          }}
        />
      ))}
      {/* Divider line between history and prediction */}
      {predictions.length > 0 && points.length > 0 && (
        <View
          style={{
            position: 'absolute',
            left: padding + (points.length - 0.5) * stepX,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: '#CBD5E1',
          }}
        />
      )}
    </View>
  );
}

export default function PriceTrendSection({productId}: Props) {
  const [data, setData] = useState<PriceTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPriceTrend(productId)
      .then(res => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📈 Баға трендтері</Text>
        <ActivityIndicator size="small" color="#4AB7B6" style={{marginTop: 12}} />
      </View>
    );
  }

  if (!data) return null;

  const trendIcon =
    data.trend === 'rising'
      ? 'trending-up'
      : data.trend === 'falling'
      ? 'trending-down'
      : 'minus';
  const trendColor =
    data.trend === 'rising'
      ? '#EF4444'
      : data.trend === 'falling'
      ? '#22C55E'
      : '#94A3B8';
  const trendLabel =
    data.trend === 'rising'
      ? 'Өсуде'
      : data.trend === 'falling'
      ? 'Төмендеуде'
      : 'Тұрақты';

  // Take last 30 days of history for display
  const recentHistory = data.history.slice(-30);
  const predictions = data.predictions.slice(0, 14);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>📈 Баға трендтері</Text>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>

      {/* Trend indicator */}
      <View style={styles.trendRow}>
        <View style={[styles.trendBadge, {backgroundColor: trendColor + '20'}]}>
          <Feather name={trendIcon} size={16} color={trendColor} />
          <Text style={[styles.trendText, {color: trendColor}]}>
            {trendLabel}{' '}
            {data.trend_percentage !== 0
              ? `(${data.trend_percentage > 0 ? '+' : ''}${data.trend_percentage}%)`
              : ''}
          </Text>
        </View>
        <Text style={styles.currentPrice}>{data.current_price} ₸</Text>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <MiniChart
          points={recentHistory}
          predictions={predictions}
          width={300}
          height={80}
        />
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#4AB7B6'}]} />
            <Text style={styles.legendText}>Тарих</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#94A3B8', opacity: 0.5}]} />
            <Text style={styles.legendText}>Болжам</Text>
          </View>
        </View>
      </View>

      {/* Prediction summary */}
      {predictions.length > 0 && (
        <Text style={styles.predictionText}>
          14 күндік болжам: ~{predictions[predictions.length - 1].price.toFixed(0)} ₸
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 15,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  aiBadge: {
    backgroundColor: '#4AB7B6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  aiBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4AB7B6',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  predictionText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});
