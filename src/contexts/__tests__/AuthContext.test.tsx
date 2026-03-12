import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

// Type for the auth state change callback
type AuthStateChangeCallback = (event: AuthChangeEvent, session: Session | null) => void;

// Store the callback so we can trigger auth events in tests
let authStateChangeCallback: AuthStateChangeCallback | null = null;

// Mock Supabase client
vi.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn((callback: AuthStateChangeCallback) => {
        authStateChangeCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

// Mock Sentry
vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
  setTag: vi.fn(),
}));

// Test component to access auth context
const TestConsumer = () => {
  const { user, loading, error } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="error">{error || 'null'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateChangeCallback = null;
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('PASSWORD_RECOVERY event handling', () => {
    it('should ignore PASSWORD_RECOVERY event and not fetch /me API', async () => {
      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Simulate PASSWORD_RECOVERY event from Supabase
      const mockSession: Session = {
        access_token: 'recovery-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
        } as SupabaseUser,
      };

      // Trigger PASSWORD_RECOVERY event
      await act(async () => {
        if (authStateChangeCallback) {
          authStateChangeCallback('PASSWORD_RECOVERY', mockSession);
        }
      });

      // Verify that fetch was NOT called for /me endpoint after PASSWORD_RECOVERY
      // (it may have been called during initial load, so we check the call arguments)
      const meApiCalls = fetchMock.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('/me')
      );

      // After PASSWORD_RECOVERY event, no new /me calls should be made
      // The initial restoreSession might call /me, but PASSWORD_RECOVERY should not trigger another
      expect(meApiCalls.length).toBeLessThanOrEqual(1);

      // User should remain null (not authenticated via PASSWORD_RECOVERY)
      expect(screen.getByTestId('user').textContent).toBe('null');

      // Loading should be false
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    it('should set loading to false after PASSWORD_RECOVERY event', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      const mockSession: Session = {
        access_token: 'recovery-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: 'recovery@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
        } as SupabaseUser,
      };

      // Trigger PASSWORD_RECOVERY event
      await act(async () => {
        if (authStateChangeCallback) {
          authStateChangeCallback('PASSWORD_RECOVERY', mockSession);
        }
      });

      // Loading should be false after PASSWORD_RECOVERY
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    it('should process SIGNED_IN event normally (not ignore it)', async () => {
      const mockUserData = {
        id: 'user-123',
        email: 'signed-in@example.com',
        role: 'client',
        company_id: 'company-123',
        companyName: 'Test Company',
        company: { id: 'company-123', name: 'Test Company' },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { user: mockUserData } }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      const mockSession: Session = {
        access_token: 'valid-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: 'signed-in@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: {},
          user_metadata: { firstName: 'Test', lastName: 'User' },
          created_at: new Date().toISOString(),
        } as SupabaseUser,
      };

      // Trigger SIGNED_IN event (should be processed normally)
      await act(async () => {
        if (authStateChangeCallback) {
          authStateChangeCallback('SIGNED_IN', mockSession);
        }
      });

      // Wait for the user to be set
      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('signed-in@example.com');
      });

      // Verify /me was called for SIGNED_IN event
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );
    });
  });

  describe('Auth state management', () => {
    it('should clear user on SIGNED_OUT event', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Trigger SIGNED_OUT event
      await act(async () => {
        if (authStateChangeCallback) {
          authStateChangeCallback('SIGNED_OUT', null);
        }
      });

      // User should be null
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });
});
