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

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  age: number;
  allergies: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address: string;
  gender: string;
  health_conditions: string;
  medication: string;
  phone: string;
}

interface SupportWorker {
  id: number;
  first_name: string;
  middle_name:  string | null;
  last_name: string;
  age: number;
  availability: string; 
  bio: string;
  email: string;
  experience: string;
  location: string;
  gender: string;
  phone: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  client: Client | null;
  setClient: (client: Client | null) => void;
  supportWorker: SupportWorker | null;
  setSupportWorker: (supportWorker: SupportWorker| null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [supportWorker, setSupportWorker] = useState<SupportWorker | null>(null);
  return (
    <AuthContext.Provider value={{ user, setUser, client, setClient, supportWorker, setSupportWorker }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};