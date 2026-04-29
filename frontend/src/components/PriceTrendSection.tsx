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
  const allPrices = [
    ...points.map(p => p.price),
    ...predictions.map(p => p.price),
    ...predictions.map(p => p.lower ?? p.price),
    ...predictions.map(p => p.upper ?? p.price),
  ];
  if (allPrices.length < 2) return null;

  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;
  const padding = 4;

  const toY = (price: number) =>
    padding + ((maxP - price) / range) * (height - padding * 2);
  const totalPoints = points.length + predictions.length;
  const stepX = (width - padding * 2) / Math.max(totalPoints - 1, 1);

  const historyBars = points.map((p, i) => ({
    x: padding + i * stepX,
    y: toY(p.price),
    h: height - padding - toY(p.price),
  }));

  const predBars = predictions.map((p, i) => {
    const x = padding + (points.length + i) * stepX;
    const yCenter = toY(p.price);
    const yLow = p.upper != null ? toY(p.upper) : yCenter;
    const yHigh = p.lower != null ? toY(p.lower) : yCenter;
    return {
      x,
      y: yCenter,
      h: height - padding - yCenter,
      bandTop: yLow,
      bandHeight: Math.max(0, yHigh - yLow),
    };
  });

  const barWidth = Math.max(2, stepX * 0.6);

  return (
    <View style={{width, height, flexDirection: 'row', alignItems: 'flex-end'}}>
      {/* Confidence band (drawn first so bars overlay it) */}
      {predBars.map((bar, i) =>
        bar.bandHeight > 0 ? (
          <View
            key={`band-${i}`}
            style={{
              position: 'absolute',
              left: bar.x - barWidth / 2,
              top: bar.bandTop,
              width: barWidth,
              height: bar.bandHeight,
              backgroundColor: '#94A3B8',
              opacity: 0.18,
              borderRadius: 1,
            }}
          />
        ) : null,
      )}
      {historyBars.map((bar, i) => (
        <View
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: bar.x - barWidth / 2,
            bottom: padding,
            width: barWidth,
            height: Math.max(1, bar.h),
            backgroundColor: '#4AB7B6',
            borderRadius: 1,
            opacity: 0.85,
          }}
        />
      ))}
      {predBars.map((bar, i) => (
        <View
          key={`p-${i}`}
          style={{
            position: 'absolute',
            left: bar.x - barWidth / 2,
            bottom: padding,
            width: barWidth,
            height: Math.max(1, bar.h),
            backgroundColor: '#94A3B8',
            borderRadius: 1,
            opacity: 0.55,
          }}
        />
      ))}
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

      {/* Confidence + promo badges */}
      <View style={styles.metaRow}>
        {data.confidence && (
          <View
            style={[
              styles.metaBadge,
              {
                backgroundColor:
                  data.confidence === 'high'
                    ? '#DCFCE7'
                    : data.confidence === 'medium'
                    ? '#FEF3C7'
                    : '#FEE2E2',
              },
            ]}>
            <Feather
              name="shield"
              size={11}
              color={
                data.confidence === 'high'
                  ? '#15803D'
                  : data.confidence === 'medium'
                  ? '#B45309'
                  : '#B91C1C'
              }
            />
            <Text style={styles.metaText}>
              Сенімділік:{' '}
              {data.confidence === 'high'
                ? 'жоғары'
                : data.confidence === 'medium'
                ? 'орташа'
                : 'төмен'}
            </Text>
          </View>
        )}
        {data.is_promo_recent && (
          <View style={[styles.metaBadge, {backgroundColor: '#FEE2E2'}]}>
            <Feather name="zap" size={11} color="#B91C1C" />
            <Text style={[styles.metaText, {color: '#B91C1C'}]}>Промо!</Text>
          </View>
        )}
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
          {data.horizon_days ?? predictions.length} күндік болжам: ~
          {predictions[predictions.length - 1].price.toFixed(0)} ₸
          {predictions[predictions.length - 1].lower != null &&
          predictions[predictions.length - 1].upper != null
            ? `  (${predictions[predictions.length - 1].lower!.toFixed(
                0,
              )}–${predictions[predictions.length - 1].upper!.toFixed(0)} ₸)`
            : ''}
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
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '600',
  },
});
