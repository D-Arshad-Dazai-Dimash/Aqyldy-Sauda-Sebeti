import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import {
  sendChatMessage,
  type ChatMessage,
  type ProductRecommendation,
} from '../api/ai';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ProductRecommendation[];
  timestamp: Date;
}

export default function ChatbotScreen({navigation}: any) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Сәлеметсіз бе! 👋 Мен Ақылды Себет AI көмекшісімін.\n\nМен сізге тауар іздеу, баға салыстыру және ұсыныс беру бойынша көмектесе аламын.\n\nСұрақ қойыңыз!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const quickActions = [
    '🏷️ Жеңілдіктер',
    '💰 Арзан тауарлар',
    '🥛 Сүт бағасы',
    '❓ Көмек',
  ];

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg: DisplayMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history: ChatMessage[] = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({role: m.role, content: m.content}));

      const response = await sendChatMessage(msg, history);

      const assistantMsg: DisplayMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        products:
          response.suggested_products.length > 0
            ? response.suggested_products
            : undefined,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: 'Кешіріңіз, қате орын алды. Қайтадан көріңіз.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);
  }, [messages]);

  const renderMessage = ({item}: {item: DisplayMessage}) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.assistantRow,
        ]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.assistantText,
            ]}>
            {item.content}
          </Text>

          {/* Suggested products */}
          {item.products && item.products.length > 0 && (
            <View style={styles.productsContainer}>
              {item.products.slice(0, 3).map(p => {
                const eff = p.discount
                  ? p.price * (1 - p.discount / 100)
                  : p.price;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.productChip}
                    onPress={() =>
                      navigation.navigate('ProductScreen', {productId: p.id})
                    }>
                    <Image
                      source={
                        p.image_url
                          ? {uri: p.image_url}
                          : require('../assets/p1.png')
                      }
                      style={styles.productChipImage}
                    />
                    <View style={styles.productChipInfo}>
                      <Text style={styles.productChipTitle} numberOfLines={1}>
                        {p.title}
                      </Text>
                      <Text style={styles.productChipPrice}>
                        {eff.toFixed(0)} ₸
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Feather name="chevron-left" size={28} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Көмекші</Text>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({animated: true})
          }
        />

        {/* Quick actions (show only when few messages) */}
        {messages.length <= 2 && (
          <View style={styles.quickActions}>
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickBtn}
                onPress={() => handleSend(action.replace(/^.{2}/, '').trim())}>
                <Text style={styles.quickBtnText}>{action}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Loading indicator */}
        {loading && (
          <View style={styles.typingRow}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>🤖</Text>
            </View>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color="#4AB7B6" />
              <Text style={styles.typingText}>Жазуда...</Text>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Хабарлама жазыңыз..."
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}>
            <Feather name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 0,
  },
  flex: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 2,
  },
  backBtn: {padding: 4},
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    gap: 8,
  },
  headerTitle: {fontSize: 18, fontWeight: '700', color: '#1E293B'},
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  aiBadge: {
    backgroundColor: '#4AB7B6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiBadgeText: {color: '#FFF', fontSize: 13, fontWeight: '800'},
  messageList: {
    padding: 15,
    paddingBottom: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  userRow: {
    alignSelf: 'flex-end',
  },
  assistantRow: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  avatarEmoji: {fontSize: 16},
  messageBubble: {
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 16,
    maxWidth: '90%',
  },
  userBubble: {
    backgroundColor: '#4AB7B6',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  messageText: {fontSize: 14, lineHeight: 20},
  userText: {color: '#FFF'},
  assistantText: {color: '#334155'},
  productsContainer: {
    marginTop: 10,
    gap: 6,
  },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: 10,
    padding: 8,
    gap: 8,
  },
  productChipImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  productChipInfo: {flex: 1},
  productChipTitle: {fontSize: 12, fontWeight: '600', color: '#334155'},
  productChipPrice: {fontSize: 13, fontWeight: '800', color: '#4AB7B6'},
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 8,
    marginBottom: 10,
  },
  quickBtn: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickBtnText: {fontSize: 13, color: '#475569', fontWeight: '500'},
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 14,
  },
  typingText: {fontSize: 13, color: '#94A3B8'},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    backgroundColor: '#4AB7B6',
    borderRadius: 20,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
