import { Navigate } from "react-router-dom"
import { useAuth } from '../context/AuthContext' 

interface SecureRouteProps {
  children: React.ReactNode
}
const SecureRoute = ({ children }: SecureRouteProps) => {
  const auth = useAuth()
  return auth?.user ? children : <Navigate to="/login" />;
};

export default SecureRoute;;