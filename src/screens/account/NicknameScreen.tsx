import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { useMe, useUpdateMe } from '@/shared/domain/user/user.queries';
import { BackHeader } from '@/shared/ui/BackHeader';
import { LoginPromptModal } from '@/shared/ui/LoginPromptModal';

type FormValues = { nickname: string };

// 닉네임 설정 (design.pen k0yZdi). 계정 관리의 닉네임 행에서 진입.
// 저장 = PATCH /users/me — ⚠️ 백엔드 미배포(요청 전달 상태)라 배포 전엔 실패 안내만 노출.
// 폼은 React Hook Form(CLAUDE.md 규칙 — 프로젝트 첫 사용처).
export function NicknameScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user != null;

  const { data: me } = useMe(isLoggedIn);
  const updateMe = useUpdateMe();

  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: { nickname: me?.nickname ?? user?.nickname ?? '' },
  });
  const value = watch('nickname');
  const canSubmit = value.trim().length > 0 && !updateMe.isPending;

  const onSubmit = ({ nickname }: FormValues) => {
    updateMe.mutate(
      { nickname: nickname.trim() },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <View className="flex-1 bg-white">
      <BackHeader title="닉네임" />
      {!isLoggedIn ? (
        <LoginPromptModal
          visible
          onClose={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          onPressLogin={() => router.replace('/login')}
        />
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className="flex-1" style={{ paddingHorizontal: 20 }}>
            <Text
              className="font-pretendard-medium"
              style={{ fontSize: 16, color: '#868e96', letterSpacing: -0.32 }}
            >
              샥에서 사용할 닉네임을 입력해주세요
            </Text>

            <View style={{ marginTop: 20, gap: 8 }}>
              <Controller
                control={control}
                name="nickname"
                rules={{
                  required: true,
                  // 제약은 백엔드 명세 부재로 임시(1~20자) — 확정 요청 전달됨(docs/account.md).
                  validate: (v) => v.trim().length >= 1 && v.trim().length <= 20,
                }}
                render={({ field: { value: v, onChange, onBlur } }) => (
                  <TextInput
                    value={v}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="닉네임"
                    placeholderTextColor="#c3c3c3"
                    maxLength={20}
                    autoFocus
                    className="rounded-sm bg-white font-pretendard"
                    style={{
                      fontSize: 16,
                      color: '#1a1a1a',
                      borderWidth: 1,
                      borderColor: '#dee2e6',
                      paddingTop: 10,
                      paddingRight: 12,
                      paddingBottom: 10,
                      paddingLeft: 16,
                    }}
                  />
                )}
              />
              {updateMe.isError && (
                <Text className="font-pretendard-medium" style={{ fontSize: 13, color: '#e03131' }}>
                  닉네임 저장에 실패했어요 — 잠시 후 다시 시도해 주세요
                </Text>
              )}
            </View>
          </View>

          <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}>
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={!canSubmit}
              className="h-12 items-center justify-center rounded-sm bg-primary-500"
              style={{ opacity: canSubmit ? 1 : 0.4 }}
            >
              <Text className="font-pretendard-semibold text-white" style={{ fontSize: 16 }}>
                저장하기
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
