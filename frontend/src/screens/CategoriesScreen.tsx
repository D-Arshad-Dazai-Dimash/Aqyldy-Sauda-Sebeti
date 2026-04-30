import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  StatusBar,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { PRODUCT_CATEGORIES, Category } from '../constants/categories';
import { useLanguageStore } from '../store/languageStore';

const { width: SCREEN_W } = Dimensions.get('window');
const H_INSET = 20;
const CARD_W = Math.min(350, SCREEN_W - H_INSET * 2);

const P = {
  bg: '#F7F8FC',
  surface: '#FFFFFF',
  ink: '#1E293B',
  muted: '#64748B',
  faint: '#94A3B8',
  border: '#E2E8F0',
  teal: '#0EA5E9',
};

function PressCard({ children, onPress, style }: any) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      onPress={onPress}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function CategoriesScreen({ navigation }: any) {
  const language = useLanguageStore((s) => s.language);
  const toggleLanguage = useLanguageStore((s) => s.toggleLanguage);

  const t = language === 'kk'
    ? {
        langName: 'Қазақша',
        languageTitle: 'Тіл',
        languageChanged: 'Тіл қазақшаға ауыстырылды',
        notifications: 'Хабарландырулар',
        noNotifications: 'Жаңа хабарландырулар жоқ.',
        searchPlaceholder: 'Қалаған затыңызды іздеңіз',
      }
    : {
        langName: 'Русский',
        languageTitle: 'Язык',
        languageChanged: 'Язык переключен на русский',
        notifications: 'Уведомления',
        noNotifications: 'Новых уведомлений нет.',
        searchPlaceholder: 'Найдите нужный товар',
      };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn.duration(220)} style={styles.bgOrnamentTop} pointerEvents="none" />
      <Animated.View entering={FadeIn.duration(260)} style={styles.bgOrnamentBottom} pointerEvents="none" />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoAccent} />
          <Text style={styles.logoA}>Aqyldy</Text>
          <Text style={styles.logoB}> Sebet</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.langSelector}
            onPress={async () => {
              await toggleLanguage();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.langText}>{t.langName}</Text>
            <Feather name="chevron-down" size={14} color={P.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('NotificationsTab')}
            activeOpacity={0.85}
          >
            <Feather name="bell" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Search */}
      <Animated.View entering={FadeInDown.delay(90).springify()} style={styles.searchBlock}>
        <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => navigation.navigate('Search')}
        activeOpacity={0.9}
      >
        <Feather name="search" size={18} color={P.faint} style={{ marginLeft: 14 }} />
        <Text style={styles.searchPlaceholder}>{t.searchPlaceholder}</Text>
        <View style={styles.searchHintPill}>
          <Feather name="sliders" size={12} color={P.muted} />
        </View>
      </TouchableOpacity>
      </Animated.View>

      {/* Categories list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PRODUCT_CATEGORIES.map((item: Category, index: number) => {
          const isImageRight = index % 2 === 0;

          return (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(130 + index * 45).springify().damping(14)}
              style={styles.categoryCardWrap}
            >
              <PressCard
              style={styles.categoryCard}
              onPress={() => navigation.navigate('SubCategory', { categoryId: item.id })}
            >
              {/* Kept original card concept: same bg-image + text + foreground product image */}
              <Image source={item.bg} style={StyleSheet.absoluteFillObject} resizeMode="stretch" />

              <View style={[styles.cardContent, { alignItems: isImageRight ? 'flex-start' : 'flex-end' }]}>
                <View style={[styles.cardTextWrapper, item.textContainerStyle]}>
                  <Text
                    style={[styles.categoryTitle, item.titleStyle]}
                    allowFontScaling={false}
                  >
                    {item.name}
                  </Text>
                </View>
              </View>

              <View style={[styles.imageMask, item.imageStyle]}>
                <Image source={item.image} style={styles.fullImage} resizeMode="stretch" />
              </View>
              </PressCard>
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.bg,
    paddingTop: 0,
  },
  bgOrnamentTop: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(14,165,233,0.1)',
    top: -75,
    right: -55,
    zIndex: -1,
  },
  bgOrnamentBottom: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(245,158,11,0.08)',
    bottom: 40,
    left: -75,
    zIndex: -1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 6 : 8,
    paddingBottom: 12,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoAccent: {
    width: 6,
    height: 22,
    borderRadius: 3,
    backgroundColor: P.teal,
    marginRight: 8,
  },
  logoA: { fontSize: 22, fontWeight: '900', color: P.ink, letterSpacing: -0.5 },
  logoB: { fontSize: 22, fontWeight: '900', color: P.teal, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 10,
    backgroundColor: P.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  langText: { color: P.muted, fontWeight: '600', fontSize: 12 },
  notificationBtn: {
    backgroundColor: P.surface,
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.surface,
    width: CARD_W,
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.border,
    height: 52,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchBlock: {
    marginBottom: 6,
    zIndex: 2,
  },
  searchPlaceholder: { color: P.faint, fontSize: 14, marginLeft: 10, flex: 1, fontWeight: '500' },
  searchHintPill: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingTop: 14,
    paddingBottom: 100,
    paddingHorizontal: 0,
  },

  categoryCardWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },

  categoryCard: {
    width: CARD_W,
    height: 150,
    position: 'relative',
    alignSelf: 'center',
    overflow: 'visible',
    borderRadius: 24,
    backgroundColor: 'transparent',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  cardContent: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 25,
    justifyContent: 'center',
    zIndex: 10,
  },
  
  cardTextWrapper: {
    maxWidth: '65%',
    alignItems: 'center',
    height: undefined,
    paddingVertical: 10, 
  },

  categoryTitle: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#000000',
    textAlign: 'center',
    lineHeight: 28, 
    includeFontPadding: false,
    paddingBottom: 4, 
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2.5,
  },

  categoryCount: { 
    fontSize: 12,
    fontWeight: '700', 
    color: '#000000',
    marginTop: 2, 
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2.5,
  },

  imageMask: { position: 'absolute', zIndex: 5, overflow: 'visible' },
  fullImage: { width: '100%', height: '100%' },
});