import React, {useEffect, useState} from 'react';
import { productImageSource } from './ProductImage';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  getProductRecommendations,
  type ProductRecommendation,
} from '../api/ai';

interface Props {
  productId: string;
  onProductPress: (id: string) => void;
}

export default function RecommendationsSection({productId, onProductPress}: Props) {
  const [recs, setRecs] = useState<ProductRecommendation[]>([]);
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProductRecommendations(productId, 8)
      .then(data => {
        if (!cancelled) {
          setRecs(data.recommendations);
          setStrategy(data.strategy);
        }
      })
      .catch(() => {
        if (!cancelled) setRecs([]);
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
        <Text style={styles.title}>🤖 Ұсыныстар</Text>
        <ActivityIndicator size="small" color="#4AB7B6" style={{marginTop: 12}} />
      </View>
    );
  }

  if (recs.length === 0) return null;

  const strategyLabel =
    strategy === 'collaborative'
      ? 'Бірге сатып алынады'
      : strategy === 'category'
      ? 'Ұқсас тауарлар'
      : 'Танымал тауарлар';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🤖 {strategyLabel}</Text>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>
      <FlatList
        data={recs}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => {
          const effectivePrice = item.discount
            ? item.price * (1 - item.discount / 100)
            : item.price;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onProductPress(item.id)}
              activeOpacity={0.7}>
              <Image
                source={productImageSource({ uri: item.image_url, title: item.title })}
                style={styles.image}
                resizeMode="contain"
              />
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{effectivePrice.toFixed(0)} ₸</Text>
                {item.discount ? (
                  <Text style={styles.oldPrice}>{item.price} ₸</Text>
                ) : null}
              </View>
              {/* Relevance indicator */}
              <View style={styles.scoreBar}>
                <View
                  style={[styles.scoreFill, {width: `${item.score * 100}%`}]}
                />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
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
  list: {
    paddingHorizontal: 15,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 10,
    width: 140,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4AB7B6',
  },
  oldPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  scoreBar: {
    height: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#4AB7B6',
    borderRadius: 2,
  },
});
