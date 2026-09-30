import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = mode === 'sign-in' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.error) setError(result.error);
    else router.back();
  };

  return (
    <Screen title={mode === 'sign-in' ? 'Sign in' : 'Create account'}>
      <View className="px-6 pt-6">
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          keyboardType="email-address"
          className="rounded-lg border border-border bg-surface px-4 py-3 text-foreground"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
          className="mt-3 rounded-lg border border-border bg-surface px-4 py-3 text-foreground"
        />

        {error ? <Text className="mt-3 text-sm text-destructive">{error}</Text> : null}

        <Pressable
          disabled={busy}
          onPress={submit}
          className="mt-5 items-center rounded-lg bg-primary px-6 py-3"
        >
          {busy ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text className="font-semibold text-primaryForeground">
              {mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className="mt-4 items-center py-2"
        >
          <Text className="text-sm text-mutedForeground">
            {mode === 'sign-in' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
