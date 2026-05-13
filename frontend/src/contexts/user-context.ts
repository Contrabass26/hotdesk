import { createContext } from 'react';
import type { User } from '../types';

export interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  loading: boolean;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);
