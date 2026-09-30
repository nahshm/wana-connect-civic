import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { Screen } from '@/components/Screen';

export default function NotFoundScreen() {
  return (
    <Screen title="Page not found">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center text-mutedForeground">
          This screen does not exist.
        </Text>
        <Link href="/" className="mt-6 text-primary">
          Go to the feed
        </Link>
      </View>
    </Screen>
  );
}
