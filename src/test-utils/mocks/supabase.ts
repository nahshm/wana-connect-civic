// Mock user for testing
export const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: { username: 'testuser' },
};

// Mock session for testing
export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockUser,
};

// Mock profile data
export const mockProfile = {
  id: 'test-user-id-123',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: 'https://example.com/avatar.png',
  bio: 'Test bio',
  role: 'citizen',
  is_verified: false,
  created_at: new Date().toISOString(),
  karma: 100,
  post_karma: 50,
  comment_karma: 50,
  badges: ['newcomer'],
  location: 'Nairobi',
  website: null,
  social_links: {},
  expertise: ['civic'],
  is_private: false,
  privacy_settings: {},
  activity_stats: {},
  last_activity: new Date().toISOString(),
  onboarding_completed: true,
};

// Auth state change callback holder
let authStateCallback: ((event: string, session: any) => void) | null = null;

// Create mock Supabase client
export const createMockSupabase = () => {
  const mockFrom = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }),
      maybeSingle: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
    }),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  });

  const mockAuth = {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn((callback) => {
      authStateCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    }),
  };

  return {
    from: mockFrom,
    auth: mockAuth,
    // Helper to trigger auth state changes in tests
    triggerAuthStateChange: (event: string, session: any) => {
      if (authStateCallback) {
        authStateCallback(event, session);
      }
    },
  };
};

export const mockSupabase = createMockSupabase();
