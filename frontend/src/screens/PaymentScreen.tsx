import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useCartStore } from '../store/cartStore';
import { getApiErrorMessage, isValidExpiry } from '../utils/validation';
import { checkout } from '../api/orders';
import {
  loadCards as loadSecureCards,
  saveCards as saveSecureCards,
  type SavedCard,
} from '../utils/secureStorage';
import { useI18n } from '../i18n/useI18n';

export default function PaymentScreen({ route, navigation }: any) {
  const { t } = useI18n();
  const { storeId, total } = route.params;
  const reset = useCartStore((s) => s.reset);

  const [method, setMethod] = useState<'card' | 'cash'>('card');
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [formErrors, setFormErrors] = useState<{ cardNumber?: string; expiry?: string; cvv?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const normalizeCardDigits = (value: string) => value.replace(/\D/g, '');

  const normalizeExpiryValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';

    const parts = trimmed.split('/');
    if (parts.length === 2) {
      const monthDigits = parts[0].replace(/\D/g, '').slice(0, 2);
      const yearDigits = parts[1].replace(/\D/g, '').slice(0, 4);
      if (!monthDigits || !yearDigits) {
        return `${monthDigits}${parts[1] ? '/' : ''}${yearDigits}`;
      }
      const normalizedMonth = monthDigits.length === 1 ? `0${monthDigits}` : monthDigits;
      return `${normalizedMonth}/${yearDigits}`;
    }

    const digits = trimmed.replace(/\D/g, '').slice(0, 6);
    if (digits.length <= 2) {
      return digits;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const loadCards = async () => {
    const parsed = await loadSecureCards();
    setCards(parsed);
    if (parsed.length > 0) setSelectedCardId(parsed[0].id);
  };

  const saveCards = async (list: SavedCard[]) => {
    await saveSecureCards(list);
    setCards(list);
  };

  const detectBrand = (num: string) => {
    if (num.startsWith('4')) return 'Visa';
    if (num.startsWith('5')) return 'MasterCard';
    if (num.startsWith('2')) return 'Mir';
    if (num.startsWith('6')) return 'UnionPay';
    return 'Card';
  };

  const formatCardNumber = (text: string) => {
    const digits = normalizeCardDigits(text).slice(0, 19);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (text: string) => {
    return normalizeExpiryValue(text);
  };

  const handleAddCard = async () => {
    const digits = normalizeCardDigits(cardNumber);
    const normalizedExpiry = normalizeExpiryValue(expiry);
    const nextErrors: { cardNumber?: string; expiry?: string; cvv?: string } = {};

    if (digits.length < 16 || digits.length > 19) {
      nextErrors.cardNumber = t('Карта нөмірі 16-19 цифр болуы керек', 'Номер карты должен содержать 16-19 цифр');
    }
    if (!isValidExpiry(normalizedExpiry)) {
      nextErrors.expiry = t(
        'Жарамдылық мерзімін ММ/ЖЖ немесе ММ/ЖЖЖЖ түрінде жазыңыз',
        'Укажите срок действия в формате ММ/ГГ или ММ/ГГГГ',
      );
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      nextErrors.cvv = t('CVV кодын жазыңыз', 'Введите CVV код');
    }

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const newCard: SavedCard = {
      id: Date.now().toString(),
      last4: digits.slice(-4),
      brand: detectBrand(digits),
      expiry: normalizedExpiry,
    };

    const updated = [
      ...cards.filter((card) => !(card.last4 === newCard.last4 && card.expiry === newCard.expiry && card.brand === newCard.brand)),
      newCard,
    ];

    try {
      await saveCards(updated);
      setSelectedCardId(newCard.id);
      setShowAddCard(false);
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setFormErrors({});
    } catch (e: any) {
      Alert.alert(
        t('Қате', 'Ошибка'),
        getApiErrorMessage(e, t('Картаны сақтау мүмкін болмады', 'Не удалось сохранить карту')),
      );
    }
  };

  const handleDeleteCard = (cardId: string) => {
    Alert.alert(t('Картаны өшіру', 'Удаление карты'), t('Бұл картаны өшіресіз бе?', 'Удалить эту карту?'), [
      { text: t('Болдырмау', 'Отмена'), style: 'cancel' },
      {
        text: t('Өшіру', 'Удалить'),
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = cards.filter((c) => c.id !== cardId);
            await saveCards(updated);
            if (selectedCardId === cardId) {
              setSelectedCardId(updated.length > 0 ? updated[0].id : null);
            }
          } catch (e: any) {
            Alert.alert(
              t('Қате', 'Ошибка'),
              getApiErrorMessage(e, t('Картаны өшіру мүмкін болмады', 'Не удалось удалить карту')),
            );
          }
        },
      },
    ]);
  };

  const handlePay = async () => {
    if (!storeId) {
      Alert.alert(t('Қате', 'Ошибка'), t('Төлем үшін дүкен табылмады', 'Не найден магазин для оплаты'));
      return;
    }

    if (method === 'card' && showAddCard) {
      Alert.alert(t('Қате', 'Ошибка'), t('Алдымен картаны сақтаңыз', 'Сначала сохраните карту'));
      return;
    }

    if (method === 'card' && !selectedCardId) {
      Alert.alert(t('Қате', 'Ошибка'), t('Алдымен карта қосыңыз немесе таңдаңыз', 'Сначала добавьте или выберите карту'));
      return;
    }

    const selectedCard = cards.find((card) => card.id === selectedCardId);
    setLoading(true);
    try {
      const order = await checkout({
        storeId,
        paymentMethod: method === 'card' ? 'CARD' : 'CASH',
        cardLast4: method === 'card' ? selectedCard?.last4 : undefined,
        cardBrand: method === 'card' ? selectedCard?.brand : undefined,
      });
      reset();
      Alert.alert(t('Сәтті!', 'Успешно!'), t('Тапсырыс рәсімделді', 'Заказ оформлен'), [
        {
          text: t('Тапсырысты көру', 'Посмотреть заказ'),
          onPress: () => navigation.replace('OrderDetail', { orderId: order.id }),
        },
        {
          text: t('Басты бет', 'На главную'),
          onPress: () => navigation.popToTop(),
        },
      ]);
    } catch (e: any) {
      Alert.alert(t('Қате', 'Ошибка'), getApiErrorMessage(e, t('Төлем жасау мүмкін болмады', 'Не удалось выполнить оплату')));
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
        <Text style={styles.headerTitle}>{t('Төлем', 'Оплата')}</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Order summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('Тапсырыс сомасы', 'Сумма заказа')}</Text>
          <Text style={styles.summaryTotal}>{Number(total).toFixed(0)} ₸</Text>
        </View>

        {/* Payment method selection */}
        <Text style={styles.sectionTitle}>{t('Төлем тәсілі', 'Способ оплаты')}</Text>
        <View style={styles.methodRow}>
          <TouchableOpacity
            style={[styles.methodBtn, method === 'card' && styles.methodBtnActive]}
            onPress={() => setMethod('card')}
          >
            <Feather name="credit-card" size={22} color={method === 'card' ? '#FFF' : '#64748B'} />
            <Text style={[styles.methodText, method === 'card' && styles.methodTextActive]}>
              {t('Карта', 'Карта')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, method === 'cash' && styles.methodBtnActive]}
            onPress={() => setMethod('cash')}
          >
            <Feather name="dollar-sign" size={22} color={method === 'cash' ? '#FFF' : '#64748B'} />
            <Text style={[styles.methodText, method === 'cash' && styles.methodTextActive]}>
              {t('Қолма-қол', 'Наличные')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card section */}
        {method === 'card' && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>{t('Сақталған карталар', 'Сохраненные карты')}</Text>

            {cards.length === 0 && !showAddCard && (
              <Text style={styles.noCards}>{t('Сақталған карта жоқ', 'Сохраненных карт нет')}</Text>
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
                <Text style={styles.addCardText}>{t('Карта қосу', 'Добавить карту')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.addCardForm}>
                <Text style={styles.formLabel}>{t('Карта нөмірі', 'Номер карты')}</Text>
                <TextInput
                  style={[styles.input, formErrors.cardNumber ? styles.inputErrorBorder : undefined]}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                  maxLength={23}
                  value={cardNumber}
                  onChangeText={(value) => {
                    setCardNumber(formatCardNumber(value));
                    if (formErrors.cardNumber) {
                      setFormErrors((prev) => ({ ...prev, cardNumber: undefined }));
                    }
                  }}
                />
                {formErrors.cardNumber ? (
                  <Text style={styles.inputErrorText}>{formErrors.cardNumber}</Text>
                ) : null}

                <View style={styles.formRow}>
                  <View style={styles.formHalf}>
                    <Text style={styles.formLabel}>{t('Мерзімі', 'Срок')}</Text>
                    <TextInput
                      style={[styles.input, formErrors.expiry ? styles.inputErrorBorder : undefined]}
                      placeholder="MM/YY"
                      placeholderTextColor="#CBD5E1"
                      keyboardType="numeric"
                      maxLength={7}
                      value={expiry}
                      onChangeText={(value) => {
                        setExpiry(formatExpiry(value));
                        if (formErrors.expiry) {
                          setFormErrors((prev) => ({ ...prev, expiry: undefined }));
                        }
                      }}
                    />
                    {formErrors.expiry ? (
                      <Text style={styles.inputErrorText}>{formErrors.expiry}</Text>
                    ) : null}
                  </View>
                  <View style={styles.formHalf}>
                    <Text style={styles.formLabel}>CVV</Text>
                    <TextInput
                      style={[styles.input, formErrors.cvv ? styles.inputErrorBorder : undefined]}
                      placeholder="•••"
                      placeholderTextColor="#CBD5E1"
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      value={cvv}
                      onChangeText={(value) => {
                        setCvv(value.replace(/\D/g, ''));
                        if (formErrors.cvv) {
                          setFormErrors((prev) => ({ ...prev, cvv: undefined }));
                        }
                      }}
                    />
                    {formErrors.cvv ? (
                      <Text style={styles.inputErrorText}>{formErrors.cvv}</Text>
                    ) : null}
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
                      setFormErrors({});
                    }}
                  >
                    <Text style={styles.formCancelText}>{t('Болдырмау', 'Отмена')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.formSaveBtn} onPress={handleAddCard}>
                    <Text style={styles.formSaveText}>{t('Сақтау', 'Сохранить')}</Text>
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
              {t('Тапсырысты алған кезде қолма-қол ақшамен төлейсіз', 'Оплата наличными при получении заказа')}
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
              {t('Төлеу', 'Оплатить')} · {Number(total).toFixed(0)} ₸
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
    paddingTop: 0,
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
  inputErrorBorder: {
    borderColor: '#EF4444',
  },
  inputErrorText: {
    color: '#B91C1C',
    fontSize: 12,
    marginTop: -6,
    marginBottom: 10,
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
