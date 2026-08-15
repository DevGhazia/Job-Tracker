import { HiLocationMarker, HiExternalLink } from "react-icons/hi";
import { FaBusinessTime, FaCheck, FaTrash, FaBolt } from "react-icons/fa6";
import { PiBuildingOfficeDuotone } from "react-icons/pi";
import { formateDate } from "../constants";

const ActionQueue = ({ queueList = [], onMarkApplied, onDelete }) => {
    if (!queueList || queueList.length === 0) return null;

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
                            {queueList.length} {queueList.length === 1 ? "job needs" : "jobs need"} your 1-click review & apply
                        </p>
                    </div>
                </div>
                <span className="queue-count-pill">{queueList.length} Pending</span>
            </div>

            <div className="action-queue-list">
                {queueList.map((app) => (
                    <div className="action-queue-row card" key={app.id}>
                        {/* Left: Logo & Company / Role */}
                        <div className="queue-row-main">
                            <div className="cell-logo-container">
                                {app.logo ? (
                                    <img src={app.logo} alt="logo" className="cell-logo" />
                                ) : (
                                    <PiBuildingOfficeDuotone className="cell-logo" style={{ padding: "0.35rem" }} />
                                )}
                            </div>
                            <div className="queue-row-info">
                                <div className="queue-row-headline">
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

                        {/* Middle: Meta badges (Location, Experience, Date) */}
                        <div className="queue-row-meta">
                            <div className="tag-container">
                                <HiLocationMarker className="tag-icon" />
                                <span>{app.location || "Remote"}</span>
                            </div>
                            <div className="tag-container">
                                <FaBusinessTime className="tag-icon" />
                                <span>{app.experience !== undefined ? (app.experience === 0 ? "Entry-level" : `${app.experience}+ yrs`) : "0-2 yrs"}</span>
                            </div>
                            <div className="tag-container queue-date-tag">
                                <span>{formateDate(app.date)}</span>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="queue-row-actions">
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
