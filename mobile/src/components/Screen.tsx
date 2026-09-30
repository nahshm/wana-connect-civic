import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

/** Shared page shell: dark canvas, safe-area padding, optional header. */
export function Screen({ title, subtitle, children, edges = ['top'] }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background">
      {title ? (
        <View className="border-b border-border px-4 pb-3 pt-2">
          <Text className="text-xl font-semibold text-foreground">{title}</Text>
          {subtitle ? (
            <Text className="mt-1 text-sm text-mutedForeground">{subtitle}</Text>
          ) : null}
        </View>
      ) : null}
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
