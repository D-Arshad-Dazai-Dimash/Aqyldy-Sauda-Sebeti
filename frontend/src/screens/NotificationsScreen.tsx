import React, { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationsStore } from '../store/notificationsStore';
import type { NotificationResponse } from '../types/api';
import { palette as P } from '../config/palette';
import type { RootStackParamList } from '../types/navigation';

const palette = P;

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationsTab'>;

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    clearError,
  } = useNotificationsStore();

  useEffect(() => {
    // Загружаем уведомления при монтировании
    const unsubscribe = navigation.addListener('focus', () => {
      fetchNotifications();
      fetchUnreadCount();
    });

    return unsubscribe;
  }, [navigation]);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
  };

  const handleDeleteAll = () => {
    Alert.alert('Удалить все?', 'Это действие нельзя отменить', [
      { text: 'Отмена', onPress: () => {} },
      {
        text: 'Удалить',
        onPress: () => deleteAllNotifications(),
        style: 'destructive',
      },
    ]);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const renderNotification = ({ item, index }: { item: NotificationResponse; index: number }) => {
    const getIcon = (type: string) => {
      switch (type) {
        case 'ORDER':
          return 'package';
        case 'PROMOTION':
          return 'gift';
        case 'PRICE_DROP':
          return 'trending-down';
        case 'FAVORITE_BACK_IN_STOCK':
          return 'heart';
        default:
          return 'info';
      }
    };

    const getColor = (type: string) => {
      switch (type) {
        case 'ORDER':
          return palette.blue;
        case 'PROMOTION':
          return palette.mint;
        case 'PRICE_DROP':
          return palette.lime;
        case 'FAVORITE_BACK_IN_STOCK':
          return palette.pink;
        default:
          return palette.ink;
      }
    };

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50)}
        style={[
          styles.notificationItem,
          { backgroundColor: item.read ? palette.paper : palette.softBlue },
        ]}
      >
        <View style={[styles.iconBg, { backgroundColor: getColor(item.type) }]}>
          <Feather name={getIcon(item.type) as any} size={20} color="white" />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('ru-RU')}
          </Text>
        </View>

        <View style={styles.actions}>
          {!item.read && (
            <TouchableOpacity
              onPress={() => handleMarkAsRead(item.id)}
              style={styles.actionBtn}
            >
              <Feather name="check-circle" size={16} color={palette.sky} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
            <Feather name="trash-2" size={16} color={palette.fire} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={palette.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Уведомления</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerBtn}>
              <Feather name="check-square" size={18} color={palette.ink} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleDeleteAll} style={styles.headerBtn}>
              <Feather name="trash" size={18} color={palette.fire} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Feather name="x" size={18} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={palette.sky} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Feather name="inbox" size={48} color={palette.faint} />
          <Text style={styles.emptyText}>Нет уведомлений</Text>
          <Text style={styles.emptySubText}>
            Здесь появятся новости о заказах и акциях
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.softGray,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: palette.ink,
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    padding: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.fire,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.ink,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: palette.sky,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.ink,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: palette.muted,
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: palette.faint,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    padding: 6,
  },
});

export default NotificationsScreen;
