import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useReviewLogin } from '@/shared/domain/auth/auth.queries';
import { colors } from '@/shared/theme/colors';

export function ReviewLoginForm({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useReviewLogin();
  const busy = disabled || login.isPending;

  const submit = async () => {
    if (busy || !username.trim() || !password) return;
    setError('');
    try {
      await login.mutateAsync({ username: username.trim().toLowerCase(), password });
      setPassword('');
      router.replace('/home');
    } catch {
      setError('로그인 정보를 확인해 주세요. 여러 번 시도했다면 15분 뒤 다시 시도해 주세요.');
    }
  };

  return (
    <View className="gap-2">
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setOpen(!open); setPassword(''); setError(''); }} className="items-center py-1">
        <Text className="text-label-m font-pretendard-medium" style={{ color: colors.white }}>
          {open ? '심사용 계정 로그인 닫기' : '심사용 계정 로그인'}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => { if (!busy) { setOpen(false); setPassword(''); } }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-center bg-black/50 px-5">
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="gap-3 rounded-lg bg-white p-5">
          <Text className="text-body-l font-pretendard-semibold">심사용 계정 로그인</Text>
          <TextInput accessibilityLabel="심사용 아이디" placeholder="아이디" value={username}
            onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} maxLength={64}
            editable={!busy} className="rounded-lg bg-white px-4 py-3 text-body-m" />
          <TextInput accessibilityLabel="심사용 비밀번호" placeholder="비밀번호" value={password}
            onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false}
            maxLength={128} editable={!busy} onSubmitEditing={() => void submit()}
            className="rounded-lg bg-white px-4 py-3 text-body-m" />
          {!!error && <Text accessibilityRole="alert" className="text-label-m">{error}</Text>}
          <Pressable accessibilityRole="button" disabled={busy || !username.trim() || !password}
            onPress={() => void submit()} className="items-center rounded-lg bg-white py-3">
            <Text className="text-label-l font-pretendard-semibold">{login.isPending ? '로그인 중…' : '로그인'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setOpen(false); setPassword(''); setError(''); }} className="items-center py-2">
            <Text className="text-label-l">닫기</Text>
          </Pressable>
        </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
