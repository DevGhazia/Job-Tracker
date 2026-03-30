import handleGoogleLogin from "../utils_firebase"

const Login = () => {
    return (
        <>
            <div>This is the login page</div>
            <button onClick={handleGoogleLogin}>Google Login</button>
        </>
    )
}

export default Login