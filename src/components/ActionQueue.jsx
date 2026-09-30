import { useState } from "react";
import { HiLocationMarker, HiCalendar, HiLightningBolt } from "react-icons/hi";
import { FaBusinessTime } from "react-icons/fa6";
import { RiDeleteBin2Line } from "react-icons/ri";
import { BiSolidMessageSquareCheck } from "react-icons/bi";
import {
    FiChevronDown,
    FiChevronUp,
    FiExternalLink,
    FiCopy,
    FiCheck,
    FiMaximize2,
    FiMinimize2,
    FiDollarSign,
    FiCheckCircle,
    FiAward,
    FiStar,
    FiZap
} from "react-icons/fi";
import { ACTIONS, formateDate, formatLocation, formatExperienceTag } from "../constants";
import CompanyLogo from "./CompanyLogo";

const ActionQueue = ({ queueList = [], onMarkApplied, onDelete, onClearAll }) => {
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [copiedPitchId, setCopiedPitchId] = useState(null);

    if (!queueList || queueList.length === 0) return null;

    function getPortalBadgeColor(portal = "") {
        const p = portal.toLowerCase();
        if (p.includes("wellfound") || p.includes("angellist")) return "badge-wellfound";
        if (p.includes("instahyre")) return "badge-instahyre";
        if (p.includes("linkedin")) return "badge-linkedin";
        if (p.includes("naukri")) return "badge-naukri";
        if (p.includes("cutshort") || p.includes("hirist")) return "badge-cutshort";
        if (p.includes("workday")) return "badge-workday";
        if (p.includes("greenhouse") || p.includes("lever") || p.includes("ashby")) return "badge-ats";
        return "badge-default";
    }

    const toggleExpand = (id, e) => {
        if (e) e.stopPropagation();
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleExpandAll = () => {
        setExpandedIds(new Set(queueList.map((a) => a.id)));
    };

    const handleCollapseAll = () => {
        setExpandedIds(new Set());
    };

    const allExpanded = queueList.length > 0 && expandedIds.size === queueList.length;

    const handleCopyPitch = (id, pitchText, e) => {
        if (e) e.stopPropagation();
        if (!pitchText) return;
        navigator.clipboard.writeText(pitchText);
        setCopiedPitchId(id);
        setTimeout(() => {
            setCopiedPitchId((prev) => (prev === id ? null : prev));
        }, 2000);
    };

    const getMandatorySkills = (app) => {
        if (app.mandatoryRequirements && app.mandatoryRequirements.length > 0) {
            return app.mandatoryRequirements;
        }
        return ["React.js", "TypeScript", "JavaScript (ES6+)", "HTML5 & CSS3", "REST APIs"];
    };

    const getBonusSkills = (app) => {
        if (app.niceToHave && app.niceToHave.length > 0) {
            return app.niceToHave;
        }
        return ["Next.js", "Tailwind CSS", "Redux / Zustand", "Jest / Unit Testing"];
    };

    return (
        <section className="action-queue-section">
            <div className="action-queue-header">
                <div className="list-heading-text">
                    <div className="section-title-wrapper">
                        <HiLightningBolt className="section-title-icon queue-title-icon" />
                        <h2>Action Queue</h2>
                    </div>
                    <p className="action-queue-subtitle">
                        {queueList.length} {queueList.length === 1 ? "job needs" : "jobs need"} your 1-click review & apply
                    </p>
                </div>
                <div className="queue-header-actions">
                    <button
                        type="button"
                        className="dm-toggle-all-btn queue-toggle-all-btn"
                        onClick={allExpanded ? handleCollapseAll : handleExpandAll}
                        title={allExpanded ? "Collapse all job details" : "Expand all job details"}
                    >
                        {allExpanded ? (
                            <>
                                <FiMinimize2 /> Collapse All
                            </>
                        ) : (
                            <>
                                <FiMaximize2 /> Expand All
                            </>
                        )}
                    </button>
                    <span className="queue-count-pill">{queueList.length} Pending</span>
                    {onClearAll && (
                        <button
                            type="button"
                            className="queue-clear-all-btn"
                            onClick={onClearAll}
                            title="Dismiss and clear all queued applications"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            <div className="action-queue-list">
                {queueList.map((app) => {
                    const isExpanded = expandedIds.has(app.id);
                    const isPitchCopied = copiedPitchId === app.id;
                    const mandatorySkills = getMandatorySkills(app);
                    const bonusSkills = getBonusSkills(app);
                    const applyLink = app.directApplyUrl || app.jobUrl;

                    // ── Auto Apply button state ────────────────────────────
                    // "open_form"  → 🤖 Auto Apply button (Greenhouse/Lever/Ashby)
                    // "linkedin"   → Open on LinkedIn ↗ (no bot, just redirects)
                    // "login_wall" → Apply ↗ (requires login, no auto)
                    // "unknown"    → Apply ↗ (safe fallback)
                    const autoMode = app.autoApplyMode || "unknown";
                    const isAutoApplyEligible = autoMode === "open_form";

                    return (
                        <div
                            className={`action-queue-row-container ${isExpanded ? "queue-row-expanded" : "queue-row-collapsed"}`}
                            key={app.id}
                        >
                            {/* 1. Minimal Horizontal Row Bar (Default View) */}
                            <div
                                className="action-queue-row card clickable-row"
                                onClick={() => toggleExpand(app.id)}
                                title="Click to view full job requirements & pitch"
                            >
                                {/* Left: Logo & Company / Role */}
                                <div className="row-top queue-row-main">
                                    <div className="cell-logo-container">
                                        <CompanyLogo logo={app.logo} company={app.company} />
                                    </div>
                                    <div className="cell-name">
                                        <div className="queue-row-headline">
                                            <h3>{app.company}</h3>
                                            {app.portalName && (
                                                <span className={`portal-badge ${getPortalBadgeColor(app.portalName)}`}>
                                                    {app.portalName}
                                                </span>
                                            )}
                                        </div>
                                        <span className="cell-name-span">{app.role}</span>
                                    </div>
                                </div>

                                {/* Right: Meta badges & Actions */}
                                <div className="queue-row-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="row-meta queue-row-meta">
                                        <div className="tag-container">
                                            <HiLocationMarker className="tag-icon" />
                                            <span>{formatLocation(app.location)}</span>
                                        </div>
                                        <div className="tag-container">
                                            <FaBusinessTime className="tag-icon" />
                                            <span>{formatExperienceTag(app.experience)}</span>
                                        </div>
                                        <div className="tag-container queue-date-tag">
                                            <HiCalendar className="tag-icon" />
                                            <span>{formateDate(app.date)}</span>
                                        </div>
                                    </div>

                                    <div className="row-bottom queue-row-actions">
                                        {/* Expand / Details Toggle Button */}
                                        <button
                                            type="button"
                                            className={`queue-dropdown-toggle-btn ${isExpanded ? "active" : ""}`}
                                            onClick={(e) => toggleExpand(app.id, e)}
                                            title={isExpanded ? "Hide job requirements" : "View job requirements & pitch"}
                                        >
                                            <span>{isExpanded ? "Hide" : "Details"}</span>
                                            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                        </button>

                                        {/* ── Smart Apply Button (3 states) ────────────── */}
                                        {autoMode === "open_form" && applyLink && (
                                            // 🤖 Auto Apply — Greenhouse / Lever / Ashby open form
                                            <a
                                                href={applyLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="queue-auto-apply-btn"
                                                title={`Auto-fill your profile on ${app.autoApplyPlatform || "ATS"} — open form, no login needed`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                🤖 <span>Auto Apply</span>
                                            </a>
                                        )}

                                        {autoMode === "linkedin" && applyLink && (
                                            // LinkedIn — just redirect, no bot
                                            <a
                                                href={applyLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="dm-compact-link-btn queue-linkedin-btn"
                                                title="Open on LinkedIn (Easy Apply or Direct Apply)"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <FiExternalLink /> <span>LinkedIn ↗</span>
                                            </a>
                                        )}

                                        {(autoMode === "login_wall" || autoMode === "unknown") && applyLink && (
                                            // Login required or unknown — plain redirect
                                            <a
                                                href={applyLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="dm-compact-link-btn queue-apply-link-btn"
                                                title={`Open application page${app.autoApplyPlatform ? ` on ${app.autoApplyPlatform}` : ""}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <FiExternalLink /> <span>Apply ↗</span>
                                            </a>
                                        )}

                                        {/* Mark as Applied */}
                                        <button
                                            type="button"
                                            className="basic cell-status status-applied action-queue-apply-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMarkApplied(app.id);
                                            }}
                                            title="Mark as Applied"
                                        >
                                            <BiSolidMessageSquareCheck className="apply-btn-icon" />
                                            <span>Applied</span>
                                        </button>

                                        {/* Dismiss / Delete Button */}
                                        <button
                                            type="button"
                                            className="delete-button queue-delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(app.id, ACTIONS.DELETE, app.company);
                                            }}
                                            title="Dismiss from queue"
                                        >
                                            <RiDeleteBin2Line className="delete-svg" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Expandable Drawer (Revealed on 'Details ▾' click) */}
                            {isExpanded && (
                                <div className="queue-row-expanded-drawer">
                                    {/* Overview Snippet if available */}
                                    {app.overview && (
                                        <div className="queue-overview-box">
                                            <span className="queue-section-label">
                                                <FiZap className="queue-label-icon" /> Role Overview
                                            </span>
                                            <p className="queue-overview-text">{app.overview}</p>
                                        </div>
                                    )}

                                    {/* Requirements Grid: Mandatory vs Nice-to-Have */}
                                    <div className="queue-reqs-grid">
                                        {/* Mandatory / Must-Have Section */}
                                        <div className="queue-req-card queue-mandatory-card">
                                            <div className="queue-card-header">
                                                <span className="queue-card-title mandatory-title">
                                                    <FiAward className="queue-card-icon" /> 📌 Mandatory Requirements
                                                </span>
                                                <span className="queue-card-subtag">Must-Have</span>
                                            </div>

                                            {/* Skill Pills */}
                                            <div className="queue-skills-wrap">
                                                {mandatorySkills.map((skill, i) => (
                                                    <span key={i} className="queue-skill-pill pill-mandatory">
                                                        ✓ {skill}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Extracted Bullets if present */}
                                            {app.mandatoryBullets && app.mandatoryBullets.length > 0 && (
                                                <ul className="queue-bullets-list mandatory-bullets">
                                                    {app.mandatoryBullets.map((b, idx) => (
                                                        <li key={idx}>{b}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        {/* Nice-to-Have / Bonus Section */}
                                        <div className="queue-req-card queue-bonus-card">
                                            <div className="queue-card-header">
                                                <span className="queue-card-title bonus-title">
                                                    <FiStar className="queue-card-icon" /> ✨ Nice-to-Have (Bonus Skills)
                                                </span>
                                                <span className="queue-card-subtag bonus-subtag">Preferred</span>
                                            </div>

                                            {/* Bonus Skill Pills */}
                                            <div className="queue-skills-wrap">
                                                {bonusSkills.map((skill, i) => (
                                                    <span key={i} className="queue-skill-pill pill-bonus">
                                                        + {skill}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Extracted Bonus Bullets if present */}
                                            {app.niceToHaveBullets && app.niceToHaveBullets.length > 0 && (
                                                <ul className="queue-bullets-list bonus-bullets">
                                                    {app.niceToHaveBullets.map((b, idx) => (
                                                        <li key={idx}>{b}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    {/* Compensation & ATS Apply Bar */}
                                    <div className="queue-meta-strip">
                                        <div className="queue-salary-box">
                                            <span className="queue-meta-label">
                                                <FiDollarSign className="queue-meta-icon" /> Compensation / CTC:
                                            </span>
                                            <span className="queue-salary-value">
                                                {app.salary ? app.salary : "₹14 - 20 LPA (Target Market Tier)"}
                                            </span>
                                        </div>

                                        {app.directApplyUrl && (
                                            <div className="queue-ats-direct-box">
                                                <span className="queue-ats-badge">⚡ Direct ATS Link</span>
                                                <a
                                                    href={app.directApplyUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="queue-ats-link"
                                                >
                                                    {app.directApplyUrl.replace(/^https?:\/\//, "").split("/")[0]} ↗
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tailored Pitch Message with 1-Click Copy */}
                                    {app.notes && (
                                        <div className="queue-pitch-box">
                                            <div className="queue-pitch-header">
                                                <span className="queue-pitch-label">
                                                    📝 Pre-Drafted Personalized Pitch (IIT Roorkee 2 YOE)
                                                </span>
                                                <button
                                                    type="button"
                                                    className={`action-queue-apply-btn queue-pitch-copy-btn ${isPitchCopied ? "copied" : ""}`}
                                                    onClick={(e) => handleCopyPitch(app.id, app.notes, e)}
                                                    title="Copy pre-drafted pitch note"
                                                >
                                                    {isPitchCopied ? (
                                                        <>
                                                            <FiCheck /> Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiCopy /> Copy Pitch
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <pre className="queue-pitch-pre">{app.notes}</pre>
                                        </div>
                                    )}

                                    {/* Drawer Action Footer */}
                                    <div className="queue-drawer-footer">
                                        <div className="queue-drawer-footer-links">
                                            {applyLink && (
                                                <a
                                                    href={applyLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="dm-footer-btn dm-linkedin-btn queue-footer-apply-btn"
                                                    title={`Open application for ${app.role} at ${app.company}`}
                                                >
                                                    <FiExternalLink className="dm-footer-btn-icon" /> Apply Now ↗
                                                </a>
                                            )}
                                            {app.jobUrl && app.directApplyUrl && app.jobUrl !== app.directApplyUrl && (
                                                <a
                                                    href={app.jobUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="dm-footer-btn dm-source-btn"
                                                    title="View original posting source"
                                                >
                                                    <FiExternalLink className="dm-footer-btn-icon" /> View Source Posting ↗
                                                </a>
                                            )}
                                        </div>

                                        <div className="queue-drawer-footer-actions">
                                            <button
                                                type="button"
                                                className="basic cell-status status-applied action-queue-apply-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMarkApplied(app.id);
                                                }}
                                            >
                                                <BiSolidMessageSquareCheck className="apply-btn-icon" />
                                                <span>Mark as Applied</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default ActionQueue;
