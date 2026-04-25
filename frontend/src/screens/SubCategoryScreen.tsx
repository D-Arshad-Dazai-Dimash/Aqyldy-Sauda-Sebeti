import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { PRODUCT_CATEGORIES, Category } from '../constants/categories';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

const P = {
  bg: '#F7F8FC',
  surface: '#FFFFFF',
  ink: '#1E293B',
  muted: '#64748B',
  faint: '#94A3B8',
  border: '#E2E8F0',
  teal: '#0EA5E9',
  tealL: '#E0F2FE',
  purpleL: '#EDE9FE',
  amberL: '#FEF3C7',
  roseL: '#FFE4E6',
  emeraldL: '#D1FAE5',
};

const CARD_ACCENTS = [P.tealL, P.purpleL, P.emeraldL, P.amberL, P.roseL];

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

export default function SubCategoryScreen({ route, navigation }: any) {
  const { categoryId } = route.params;

  const category = PRODUCT_CATEGORIES.find(item => item.id === categoryId) as Category | undefined;

  if (!category) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn.duration(220)} style={styles.bgOrnamentTop} />

      <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={23} color={P.ink} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerOverline}>САНАТ</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{category.name}</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.iconBtn}>
          <Feather name="x" size={18} color={P.faint} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(90).springify()} style={styles.searchWrap}>
        <TouchableOpacity style={styles.searchBox} onPress={() => navigation.navigate('Search')} activeOpacity={0.9}>
          <Feather name="search" size={16} color={P.teal} />
          <Text style={styles.searchText}>Осы санаттан іздеу...</Text>
          <View style={styles.searchHint}>
            <Feather name="sliders" size={12} color={P.muted} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.statsStrip}>
        <View style={styles.statsPill}>
          <Feather name="grid" size={13} color={P.teal} />
          <Text style={styles.statsText}>{category.subcategories.length} бөлім</Text>
        </View>
      </Animated.View>

      <FlatList
        data={category.subcategories}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(160 + index * 40).springify().damping(14)}>
            <PressCard
              style={styles.gridCard}
              onPress={() => navigation.navigate('ProductList', {
                subCategoryName: item,
                categorySlug: category.slug,
              })}
            >
              <View style={[styles.imagePlaceholder, { backgroundColor: CARD_ACCENTS[index % CARD_ACCENTS.length] }]}>
                <Feather name="package" size={34} color={P.teal} />
              </View>
              <Text style={styles.gridTitle} numberOfLines={2}>{item}</Text>
              <View style={styles.gridArrow}>
                <Feather name="arrow-right" size={13} color={P.faint} />
              </View>
            </PressCard>
          </Animated.View>
        )}
      />
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
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -70,
    right: -50,
    backgroundColor: 'rgba(14,165,233,0.1)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 4 : 8,
    paddingBottom: 10,
  },
  headerTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerOverline: {
    fontSize: 10,
    color: P.faint,
    letterSpacing: 1,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: P.ink, marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: P.surface,
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchWrap: { paddingHorizontal: 20, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.surface,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchText: { marginLeft: 10, color: P.faint, fontSize: 14, flex: 1, fontWeight: '500' },
  searchHint: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statsStrip: { paddingHorizontal: 20, marginBottom: 10 },
  statsPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 10,
    backgroundColor: P.tealL,
  },
  statsText: { fontSize: 12, fontWeight: '700', color: P.teal },

  listContainer: { paddingHorizontal: 20, paddingTop: 2, paddingBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 14 },

  gridCard: {
    width: COLUMN_WIDTH,
    borderRadius: 18,
    padding: 10,
    backgroundColor: P.surface,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imagePlaceholder: {
    width: '100%',
    height: COLUMN_WIDTH * 0.62,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: P.ink,
    lineHeight: 17,
    minHeight: 36,
  },
  gridArrow: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: P.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 'auto',
  },
});