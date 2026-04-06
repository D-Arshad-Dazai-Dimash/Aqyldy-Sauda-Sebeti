import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkout } from '../api/orders';
import { useCartStore } from '../store/cartStore';

const CARDS_KEY = '@saved_cards';

interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiry: string;
}

export default function PaymentScreen({ route, navigation }: any) {
  const { storeId, total } = route.params;
  const reset = useCartStore((s) => s.reset);

  const [method, setMethod] = useState<'card' | 'cash'>('card');
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const raw = await AsyncStorage.getItem(CARDS_KEY);
      if (raw) {
        const parsed: SavedCard[] = JSON.parse(raw);
        setCards(parsed);
        if (parsed.length > 0) setSelectedCardId(parsed[0].id);
      }
    } catch {}
  };

  const saveCards = async (list: SavedCard[]) => {
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(list));
    setCards(list);
  };

  const detectBrand = (num: string) => {
    if (num.startsWith('4')) return 'Visa';
    if (num.startsWith('5')) return 'MasterCard';
    if (num.startsWith('6')) return 'UnionPay';
    return 'Card';
  };

  const formatCardNumber = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleAddCard = async () => {
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 16) {
      Alert.alert('Қате', 'Карта нөмірін толық жазыңыз');
      return;
    }
    if (expiry.length < 5) {
      Alert.alert('Қате', 'Жарамдылық мерзімін жазыңыз (АА/ЖЖ)');
      return;
    }
    if (cvv.length < 3) {
      Alert.alert('Қате', 'CVV кодын жазыңыз');
      return;
    }

    const newCard: SavedCard = {
      id: Date.now().toString(),
      last4: digits.slice(-4),
      brand: detectBrand(digits),
      expiry,
    };
    const updated = [...cards, newCard];
    await saveCards(updated);
    setSelectedCardId(newCard.id);
    setShowAddCard(false);
    setCardNumber('');
    setExpiry('');
    setCvv('');
  };

  const handleDeleteCard = (cardId: string) => {
    Alert.alert('Картаны өшіру', 'Бұл картаны өшіресіз бе?', [
      { text: 'Болдырмау', style: 'cancel' },
      {
        text: 'Өшіру',
        style: 'destructive',
        onPress: async () => {
          const updated = cards.filter((c) => c.id !== cardId);
          await saveCards(updated);
          if (selectedCardId === cardId) {
            setSelectedCardId(updated.length > 0 ? updated[0].id : null);
          }
        },
      },
    ]);
  };

  const handlePay = async () => {
    if (method === 'card' && !selectedCardId) {
      Alert.alert('Қате', 'Алдымен карта қосыңыз немесе таңдаңыз');
      return;
    }
    setLoading(true);
    try {
      const order = await checkout(storeId);
      reset();
      Alert.alert('Сәтті!', 'Тапсырыс рәсімделді', [
        {
          text: 'Тапсырысты көру',
          onPress: () => navigation.replace('OrderDetail', { orderId: order.id }),
        },
        {
          text: 'Басты бет',
          onPress: () => navigation.popToTop(),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Қате', e?.message || 'Төлем жасау мүмкін болмады');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={30} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Төлем</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Order summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Тапсырыс сомасы</Text>
          <Text style={styles.summaryTotal}>{Number(total).toFixed(0)} ₸</Text>
        </View>

        {/* Payment method selection */}
        <Text style={styles.sectionTitle}>Төлем тәсілі</Text>
        <View style={styles.methodRow}>
          <TouchableOpacity
            style={[styles.methodBtn, method === 'card' && styles.methodBtnActive]}
            onPress={() => setMethod('card')}
          >
            <Feather name="credit-card" size={22} color={method === 'card' ? '#FFF' : '#64748B'} />
            <Text style={[styles.methodText, method === 'card' && styles.methodTextActive]}>
              Карта
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, method === 'cash' && styles.methodBtnActive]}
            onPress={() => setMethod('cash')}
          >
            <Feather name="dollar-sign" size={22} color={method === 'cash' ? '#FFF' : '#64748B'} />
            <Text style={[styles.methodText, method === 'cash' && styles.methodTextActive]}>
              Қолма-қол
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card section */}
        {method === 'card' && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Сақталған карталар</Text>

            {cards.length === 0 && !showAddCard && (
              <Text style={styles.noCards}>Сақталған карта жоқ</Text>
            )}

            {cards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.savedCard, selectedCardId === card.id && styles.savedCardActive]}
                onPress={() => setSelectedCardId(card.id)}
              >
                <View style={styles.cardLeft}>
                  <Feather
                    name={selectedCardId === card.id ? 'check-circle' : 'circle'}
                    size={20}
                    color={selectedCardId === card.id ? '#4AB7B6' : '#CBD5E1'}
                  />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardBrand}>{card.brand}</Text>
                    <Text style={styles.cardLast4}>•••• {card.last4}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardExpiry}>{card.expiry}</Text>
                  <TouchableOpacity onPress={() => handleDeleteCard(card.id)}>
                    <Feather name="trash-2" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {!showAddCard ? (
              <TouchableOpacity style={styles.addCardBtn} onPress={() => setShowAddCard(true)}>
                <Feather name="plus-circle" size={20} color="#4AB7B6" />
                <Text style={styles.addCardText}>Карта қосу</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.addCardForm}>
                <Text style={styles.formLabel}>Карта нөмірі</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                />

                <View style={styles.formRow}>
                  <View style={styles.formHalf}>
                    <Text style={styles.formLabel}>Мерзімі</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="АА/ЖЖ"
                      placeholderTextColor="#CBD5E1"
                      keyboardType="numeric"
                      maxLength={5}
                      value={expiry}
                      onChangeText={(t) => setExpiry(formatExpiry(t))}
                    />
                  </View>
                  <View style={styles.formHalf}>
                    <Text style={styles.formLabel}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="•••"
                      placeholderTextColor="#CBD5E1"
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                      value={cvv}
                      onChangeText={(t) => setCvv(t.replace(/\D/g, ''))}
                    />
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.formCancelBtn}
                    onPress={() => {
                      setShowAddCard(false);
                      setCardNumber('');
                      setExpiry('');
                      setCvv('');
                    }}
                  >
                    <Text style={styles.formCancelText}>Болдырмау</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.formSaveBtn} onPress={handleAddCard}>
                    <Text style={styles.formSaveText}>Сақтау</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {method === 'cash' && (
          <View style={styles.cashInfo}>
            <Feather name="info" size={20} color="#64748B" />
            <Text style={styles.cashText}>
              Тапсырысты алған кезде қолма-қол ақшамен төлейсіз
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Pay button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, loading && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.payBtnText}>
              Төлеу · {Number(total).toFixed(0)} ₸
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  summaryTotal: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  methodBtnActive: {
    backgroundColor: '#4AB7B6',
    borderColor: '#4AB7B6',
  },
  methodText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  methodTextActive: {
    color: '#FFF',
  },
  cardSection: {
    marginBottom: 16,
  },
  noCards: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 16,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  savedCardActive: {
    borderColor: '#4AB7B6',
    backgroundColor: '#F0FDFA',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: {},
  cardBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  cardLast4: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardExpiry: {
    fontSize: 13,
    color: '#94A3B8',
  },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4AB7B6',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4AB7B6',
  },
  addCardForm: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formHalf: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  formCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  formCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  formSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#4AB7B6',
  },
  formSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  cashInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cashText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  payBtn: {
    backgroundColor: '#4AB7B6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payBtnDisabled: {
    opacity: 0.6,
  },
  payBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
});
