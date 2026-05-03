import { Navigate } from "react-router-dom";

function ProtectedRoute({ user, children }) {
  return user ? children : <Navigate to="/auth/login" replace />;
}

export default ProtectedRoute;
