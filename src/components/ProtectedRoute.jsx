import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export const ProtectedRoute = ({children}) => {
    const [user, setUser] = useState(undefined);

    useEffect(()=>{
        const authStateListner = onAuthStateChanged(auth, (currentUser)=>{
            setUser(currentUser);
        });
        return ()=> authStateListner();
    },[]);

    if(user === undefined) {
        return (
            <div className="auth-loading-screen">
                <div className="auth-loading-spinner" />
                <p className="auth-loading-text">Authenticating session...</p>
            </div>
        );
    }
    
    return user? <>{children}</> : <Navigate to="/auth/login" replace/> 
}
