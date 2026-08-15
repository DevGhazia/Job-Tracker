import { useState } from "react";
import { HiLocationMarker, HiExternalLink } from "react-icons/hi";
import { FaBusinessTime, FaCheck, FaCopy, FaTrash, FaBolt } from "react-icons/fa6";
import { PiBuildingOfficeDuotone } from "react-icons/pi";
import { formateDate } from "../constants";

const ActionQueue = ({ queueList = [], onMarkApplied, onDelete }) => {
    const [copiedId, setCopiedId] = useState(null);
    const [expandedNotes, setExpandedNotes] = useState({});

    if (!queueList || queueList.length === 0) return null;

    function handleCopy(id, text) {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => {
            setCopiedId(null);
        }, 2000);
    }

    function toggleNote(id) {
        setExpandedNotes(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    }

    function getPortalBadgeColor(portal = "") {
        const p = portal.toLowerCase();
        if (p.includes("wellfound") || p.includes("angellist")) return "badge-wellfound";
        if (p.includes("instahyre")) return "badge-instahyre";
        if (p.includes("linkedin")) return "badge-linkedin";
        if (p.includes("cutshort") || p.includes("hirist")) return "badge-cutshort";
        if (p.includes("workday")) return "badge-workday";
        if (p.includes("greenhouse") || p.includes("lever") || p.includes("ashby")) return "badge-ats";
        return "badge-default";
    }

    return (
        <section className="action-queue-section">
            <div className="action-queue-header">
                <div className="action-queue-title">
                    <div className="action-queue-icon-wrapper">
                        <FaBolt className="action-queue-icon" />
                    </div>
                    <div>
                        <h2>Action Queue</h2>
                        <p className="action-queue-subtitle">
                            {queueList.length} {queueList.length === 1 ? "job needs" : "jobs need"} your quick review & 1-click apply
                        </p>
                    </div>
                </div>
                <span className="queue-count-pill">{queueList.length} Pending</span>
            </div>

            <div className="action-queue-grid">
                {queueList.map((app) => (
                    <div className="action-queue-card card" key={app.id}>
                        <div className="queue-card-top">
                            <div className="cell-logo-container">
                                {app.logo ? (
                                    <img src={app.logo} alt="logo" className="cell-logo" />
                                ) : (
                                    <PiBuildingOfficeDuotone className="cell-logo" style={{ padding: "0.35rem" }} />
                                )}
                            </div>
                            <div className="queue-card-info">
                                <div className="queue-card-headline">
                                    <h3>{app.company}</h3>
                                    {app.portalName && (
                                        <span className={`portal-badge ${getPortalBadgeColor(app.portalName)}`}>
                                            {app.portalName}
                                        </span>
                                    )}
                                </div>
                                <h4 className="queue-role-title">{app.role}</h4>
                            </div>
                        </div>

                        <div className="queue-card-meta">
                            <div className="tag-container">
                                <HiLocationMarker className="tag-icon" />
                                <span>{app.location || "Remote"}</span>
                            </div>
                            <div className="tag-container">
                                <FaBusinessTime className="tag-icon" />
                                <span>{app.experience !== undefined ? (app.experience === 0 ? "Entry-level" : `${app.experience}+ yrs`) : "Experience N/A"}</span>
                            </div>
                            <div className="tag-container">
                                <span>Queued: {formateDate(app.date)}</span>
                            </div>
                        </div>

                        {app.notes && (
                            <div className="queue-notes-container">
                                <div className="queue-notes-header">
                                    <span className="queue-notes-label">💡 AI Tailored Pitch Note</span>
                                    <div className="queue-notes-actions">
                                        <button
                                            type="button"
                                            className="copy-note-btn"
                                            onClick={() => handleCopy(app.id, app.notes)}
                                            title="Copy note to clipboard"
                                        >
                                            {copiedId === app.id ? (
                                                <>
                                                    <FaCheck className="copy-icon-success" /> Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <FaCopy /> Copy
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="expand-note-btn"
                                            onClick={() => toggleNote(app.id)}
                                        >
                                            {expandedNotes[app.id] ? "Show less" : "Expand"}
                                        </button>
                                    </div>
                                </div>
                                <p className={`queue-notes-text ${expandedNotes[app.id] ? "expanded" : "collapsed"}`}>
                                    {app.notes}
                                </p>
                            </div>
                        )}

                        <div className="queue-card-footer">
                            <div className="queue-card-primary-actions">
                                {app.jobUrl && (
                                    <a
                                        href={app.jobUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-apply-portal"
                                    >
                                        Open & Apply <HiExternalLink className="btn-icon" />
                                    </a>
                                )}
                                <button
                                    type="button"
                                    className="btn-mark-applied"
                                    onClick={() => onMarkApplied(app.id)}
                                    title="Mark as Applied"
                                >
                                    <FaCheck className="btn-icon" /> Mark as Applied
                                </button>
                            </div>
                            <button
                                type="button"
                                className="btn-dismiss-queue"
                                onClick={() => onDelete(app.id, app.company)}
                                title="Dismiss from queue"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ActionQueue;
