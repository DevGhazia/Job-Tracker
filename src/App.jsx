import AuthLayout from "./auth/AuthLayout";
import { Routes, Route, replace, useNavigate } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import { Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./components/Dashboard";
import { useEffect } from "react";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export default function App(){
  const navigate = useNavigate();

  useEffect(() => {
    const authListener = onAuthStateChanged(auth, (currentUser) => {
      if(currentUser)
        navigate("/dashboard", {replace: true});
    });
  return () => authListener();
}, [navigate]);

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