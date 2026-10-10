import AuthLayout from "./auth/AuthLayout";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./components/Dashboard";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export default function App(){
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authListener = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && location.pathname.startsWith("/auth")) {
        navigate("/dashboard", { replace: true });
      }
    });
    return () => authListener();
  }, [navigate, location.pathname]);

  return(
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="login" replace/>} /> 
        <Route path="login" element={<Login />}/>
        <Route path="signup" element={<Signup />}/>
      </Route>
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace/>} />
        <Route path="dashboard" element={<Dashboard/>}/>
      </Route>
    </Routes>
  )
}