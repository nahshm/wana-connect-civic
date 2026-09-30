import { Text, View } from 'react-native';
import { Screen } from '@/components/Screen';

export default function GovernanceScreen() {
  return (
    <Screen title="Governance" subtitle="Leaders, promises and projects">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center text-mutedForeground">
          Accountability tracking lands in phase 4.
        </Text>
      </View>
    </Screen>
  );
}
