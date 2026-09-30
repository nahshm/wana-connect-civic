import { Text, View } from 'react-native';
import { Screen } from '@/components/Screen';

export default function CommunitiesScreen() {
  return (
    <Screen title="Communities" subtitle="Your county, constituency and ward">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center text-mutedForeground">
          Community hubs and channel chat land in phase 3.
        </Text>
      </View>
    </Screen>
  );
}
