import { Navigate } from "react-router-dom"
import { useAuth } from '../context/AuthContext' 

interface SecureRouteProps {
  children: React.ReactNode
}
const SecureRoute = ({ children }: SecureRouteProps) => {
  const auth = useAuth()
  if (auth.loading ) {
    return null
  } else if (auth?.user) {
    return children;
  } else {
    return <Navigate to="/login" />
  }
};

export default SecureRoute;;