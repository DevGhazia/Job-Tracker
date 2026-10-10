import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from "react-icons/fc";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaCircleCheck } from "react-icons/fa6";
import { BiLoaderAlt, BiErrorCircle } from "react-icons/bi";
import { signInWithGoogle, signUpWithEmail, formatAuthError } from '../utils_firebase';

const Signup = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isEmailLoading, setIsEmailLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState('');

    const handleGoogleSignUp = async () => {
        setErrorMessage('');
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

    const handleEmailSignUp = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!name.trim()) {
            setErrorMessage('Please enter your full name.');
            return;
        }

        if (!email.trim()) {
            setErrorMessage('Please enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match. Please re-enter.');
            return;
        }

        setIsEmailLoading(true);
        try {
            await signUpWithEmail(email, password, name);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setErrorMessage(formatAuthError(err));
        } finally {
            setIsEmailLoading(false);
        }
    };

    return (
        <div className="auth-form-container">
            <div className="auth-header">
                <h2 className="auth-title">Create your account</h2>
                <p className="auth-subtitle">Join Job Tracker to automate and supercharge your search</p>
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

            {/* Google Sign-up Primary Button */}
            <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading || isEmailLoading}
                className="auth-btn-google"
            >
                {isGoogleLoading ? (
                    <>
                        <BiLoaderAlt className="auth-btn-spinner" />
                        <span>Signing up with Google...</span>
                    </>
                ) : (
                    <>
                        <FcGoogle className="auth-google-icon" />
                        <span>Sign up with Google</span>
                    </>
                )}
            </button>

            <div className="auth-divider">
                <span>or sign up with email</span>
            </div>

            {/* Email Registration Form */}
            <form onSubmit={handleEmailSignUp} className="auth-form" noValidate>
                <div className="auth-input-group">
                    <label htmlFor="signup-name" className="auth-label">Full Name</label>
                    <div className="auth-input-wrapper">
                        <FaUser className="auth-field-icon" />
                        <input
                            id="signup-name"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="e.g. Vivek Kumar"
                            autoComplete="name"
                            disabled={isGoogleLoading || isEmailLoading}
                            className="auth-input"
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label htmlFor="signup-email" className="auth-label">Email address</label>
                    <div className="auth-input-wrapper">
                        <FaEnvelope className="auth-field-icon" />
                        <input
                            id="signup-email"
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
                    <label htmlFor="signup-password" className="auth-label">Password</label>
                    <div className="auth-input-wrapper">
                        <FaLock className="auth-field-icon" />
                        <input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="Minimum 6 characters"
                            autoComplete="new-password"
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
                    {password && password.length < 6 && (
                        <span className="auth-hint-text">
                            Password must be at least 6 characters.
                        </span>
                    )}
                </div>

                <div className="auth-input-group">
                    <label htmlFor="signup-confirm-password" className="auth-label">Confirm Password</label>
                    <div className="auth-input-wrapper">
                        <FaLock className="auth-field-icon" />
                        <input
                            id="signup-confirm-password"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                            disabled={isGoogleLoading || isEmailLoading}
                            className="auth-input"
                            required
                        />
                    </div>
                    {confirmPassword && password && confirmPassword === password && (
                        <span className="auth-match-text">
                            <FaCircleCheck /> Passwords match
                        </span>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isGoogleLoading || isEmailLoading}
                    className="auth-btn-primary"
                >
                    {isEmailLoading ? (
                        <>
                            <BiLoaderAlt className="auth-btn-spinner" />
                            <span>Creating account...</span>
                        </>
                    ) : (
                        <>
                            <span>Create Account</span>
                            <FaArrowRight className="auth-btn-arrow" />
                        </>
                    )}
                </button>
            </form>

            <div className="auth-footer">
                <span>Already have an account? </span>
                <Link to="/auth/login" className="auth-link-bold">
                    Sign in
                </Link>
            </div>
        </div>
    );
};

export default Signup;