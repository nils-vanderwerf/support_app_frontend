import { createContext, useState, useContext} from "react";
import { ReactNode } from 'react'

interface User {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  role: string | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};