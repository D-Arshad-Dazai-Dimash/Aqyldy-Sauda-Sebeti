import React, { useMemo, useState } from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';

/**
 * Category-aware fallback image for products.
 *
 * Replaces the dozen of `imageUrl ? {uri} : require('../assets/p1.png')`
 * snippets scattered around the screens — `p1.png` is a sausage and was
 * being shown for milk, water, soap, etc., which looked awful.
 *
 * Picks a thematic asset based on (in priority order):
 *   1. an explicit category slug ('dairy', 'drinks', ...)
 *   2. a category name in Kazakh / Russian ('Сүт өнімдері', 'Напитки', ...)
 *   3. a subcategory hint or product title (loose substring match)
 *   4. generic groceries fallback (`azyk.png`)
 *
 * The component is intentionally dumb and synchronous so it works on every
 * screen (lists, cart, chat bubbles, analytics) without any state.
 */
export type ProductImageProps = {
  uri?: string | null;
  category?: string | null;
  categorySlug?: string | null;
  subcategory?: string | null;
  title?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  testID?: string;
};

// All assets are lazily required inside `pickFallback` so unit tests that
// don't want React Native's image loader don't blow up.
type FallbackKey =
  | 'groceries'
  | 'dairy'
  | 'drinks'
  | 'sweets'
  | 'bakery'
  | 'household'
  | 'hygiene'
  | 'pets';

const KEYWORDS: Record<FallbackKey, string[]> = {
  groceries: [
    'azyk', 'tulik', 'азық', 'продукт', 'food', 'meat', 'fish', 'fruit',
    'vegetable', 'oil', 'egg', 'ет', 'балық', 'жұмыртқа', 'май', 'көкөніс', 'жеміс',
  ],
  dairy: ['dairy', 'sut', 'milk', 'cheese', 'yogurt', 'сүт', 'молоч', 'сыр'],
  drinks: ['drink', 'beverage', 'water', 'juice', 'soda', 'tea', 'coffee',
    'сусын', 'сок', 'чай', 'кофе', 'напит', 'вод', 'ауыз су'],
  sweets: ['sweet', 'candy', 'chocolate', 'cookie', 'cake', 'snack',
    'тәтті', 'сладост', 'шоколад', 'печенье', 'торт', 'снек'],
  bakery: ['bakery', 'bread', 'nan', 'нан', 'хлеб', 'булка', 'батон'],
  household: ['household', 'cleaning', 'detergent', 'тұрмыст', 'химия', 'уборк',
    'бытов'],
  hygiene: ['hygiene', 'personal', 'care', 'soap', 'shampoo', 'гигиен', 'мыло',
    'шампунь', 'уход'],
  pets: ['pet', 'dog', 'cat', 'жануар', 'питом', 'корм'],
};

export function pickFallbackKey(opts: {
  category?: string | null;
  categorySlug?: string | null;
  subcategory?: string | null;
  title?: string | null;
}): FallbackKey {
  const haystack = [
    opts.categorySlug,
    opts.category,
    opts.subcategory,
    opts.title,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase())
    .join(' | ');

  if (!haystack) return 'groceries';

  // First match wins — order matters. Most specific buckets first so a
  // product titled "молочный шоколад" is classified as sweets rather than
  // dairy.
  const order: FallbackKey[] = [
    'sweets', 'bakery', 'dairy', 'drinks', 'household', 'hygiene', 'pets', 'groceries',
  ];
  for (const key of order) {
    if (KEYWORDS[key].some((kw) => haystack.includes(kw))) {
      return key;
    }
  }
  return 'groceries';
}

function fallbackSource(key: FallbackKey) {
  switch (key) {
    case 'dairy':
      return require('../assets/sut.png');
    case 'drinks':
      return require('../assets/susyn.png');
    case 'sweets':
      return require('../assets/tatt.png');
    case 'bakery':
      return require('../assets/nan.png');
    case 'household':
      return require('../assets/turmistik-himia.png');
    case 'hygiene':
      return require('../assets/gigena.png');
    case 'pets':
      return require('../assets/ui-zhanuarlarina.png');
    case 'groceries':
    default:
      return require('../assets/azyk.png');
  }
}

/**
 * Drop-in replacement for the `imageUrl ? {uri} : require('../assets/p1.png')`
 * pattern. Keeps existing `<Image>` JSX intact — only changes the source
 * resolution to be category-aware. Use this from screens that already have
 * a tightly-styled <Image> and don't want to switch to <ProductImage>.
 */
export function productImageSource(opts: {
  uri?: string | null;
  category?: string | null;
  categorySlug?: string | null;
  subcategory?: string | null;
  title?: string | null;
}) {
  if (opts.uri && String(opts.uri).trim().length > 0) {
    return { uri: String(opts.uri) };
  }
  return fallbackSource(pickFallbackKey(opts));
}

export default function ProductImage(props: ProductImageProps) {
  const { uri, style, containerStyle, resizeMode = 'cover', testID } = props;
  const [errored, setErrored] = useState(false);

  const fallback = useMemo(
    () =>
      fallbackSource(
        pickFallbackKey({
          category: props.category,
          categorySlug: props.categorySlug,
          subcategory: props.subcategory,
          title: props.title,
        }),
      ),
    [props.category, props.categorySlug, props.subcategory, props.title],
  );

  const showRemote = !!uri && !errored;
  const source = showRemote ? { uri: uri as string } : fallback;

  const img = (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={() => setErrored(true)}
      testID={testID}
    />
  );

  if (containerStyle) {
    return <View style={containerStyle}>{img}</View>;
  }
  return img;
}
