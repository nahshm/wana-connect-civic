import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '@shared/integrations/supabase/types';

const SUPABASE_URL = 'https://zcnjpczplkbdmmovlrtv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbmpwY3pwbGtiZG1tb3ZscnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDQyNTMsImV4cCI6MjA3MzI4MDI1M30.NOgtKdqBtqZXFaTkypW0dTfYuPNW-nge7aiqmSeft20';

/**
 * Supabase auth tokens can exceed the 2048-byte SecureStore value limit,
 * so the session is chunked across multiple secure entries.
 */
const CHUNK_SIZE = 1800;

const secureStorage = {
  async getItem(key: string) {
    const head = await SecureStore.getItemAsync(key);
    if (head === null) return null;
    if (!head.startsWith('__chunks__:')) return head;

    const count = Number(head.split(':')[1]);
    let value = '';
    for (let i = 0; i < count; i += 1) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part === null) return null;
      value += part;
    }
    return value;
  },
  async setItem(key: string, value: string) {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(key, `__chunks__:${count}`);
    for (let i = 0; i < count; i += 1) {
      await SecureStore.setItemAsync(
        `${key}.${i}`,
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    }
  },
  async removeItem(key: string) {
    const head = await SecureStore.getItemAsync(key);
    if (head?.startsWith('__chunks__:')) {
      const count = Number(head.split(':')[1]);
      for (let i = 0; i < count; i += 1) {
        await SecureStore.deleteItemAsync(`${key}.${i}`);
      }
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : secureStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
