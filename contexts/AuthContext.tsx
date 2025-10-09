
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, Role, AuthContextType } from '../types';
import { LOGGED_IN_USER_KEY } from '../constants';
import * as db from '../services/db';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(LOGGED_IN_USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem(LOGGED_IN_USER_KEY);
    }
    db.initializeDb(); // Ensure DB has default admin
  }, []);

  const login = useCallback(async (username: string, password: string, role: Role): Promise<boolean> => {
    const loggedInUser = await db.authenticateUser(username, password, role);
    if (loggedInUser) {
      if (role === Role.STUDENT && loggedInUser.status !== 'approved') {
        alert('Your account is pending teacher approval.');
        return false;
      }
      if (role === Role.TEACHER && loggedInUser.status !== 'approved') {
        alert('Your account is pending admin approval.');
        return false;
      }
      const userToStore = { ...loggedInUser };
      delete userToStore.password;
      setUser(userToStore);
      localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(userToStore));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(LOGGED_IN_USER_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
