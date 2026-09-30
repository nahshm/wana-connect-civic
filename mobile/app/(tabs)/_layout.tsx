import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/theme/colors';

/** Simple text glyphs keep the scaffold dependency-free; swap for an icon set later. */
const icon = (glyph: string) => ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 18 }}>{glyph}</Text>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Feed', tabBarIcon: icon('⌂') }} />
      <Tabs.Screen name="clips" options={{ title: 'Clips', tabBarIcon: icon('▶') }} />
      <Tabs.Screen name="communities" options={{ title: 'Communities', tabBarIcon: icon('◍') }} />
      <Tabs.Screen name="governance" options={{ title: 'Governance', tabBarIcon: icon('⚖') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('◉') }} />
    </Tabs>
  );
}
