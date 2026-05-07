import { Navigate } from "react-router-dom"
import { useAuth } from '../context/AuthContext' 

interface SecureRouteProps {
  children: React.ReactNode
}
const SecureRoute = ({ children }: SecureRouteProps) => {
  const auth = useAuth()
  if (auth.loading) return null;
  if (!auth.user) return <Navigate to="/login" />;
  if (auth.supportWorker?.status === 'pending') return <Navigate to="/vetting" />;
  return children;
};

export default SecureRoute;;