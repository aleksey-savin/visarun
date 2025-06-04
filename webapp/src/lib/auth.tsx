import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

export type UserRole = 'client' | 'manager' | 'admin';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (tokens: AuthTokens, email: string, role: UserRole, id: string) => void;
  logout: () => void;
  getAccessToken: () => string | null;
  userEmail: string | null;
  userRole: UserRole | null;
  userId: string | null;
  refreshAuth: () => Promise<boolean>;
  isAuthLoading: boolean;
  isPasswordChangeRequired: boolean;
  passwordChangeCompleted: () => void;
  user: { id: string; email: string; role: UserRole } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Keys for storing auth state in localStorage
const ACCESS_TOKEN_KEY = 'visarun_access_token';
const REFRESH_TOKEN_KEY = 'visarun_refresh_token';
const USER_DATA_KEY = 'visarun_user_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isPasswordChangeRequired, setIsPasswordChangeRequired] = useState(false);

  // Function to get and validate the stored access token
  const getAccessToken = (): string | null => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        // Token has expired
        return null;
      }

      return token;
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  };

  // Check token and user data on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsAuthLoading(true);

      try {
        const token = getAccessToken();
        const userData = localStorage.getItem(USER_DATA_KEY);

        if (token && userData) {
          const parsedUserData = JSON.parse(userData);
          setIsAuthenticated(true);
          setUserEmail(parsedUserData.email);
          setUserRole(parsedUserData.role);
          setUserId(parsedUserData.id);
        } else {
          // Try to refresh the token if we have a refresh token
          const refreshSuccess = await refreshAuth();

          if (!refreshSuccess) {
            // Clear auth state if refresh failed
            clearAuthState();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthState();
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  // Function to refresh auth using the refresh token
  const refreshAuth = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    try {
      // Call the refresh token endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trpc/refreshToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: {
            refreshToken,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const result = await response.json();
      const { accessToken, user } = result.result.data;

      // Store the new access token and user data
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(
        USER_DATA_KEY,
        JSON.stringify({
          id: user.id,
          email: user.email,
          role: user.role,
        })
      );

      setIsAuthenticated(true);
      setUserEmail(user.email);
      setUserRole(user.role);
      setUserId(user.id);

      return true;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      clearAuthState();
      return false;
    }
  };

  const clearAuthState = () => {
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole(null);
    setUserId(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  };

  const login = (tokens: AuthTokens, email: string, role: UserRole, id: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(
      USER_DATA_KEY,
      JSON.stringify({
        id,
        email,
        role,
      })
    );

    setIsAuthenticated(true);
    setUserEmail(email);
    setUserRole(role);
    setUserId(id);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // Call logout endpoint to invalidate the refresh token on the server
    if (refreshToken) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/trpc/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: {
              refreshToken,
            },
          }),
        });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }

    clearAuthState();
  };

  // Check if password change is required (for default admin)
  useEffect(() => {
    if (isAuthenticated && userEmail === 'admin@admin.com' && userRole === 'admin') {
      setIsPasswordChangeRequired(true);
    }
  }, [isAuthenticated, userEmail, userRole]);

  // Function to mark password change as completed
  const passwordChangeCompleted = () => {
    setIsPasswordChangeRequired(false);
  };

  // Create user object for easier access
  const user =
    isAuthenticated && userEmail && userRole && userId
      ? { id: userId, email: userEmail, role: userRole as UserRole }
      : null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        getAccessToken,
        userEmail,
        userRole,
        userId,
        refreshAuth,
        isAuthLoading,
        isPasswordChangeRequired,
        passwordChangeCompleted,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
