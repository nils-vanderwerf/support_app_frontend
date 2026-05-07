import { createContext, useState, useContext, useEffect} from "react";
import { ReactNode } from 'react'
import axiosInstance from "../api/axiosConfig";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  role: string | null;
  is_admin: boolean;
}

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  age: number;
  gender: string;
  phone: string;
  location: string;
  bio: string;
  health_conditions: string;
  medication: string;
  allergies: string;
  emergency_contact_first_name: string;
  emergency_contact_last_name: string;
  emergency_contact_phone: string;
  email: string;
}

export interface Specialization {
  id: number;
  name: string;
}

export interface SupportWorker {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  age: number;
  availability: string;
  bio: string;
  email: string;
  experience: string;
  location: string;
  gender: string;
  phone: string;
  emergency_contact_first_name: string;
  emergency_contact_last_name: string;
  emergency_contact_phone: string;
  specializations?: Specialization[];
  status?: string;
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
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [supportWorker, setSupportWorker] = useState<SupportWorker | null>(null);
  const [loading, setLoading] = useState(true)
  useEffect(() => {
      const fetchData = async () => {
          try {
            const response = await axiosInstance.get('/user');
            setUser(response.data.user);
            setClient(response.data.client)
            setSupportWorker(response.data.support_worker)
            setLoading(false)
          } catch (error) {
            console.error('Error fetching data: ', error);
            setLoading(false)
          }
        };
        fetchData();
    }, []);
  return (
    <AuthContext.Provider value={{ user, setUser, client, setClient, supportWorker, setSupportWorker, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};