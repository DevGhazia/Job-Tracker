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

    if(user === undefined) return <h2>Authenticating session...</h2>
    
    return user? <>{children}</> : <Navigate to="/auth/login" replace/> 
}
