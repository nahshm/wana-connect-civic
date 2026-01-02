import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { createMockSession, createMockProfile } from '@/test-utils/fixtures/users';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Helper function to wait for async updates
const waitFor = async (callback: () => void, timeout = 1000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      callback();
      return;
    } catch {
      await new Promise(r => setTimeout(r, 50));
    }
  }
  callback();
};

// Mock toast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Create mock functions at module scope so they can be referenced in jest.mock
const mockGetSession = jest.fn();
const mockSignUp = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockFrom = jest.fn();

// Auth state listener reference - stored globally for test access
let authStateListener: ((event: string, session: any) => void) | null = null;

// Mock the supabase client - factory function is hoisted
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      get getSession() { return mockGetSession; },
      get signUp() { return mockSignUp; },
      get signInWithPassword() { return mockSignInWithPassword; },
      get signOut() { return mockSignOut; },
      get onAuthStateChange() { return mockOnAuthStateChange; },
    },
    get from() { return mockFrom; },
  },
}));

// Create a convenience object that references the mock functions
const mockSupabase = {
  auth: {
    getSession: mockGetSession,
    signUp: mockSignUp,
    signInWithPassword: mockSignInWithPassword,
    signOut: mockSignOut,
    onAuthStateChange: mockOnAuthStateChange,
  },
  from: mockFrom,
};

// Wrapper component for testing
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStateListener = null;

    // Set up onAuthStateChange to capture the callback
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateListener = callback;
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    });

    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Initial State', () => {
    it('starts with loading true and null user/session', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.profile).toBeNull();

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('checks for existing session on mount', async () => {
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      });
    });

    it('sets up auth state listener on mount', async () => {
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
      });
    });

    it('loads existing session if present', async () => {
      const mockSession = createMockSession();
      const mockProfile = createMockProfile();

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).not.toBeNull();
        expect(result.current.session).not.toBeNull();
      });
    });
  });

  describe('Sign Up', () => {
    it('successfully signs up a new user', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'test-id' }, session: createMockSession() },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult: any;
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123', 'testuser');
      });

      expect(signUpResult.error).toBeNull();
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: expect.objectContaining({
          data: { username: 'testuser' },
        }),
      });
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Welcome to ama!',
        })
      );
    });

    it('handles already registered email error', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult: any;
      await act(async () => {
        signUpResult = await result.current.signUp('existing@example.com', 'password123');
      });

      expect(signUpResult.error).not.toBeNull();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Account exists',
        })
      );
    });

    it('handles generic sign up error', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Network error' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult: any;
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123');
      });

      expect(signUpResult.error).not.toBeNull();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Sign up failed',
        })
      );
    });

    it('uses email prefix as username when not provided', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'test-id' }, session: createMockSession() },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp('john.doe@example.com', 'password123');
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: { username: 'john.doe' },
          }),
        })
      );
    });
  });

  describe('Sign In', () => {
    it('successfully signs in a user', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'test-id' }, session: createMockSession() },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123');
      });

      expect(signInResult.error).toBeNull();
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Welcome back!',
        })
      );
    });

    it('handles invalid credentials error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult: any;
      await act(async () => {
        signInResult = await result.current.signIn('wrong@example.com', 'wrongpassword');
      });

      expect(signInResult.error).not.toBeNull();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Sign in failed',
        })
      );
    });
  });

  describe('Sign Out', () => {
    it('successfully signs out a user', async () => {
      const mockSession = createMockSession();
      const mockProfile = createMockProfile();

      // Start with an authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      });
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Signed out',
        })
      );
    });

    it('handles sign out error', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Sign out failed',
        })
      );
    });
  });

  describe('Profile Fetching', () => {
    it('fetches profile after authentication', async () => {
      const mockSession = createMockSession();
      const mockProfile = createMockProfile();

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Wait for the profile fetch to be triggered
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      });
    });

    it('handles missing profile gracefully', async () => {
      const mockSession = createMockSession();

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Wait for profile fetch attempt
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      });

      // Should not crash, profile should be null
      expect(result.current.profile).toBeNull();

      consoleSpy.mockRestore();
    });

    it('handles profile fetch error', async () => {
      const mockSession = createMockSession();

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            }),
          }),
        }),
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Wait for profile fetch attempt
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      });

      // Should not crash
      expect(result.current.profile).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('Refresh Profile', () => {
    it('refreshes profile when user is authenticated', async () => {
      const mockSession = createMockSession();
      const mockProfile = createMockProfile();

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Wait for initial profile fetch
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      });

      // Clear previous calls
      mockSupabase.from.mockClear();

      await act(async () => {
        await result.current.refreshProfile();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('does nothing when user is not authenticated', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockSupabase.from.mockClear();

      await act(async () => {
        await result.current.refreshProfile();
      });

      // from should not be called since there's no user
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Auth State Changes', () => {
    it('updates state on SIGNED_IN event', async () => {
      const mockSession = createMockSession();
      const mockProfile = createMockProfile();

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger auth state change
      await act(async () => {
        if (authStateListener) {
          authStateListener('SIGNED_IN', mockSession);
        }
      });

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
        expect(result.current.session).not.toBeNull();
      });
    });

    it('clears state on SIGNED_OUT event', async () => {
      const mockSession = createMockSession();
      const mockProfile = createMockProfile();

      // Start authenticated
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).not.toBeNull();
      });

      // Trigger sign out
      await act(async () => {
        if (authStateListener) {
          authStateListener('SIGNED_OUT', null);
        }
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
        expect(result.current.profile).toBeNull();
      });
    });
  });
});
