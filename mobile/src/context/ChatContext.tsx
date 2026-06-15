import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { dataService } from '../services/dataService';

export type ChatMsg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Ajanın o cevapta çağırdığı araçlar (geliştirme görünürlüğü) */
  toolsCalled?: string[];
  isError?: boolean;
};

const WELCOME: ChatMsg = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Merhaba! Ben Kampüs Asistanı 🤖\n' +
    'Öğretim üyeleri ve haftalık ders/müsaitlik programları hakkında soru sorabilirsin.\n' +
    'Örn: "Cevriye hocanın bu haftaki müsait saatleri neler?"',
};

let msgCounter = 0;
const genId = () => `m${Date.now()}_${msgCounter++}`;

interface ChatContextValue {
  messages: ChatMsg[];
  /** Asistan cevabı beklenirken true (eski adıyla "sending"). */
  isLoading: boolean;
  /** Kullanıcı mesajını ekler, asistana gönderir ve cevabı listeye işler. */
  sendMessage: (text: string) => Promise<void>;
  /** Sohbeti karşılama mesajına döndürür ve LangGraph thread'ini sıfırlar. */
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * AI Asistan sohbetini global (uygulama ömrü boyunca) bellekte tutar. Ekran
 * React Navigation tarafından unmount edilse bile mesajlar burada yaşadığı için
 * sayfalar arası geçişte kaybolmaz; yalnızca uygulama reload edilince sıfırlanır.
 *
 * AuthProvider'ın ALTINDA sarmalanmalıdır: sessionId, kullanıcı kimliğinden türetilir.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [isLoading, setIsLoading] = useState(false);

  // "Yeni Sohbet" oturum rotasyonu: suffix değişince LangGraph yepyeni bir
  // thread_id görür ve geçmiş bağlam tamamen sıfırlanır (backend'de silme gerekmez).
  // Suffix de context'te tutulur ki ekran unmount olsa bile thread sürekliliği korunsun.
  const [sessionSuffix, setSessionSuffix] = useState(() => Date.now().toString());

  // En sağlam hafıza anahtarı: kullanıcı ID'si + aktif sohbet suffix'i.
  const sessionId = useMemo(
    () => (user ? `user-${user.id}-${sessionSuffix}` : `anonymous-${sessionSuffix}`),
    [user, sessionSuffix],
  );

  // Çift gönderimi engellemek için ref guard (state closure'una takılmadan anlık okunur).
  const sendingRef = useRef(false);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || sendingRef.current) return;
      sendingRef.current = true;

      const userMsg: ChatMsg = { id: genId(), role: 'user', content: text };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const { data } = await dataService.sendAiMessage(text, sessionId);
        setMessages(prev => [
          ...prev,
          {
            id: genId(),
            role: 'assistant',
            content: data.reply,
            toolsCalled: data.debug_info?.tools_called,
          },
        ]);
      } catch (err: any) {
        // OpenAI kota hatası (502/429) → kibar bir uyarı; diğer hatalar → genel mesaj.
        const status = err?.response?.status;
        const content =
          status === 502 || status === 429
            ? 'Asistan şu an hizmet veremiyor. Lütfen daha sonra tekrar deneyin.'
            : 'Bir hata oluştu. İnternet bağlantını kontrol edip tekrar dene.';
        setMessages(prev => [
          ...prev,
          { id: genId(), role: 'assistant', content, isError: true },
        ]);
      } finally {
        setIsLoading(false);
        sendingRef.current = false;
      }
    },
    [sessionId],
  );

  // "Yeni Sohbet": ekranı temizle + oturum suffix'ini döndür → sonraki mesaj yeni thread'de.
  const clearChat = useCallback(() => {
    setMessages([WELCOME]);
    setSessionSuffix(Date.now().toString());
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({ messages, isLoading, sendMessage, clearChat }),
    [messages, isLoading, sendMessage, clearChat],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
