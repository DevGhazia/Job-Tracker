import { HiLocationMarker, HiCalendar, HiLightningBolt } from "react-icons/hi";
import { FaBusinessTime } from "react-icons/fa6";
import { PiBuildingOfficeDuotone } from "react-icons/pi";
import { RiDeleteBin2Line } from "react-icons/ri";
import { BiSolidMessageSquareCheck } from "react-icons/bi";
import { ACTIONS, formateDate } from "../constants";

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

    function handleCardClick(url) {
        if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    }

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
                <span className="queue-count-pill">{queueList.length} Pending</span>
            </div>

            <div className="action-queue-list">
                {queueList.map((app) => (
                    <div
                        className={`action-queue-row card ${app.jobUrl ? "clickable-row" : ""}`}
                        key={app.id}
                        onClick={() => handleCardClick(app.jobUrl)}
                        title={app.jobUrl ? `Open ${app.company} application in new tab` : undefined}
                    >
                        {/* Left: Logo & Company / Role matching ApplicationsTable */}
                        <div className="row-top queue-row-main">
                            <div className="cell-logo-container">
                                {app.logo ? (
                                    <img src={app.logo} alt="logo" className="cell-logo" />
                                ) : (
                                    <PiBuildingOfficeDuotone className="cell-logo" style={{ padding: "0.35rem" }} />
                                )}
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

                        {/* Right: Meta badges & Actions pinned to the right */}
                        <div className="queue-row-right">
                            <div className="row-meta queue-row-meta">
                                <div className="tag-container">
                                    <HiLocationMarker className="tag-icon" />
                                    <span>{app.location || "Remote"}</span>
                                </div>
                                <div className="tag-container">
                                    <FaBusinessTime className="tag-icon" />
                                    <span>{app.experience !== undefined ? (app.experience === 0 ? "Entry-level" : `${app.experience}+ yrs`) : "0-2 yrs"}</span>
                                </div>
                                <div className="tag-container queue-date-tag">
                                    <HiCalendar className="tag-icon" />
                                    <span>{formateDate(app.date)}</span>
                                </div>
                            </div>

                            <div className="row-bottom queue-row-actions">
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
                                    <span>Mark as Applied</span>
                                </button>
                                <button
                                    type="button"
                                    className="delete-button"
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
                ))}
            </div>
        </section>
    );
};

export default ActionQueue;
