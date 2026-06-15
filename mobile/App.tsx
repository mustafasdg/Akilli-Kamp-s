import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ChatProvider } from './src/context/ChatContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          {/* ChatProvider, NavigationContainer'ın üstünde durur → AI sohbeti sayfa
              geçişlerinde unmount olmaz, yalnızca uygulama reload'unda sıfırlanır.
              AuthProvider'ın içindedir çünkü sessionId kullanıcı kimliğinden türetilir. */}
          <ChatProvider>
            <RootNavigator />
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
