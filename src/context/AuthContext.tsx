// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: { username: string } | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin credentials (in production, this should be in a secure backend)
const ADMIN_CREDENTIALS = {
  username: 'Thangatamil',
  password: '7000pannai'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed && parsed.username === ADMIN_CREDENTIALS.username) {
          setIsAuthenticated(true);
          setUser({ username: parsed.username });
        }
      } catch (error) {
        console.error('Error parsing stored auth:', error);
        localStorage.removeItem('adminAuth');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setIsAuthenticated(true);
      setUser({ username });
      localStorage.setItem('adminAuth', JSON.stringify({ username, loggedIn: true }));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('adminAuth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};