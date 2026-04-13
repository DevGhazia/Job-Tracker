import React from 'react'
import { Outlet } from 'react-router-dom'
import { FaRegPenToSquare } from "react-icons/fa6";
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export const AppLayout = () => {
    return (
        <main>
            <nav>
                <div className='nav-logo'>
                    <FaRegPenToSquare fontSize="25px"/>
                    <h1>Job Tracker</h1>
                </div>
                <button onClick={()=>signOut(auth)} className='nav-logout'>Logout</button>
            </nav>
            <Outlet />
            <div className="footer"></div>
        </main>
    )
}
