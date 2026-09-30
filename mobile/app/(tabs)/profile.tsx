import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, loading, signOut } = useAuth();

  return (
    <Screen title="Profile">
      <View className="flex-1 items-center justify-center px-8">
        {loading ? (
          <Text className="text-mutedForeground">Loading…</Text>
        ) : user ? (
          <>
            <Text className="text-base text-foreground">{user.email}</Text>
            <Pressable
              onPress={signOut}
              className="mt-6 rounded-lg border border-border px-6 py-3"
            >
              <Text className="text-foreground">Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="text-center text-mutedForeground">
              Sign in to see your civic resume, karma and receipts.
            </Text>
            <Pressable
              onPress={() => router.push('/sign-in')}
              className="mt-6 rounded-lg bg-primary px-6 py-3"
            >
              <Text className="font-semibold text-primaryForeground">Sign in</Text>
            </Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}
