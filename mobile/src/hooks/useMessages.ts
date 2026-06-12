import { useState, useCallback, useEffect } from 'react';
import { Message } from '../types/models';
import { dataService } from '../services/dataService';

interface UseMessagesResult {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useMessages(otherUserId: number): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await dataService.getConversation(otherUserId);
      setMessages(res.data);
      setError(null);
      // Okunan mesajları işaretle (hata sessizce yutulur)
      dataService.markAsRead(otherUserId).catch(() => {});
    } catch {
      setError('Mesajlar yüklenemedi.');
    }
  }, [otherUserId]);

  useEffect(() => {
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const sendMessage = useCallback(async (content: string) => {
    setIsSending(true);
    try {
      const res = await dataService.sendMessage(otherUserId, content);
      setMessages(prev => [...prev, res.data]);
    } catch {
      throw new Error('Mesaj gönderilemedi.');
    } finally {
      setIsSending(false);
    }
  }, [otherUserId]);

  return { messages, isLoading, isSending, error, sendMessage, refresh };
}
