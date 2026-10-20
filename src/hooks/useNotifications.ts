import { useState, useEffect, useCallback } from 'react';
import {
  notificationService,
  DealMateNotificationItem,
} from '../services/notificationService';

export function useNotifications() {
  const [isSupported] = useState<boolean>(() => notificationService.isSupported());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    notificationService.getPermission()
  );
  const [history, setHistory] = useState<DealMateNotificationItem[]>(() =>
    notificationService.getHistory()
  );
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    notificationService.isOfflineOrBackground()
  );

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setPermission(notificationService.getPermission());
      setHistory(notificationService.getHistory());
      setIsOffline(notificationService.isOfflineOrBackground());
    });
    return unsubscribe;
  }, []);

  const requestPermission = useCallback(async () => {
    const res = await notificationService.requestPermission();
    setPermission(res);
    return res;
  }, []);

  const sendTestNotification = useCallback(async () => {
    return notificationService.sendTestNotification();
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  const clearHistory = useCallback(() => {
    notificationService.clearHistory();
  }, []);

  const unreadCount = history.filter((h) => !h.read).length;

  return {
    isSupported,
    permission,
    isGranted: permission === 'granted',
    history,
    unreadCount,
    isOffline,
    requestPermission,
    sendTestNotification,
    markAllAsRead,
    clearHistory,
    notifyAutonomousDealCompleted: notificationService.notifyAutonomousDealCompleted.bind(notificationService),
    notifySellerResponse: notificationService.notifySellerResponse.bind(notificationService),
  };
}
