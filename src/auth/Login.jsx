import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from "react-icons/fc";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa6";
import { BiLoaderAlt, BiErrorCircle, BiCheckCircle } from "react-icons/bi";
import { signInWithGoogle, signInWithEmail, resetPassword, formatAuthError } from '../utils_firebase';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [isResetLoading, setIsResetLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const handleGoogleSignIn = async () => {
        setErrorMessage('');
        setSuccessMessage('');
        setIsGoogleLoading(true);
        try {
            await signInWithGoogle();
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setErrorMessage(formatAuthError(err));
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleEmailSignIn = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!email.trim() || !password) {
            setErrorMessage('Please fill in both email and password.');
            return;
        }

        setIsEmailLoading(true);
        try {
            await signInWithEmail(email, password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setErrorMessage(formatAuthError(err));
        } finally {
            setIsEmailLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const targetEmail = resetEmail.trim() || email.trim();
        if (!targetEmail) {
            setErrorMessage('Please provide your email address to receive the reset link.');
            return;
        }

        setIsResetLoading(true);
        try {
            await resetPassword(targetEmail);
            setSuccessMessage(`Password reset link sent to ${targetEmail}. Please check your inbox.`);
            setShowResetModal(false);
            setResetEmail('');
        } catch (err) {
            setErrorMessage(formatAuthError(err));
        } finally {
            setIsResetLoading(false);
        }
    };

    return (
        <div className="auth-form-container">
            <div className="auth-header">
                <h2 className="auth-title">Welcome back</h2>
                <p className="auth-subtitle">Sign in to manage your applications and action queue</p>
            </div>

            {errorMessage && (
                <div className="auth-alert auth-alert-error" role="alert">
                    <BiErrorCircle className="auth-alert-icon" />
                    <span className="auth-alert-text">{errorMessage}</span>
                    <button 
                        type="button" 
                        className="auth-alert-close" 
                        onClick={() => setErrorMessage('')}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            {successMessage && (
                <div className="auth-alert auth-alert-success" role="alert">
                    <BiCheckCircle className="auth-alert-icon" />
                    <span className="auth-alert-text">{successMessage}</span>
                    <button 
                        type="button" 
                        className="auth-alert-close" 
                        onClick={() => setSuccessMessage('')}
                        aria-label="Dismiss message"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Google Sign-in Primary Button */}
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isEmailLoading}
                className="auth-btn-google"
            >
                {isGoogleLoading ? (
                    <>
                        <BiLoaderAlt className="auth-btn-spinner" />
                        <span>Signing in with Google...</span>
                    </>
                ) : (
                    <>
                        <FcGoogle className="auth-google-icon" />
                        <span>Sign in with Google</span>
                    </>
                )}
            </button>

            <div className="auth-divider">
                <span>or continue with email</span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailSignIn} className="auth-form" noValidate>
                <div className="auth-input-group">
                    <label htmlFor="login-email" className="auth-label">Email address</label>
                    <div className="auth-input-wrapper">
                        <FaEnvelope className="auth-field-icon" />
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="name@example.com"
                            autoComplete="email"
                            disabled={isGoogleLoading || isEmailLoading}
                            className="auth-input"
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <div className="auth-label-row">
                        <label htmlFor="login-password" className="auth-label">Password</label>
                        <button
                            type="button"
                            onClick={() => {
                                setResetEmail(email);
                                setShowResetModal(!showResetModal);
                                setErrorMessage('');
                            }}
                            className="auth-forgot-link"
                        >
                            Forgot password?
                        </button>
                    </div>
                    <div className="auth-input-wrapper">
                        <FaLock className="auth-field-icon" />
                        <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={isGoogleLoading || isEmailLoading}
                            className="auth-input"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="auth-password-toggle"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                </div>

                {/* Inline Forgot Password Box */}
                {showResetModal && (
                    <div className="auth-reset-box">
                        <p className="auth-reset-instructions">
                            Enter your email to receive a password recovery link:
                        </p>
                        <div className="auth-reset-row">
                            <input
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="auth-input auth-input-compact"
                            />
                            <button
                                type="button"
                                onClick={handlePasswordReset}
                                disabled={isResetLoading}
                                className="auth-btn-secondary"
                            >
                                {isResetLoading ? "Sending..." : "Send Link"}
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isGoogleLoading || isEmailLoading}
                    className="auth-btn-primary"
                >
                    {isEmailLoading ? (
                        <>
                            <BiLoaderAlt className="auth-btn-spinner" />
                            <span>Signing in...</span>
                        </>
                    ) : (
                        <>
                            <span>Sign In</span>
                            <FaArrowRight className="auth-btn-arrow" />
                        </>
                    )}
                </button>
            </form>

            <div className="auth-footer">
                <span>Don't have an account? </span>
                <Link to="/auth/signup" className="auth-link-bold">
                    Create account
                </Link>
            </div>
        </div>
    );
};

export default Login;