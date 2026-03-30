import React from 'react'
import { Outlet } from 'react-router-dom'

const AuthLayout = ({children}) => {
    return (
        <>
            <h1>This is authentication section</h1>
            <Outlet />
        </>
    )
}

export default AuthLayout