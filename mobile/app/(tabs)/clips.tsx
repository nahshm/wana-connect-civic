import { Text, View } from 'react-native';
import { Screen } from '@/components/Screen';

export default function ClipsScreen() {
  return (
    <Screen title="Civic Clips" subtitle="Short-form civic video">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center text-mutedForeground">
          The full-screen swipe player lands in phase 2.
        </Text>
      </View>
    </Screen>
  );
}
