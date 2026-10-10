import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FaRegPenToSquare, FaBolt, FaChartLine, FaShieldHalved } from "react-icons/fa6";

const AuthLayout = () => {
    return (
        <div className="auth-wrapper">
            <header className="auth-mobile-header">
                <div className="auth-brand">
                    <div className="auth-brand-icon">
                        <FaRegPenToSquare />
                    </div>
                    <span className="auth-brand-name">Job Tracker</span>
                </div>
            </header>

            <div className="auth-container">
                {/* Left Hero Side (Desktop) */}
                <aside className="auth-hero">
                    <div className="auth-brand">
                        <div className="auth-brand-icon">
                            <FaRegPenToSquare />
                        </div>
                        <span className="auth-brand-name">Job Tracker</span>
                    </div>

                    <div className="auth-hero-content">
                        <span className="auth-hero-tag">CAREER PLATFORM</span>
                        <h1 className="auth-hero-title">
                            Supercharge your job search with intelligence & speed.
                        </h1>
                        <p className="auth-hero-subtitle">
                            Automate daily discovery, organize every stage of your pipeline, and generate personalized pitches in seconds.
                        </p>

                        <div className="auth-hero-features">
                            <div className="auth-feature-item">
                                <div className="auth-feature-icon">
                                    <FaBolt />
                                </div>
                                <div className="auth-feature-text">
                                    <strong>Curated Action Queue</strong>
                                    <p>Playwright-verified fresh 0–2 YOE roles updated daily.</p>
                                </div>
                            </div>

                            <div className="auth-feature-item">
                                <div className="auth-feature-icon">
                                    <FaChartLine />
                                </div>
                                <div className="auth-feature-text">
                                    <strong>Live Pipeline Analytics</strong>
                                    <p>Visual status tracking, response rates, and interview stages.</p>
                                </div>
                            </div>

                            <div className="auth-feature-item">
                                <div className="auth-feature-icon">
                                    <FaShieldHalved />
                                </div>
                                <div className="auth-feature-text">
                                    <strong>Strict India Roles Only</strong>
                                    <p>Clean database with automated duplicate & stale link removal.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="auth-hero-footer">
                        <span className="auth-stat-pill">✨ 350+ Tracked Applications</span>
                        <span className="auth-stat-pill">🛡️ Google Secure Auth</span>
                    </div>
                </aside>

                {/* Right Form Card */}
                <main className="auth-card-panel">
                    <div className="auth-card">
                        <Outlet />
                    </div>
                </main>
            </div>

            <footer className="auth-page-footer">
                <p>© {new Date().getFullYear()} Job Tracker • Streamlining frontend & engineering careers.</p>
            </footer>
        </div>
    );
};

export default AuthLayout;