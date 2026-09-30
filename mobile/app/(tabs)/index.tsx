import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';

type FeedPost = {
  id: string;
  title: string | null;
  content: string | null;
  created_at: string;
  upvotes: number | null;
  comment_count: number | null;
};

export default function FeedScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error: queryError } = await supabase
        .from('posts')
        .select('id, title, content, created_at, upvotes, comment_count')
        .order('created_at', { ascending: false })
        .limit(20);

      if (cancelled) return;
      if (queryError) setError(queryError.message);
      else setPosts((data ?? []) as FeedPost[]);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen title="For You" subtitle="Civic activity from across the country">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-mutedForeground">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          ItemSeparatorComponent={() => <View className="h-px bg-border" />}
          ListEmptyComponent={
            <Text className="px-4 py-10 text-center text-mutedForeground">
              Nothing here yet.
            </Text>
          }
          renderItem={({ item }) => (
            <View className="px-4 py-4">
              <Text className="text-base font-semibold text-foreground">
                {item.title ?? 'Untitled'}
              </Text>
              {item.content ? (
                <Text numberOfLines={3} className="mt-1 text-sm text-mutedForeground">
                  {item.content}
                </Text>
              ) : null}
              <Text className="mt-2 text-xs text-mutedForeground">
                {item.upvotes ?? 0} upvotes · {item.comment_count ?? 0} comments
              </Text>
            </View>
          )}
        />
      )}
    </Screen>
  );
}
