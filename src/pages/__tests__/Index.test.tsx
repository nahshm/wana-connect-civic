import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Index from '../Index';
import { supabase } from '@/integrations/supabase/client';

jest.mock('@/integrations/supabase/client');
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    session: null,
    profile: null,
    loading: false,
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
}));

describe('Index Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockFrom = jest.fn((table) => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn(() => new Promise(() => {})),
    }));
    (supabase.from as jest.Mock) = mockFrom;
  });

  it('renders loading state initially', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders posts after fetch', async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'communities') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      } else {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [
              {
                id: '1',
                title: 'Test Post',
                content: 'Test content',
                profiles: { id: 'a1', username: 'user1', display_name: 'User One' },
                communities: null,
                officials: null,
                upvotes: 10,
                downvotes: 2,
                comment_count: 5,
                tags: [],
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          }),
        };
      }
    });

    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument();
    });
  });
});
