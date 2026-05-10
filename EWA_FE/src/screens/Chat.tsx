import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import type { ChatMessage } from '../context/AppContext';
import TopBar from '../components/TopBar';
import * as mockApi from '../services/mockApi';
import { colors, shadows } from '../theme/colors';

const QUICK_PROMPTS = [
  'Hạn mức rút lương hiện tại của tôi là bao nhiêu?',
  'Cho tôi xem các giao dịch gần đây',
  'Tôi đã thanh toán hóa đơn nào gần đây?',
];

export default function ChatScreen() {
  const navigation = useNavigation();
  const { employee, chatMessages, setChatMessages } = useApp();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !employee || loading) return;

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmed };
    setChatMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const result = await mockApi.sendChatMessage(employee.id, trimmed);
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text: result.success
        ? result.data.answer
        : result.error || 'Xin lỗi, tôi chưa thể trả lời lúc này.',
    };
    setChatMessages(prev => [...prev, assistantMessage]);
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <MaterialCommunityIcons name="robot-happy-outline" size={20} color={colors.indigo600} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.innerContainer}>
          <TopBar title="Trợ lý AI" onBack={() => navigation.goBack()} />
          
          <FlatList
            ref={listRef}
            data={chatMessages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            style={styles.flatList}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.indigo600} />
                <Text style={styles.loadingText}>Trợ lý đang tra cứu dữ liệu...</Text>
              </View>
            ) : null}
          />

          <View style={styles.bottomSection}>
            <View style={styles.quickPromptWrap}>
              {QUICK_PROMPTS.map(prompt => (
                <TouchableOpacity key={prompt} style={styles.quickPrompt} onPress={() => sendMessage(prompt)} activeOpacity={0.8}>
                  <Text style={styles.quickPromptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Nhập câu hỏi của bạn..."
                placeholderTextColor={colors.slate400}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
                disabled={!input.trim() || loading}
                onPress={() => sendMessage(input)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="send" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: colors.background,
    height: Platform.OS === 'web' ? '100vh' : '100%' as any, // Ép kiểu any để fix lỗi TS cho đơn vị vh
  },
  container: { flex: 1 },
  innerContainer: { flex: 1, height: '100%' }, // Đảm bảo chiếm hết chiều cao
  flatList: { flex: 1 }, 
  bottomSection: { 
    backgroundColor: colors.background, 
    paddingBottom: Platform.OS === 'android' ? 10 : 0,
    borderTopWidth: 1,
    borderTopColor: colors.indigo50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: colors.white,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.indigo100,
    ...shadows.md,
  },
  headerIcon: { width: 54, height: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 23, fontWeight: '900', color: colors.indigo900 },
  subtitle: { fontSize: 13, fontWeight: '700', color: colors.slate600, marginTop: 3, lineHeight: 18 },
  messageList: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 30 }, // Tăng padding bottom
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 16 },
  messageRowUser: { justifyContent: 'flex-end' },
  botAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.indigo50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.indigo100 },
  bubble: { maxWidth: '82%', borderRadius: 24, paddingHorizontal: 17, paddingVertical: 13, ...shadows.sm },
  assistantBubble: { backgroundColor: colors.white, borderBottomLeftRadius: 8, borderWidth: 1, borderColor: colors.slate200 },
  userBubble: { backgroundColor: colors.indigo700, borderBottomRightRadius: 8 },
  bubbleText: { fontSize: 16, lineHeight: 23, fontWeight: '700' },
  assistantText: { color: colors.slate900 },
  userText: { color: colors.white },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 48, paddingVertical: 8 },
  loadingText: { fontSize: 13, color: colors.slate600, fontWeight: '700' },
  quickPromptWrap: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8, gap: 8 },
  quickPrompt: { backgroundColor: colors.indigo50, borderWidth: 1, borderColor: colors.indigo100, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
  quickPromptText: { color: colors.indigo700, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 10,
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.indigo100,
    ...shadows.md,
  },
  input: { flex: 1, minHeight: 46, maxHeight: 120, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, lineHeight: 22, color: colors.slate900, fontWeight: '700' },
  sendButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.indigo700 },
  sendButtonDisabled: { backgroundColor: colors.slate300 },
});
