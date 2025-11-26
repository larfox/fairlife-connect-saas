import React, { createContext, useContext } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface UserContextType {
  user: SupabaseUser | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ user: SupabaseUser | null; children: React.ReactNode }> = ({ user, children }) => {
  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
