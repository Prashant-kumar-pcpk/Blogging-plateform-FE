import { Navigate } from "react-router-dom";

function AuthPage({ appState }) {
  return <Navigate to={appState.user ? "/dashboard" : "/auth/login"} replace />;
}

export default AuthPage;
