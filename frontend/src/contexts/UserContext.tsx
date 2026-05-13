import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { UserContext } from './user-context';

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser: handleSetCurrentUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}
