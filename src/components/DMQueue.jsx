import { useState, useEffect } from "react";
import { listenToDmLeads, updateDmLeadStatus, deleteDmLead } from "../utils_firebase";
import CompanyLogo from "./CompanyLogo";
import { FiSend, FiCopy, FiCheck, FiExternalLink, FiTrash2, FiCheckCircle, FiChevronDown, FiChevronUp, FiClock } from "react-icons/fi";
import { FaStar } from "react-icons/fa6";
import { formateDate } from "../constants";

const CATEGORIES = {
    ALL: "all",
    APPLIED_EARLIER: "applied_earlier",
    HIRING_POST: "hiring_post",
    RECENT_FUNDING: "recent_funding",
    QUEUED_JOB: "queued_job",
    ENGINEERING_LEAD: "engineering_lead"
};

const CATEGORY_META = {
    hiring_post: { label: "🚀 Hiring Post", class: "badge-hiring" },
    recent_funding: { label: "💰 Recent Funding", class: "badge-funding" },
    queued_job: { label: "📌 Queued Job Contact", class: "badge-queued" },
    engineering_lead: { label: "⚡ Engineering Lead", class: "badge-lead" }
};

// Relative time helper
function formatRelativeTime(dateStr) {
    if (!dateStr) return "recent";
    const now = new Date();
    const date = new Date(dateStr);
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1d ago";
    if (diffDays <= 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
}

export default function DMQueue({ appliedList = [] }) {
    const [rawLeads, setRawLeads] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES.ALL);
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedId, setCopiedId] = useState(null);
    const [expandedDmIds, setExpandedDmIds] = useState(new Set());

    useEffect(() => {
        const unsubscribe = listenToDmLeads(setRawLeads);
        return () => unsubscribe && unsubscribe();
    }, []);

    // Helper: Normalize company name for resilient comparison
    const normalizeComp = (str = "") => {
        return str
            .toLowerCase()
            .replace(/\s*(?:in india|technologies|solutions|inc|pvt|ltd|interactive|software|tech|llc|gmbh).*$/i, "")
            .replace(/[^a-z0-9]/g, "")
            .trim();
    };

    // STRICT REQUIREMENT 1: 1 Person per Company
    const leads = [];
    const seenCompanyKeys = new Set();
    rawLeads.forEach(lead => {
        const compKey = normalizeComp(lead.company || "Other");
        if (!seenCompanyKeys.has(compKey)) {
            seenCompanyKeys.add(compKey);
            leads.push(lead);
        }
    });

    // Helper: Find if this lead's company was previously applied for
    const getMatchedApplication = (leadCompany) => {
        if (!leadCompany || !appliedList.length) return null;
        const cleanLead = normalizeComp(leadCompany);
        if (!cleanLead || cleanLead.length < 2) return null;

        return appliedList.find(app => {
            if (!app.company || app.status === "Dismissed" || app.status === "Queued") return false;
            const cleanApp = normalizeComp(app.company);
            if (!cleanApp) return false;
            return cleanApp === cleanLead || cleanApp.includes(cleanLead) || cleanLead.includes(cleanApp);
        });
    };

    const toggleExpandDm = (id) => {
        setExpandedDmIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Count of applied earlier leads
    const appliedEarlierCount = leads.filter(l => Boolean(getMatchedApplication(l.company))).length;

    // Category count stats
    const counts = {
        all: leads.length,
        applied_earlier: appliedEarlierCount,
        hiring_post: leads.filter(l => l.category === "hiring_post").length,
        recent_funding: leads.filter(l => l.category === "recent_funding").length,
        queued_job: leads.filter(l => l.category === "queued_job").length,
        engineering_lead: leads.filter(l => l.category === "engineering_lead").length
    };

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        const matchedApp = getMatchedApplication(lead.company);

        if (selectedCategory === CATEGORIES.APPLIED_EARLIER) {
            if (!matchedApp) return false;
        } else if (selectedCategory !== CATEGORIES.ALL && lead.category !== selectedCategory) {
            return false;
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const nameMatch = (lead.name || "").toLowerCase().includes(q);
            const compMatch = (lead.company || "").toLowerCase().includes(q);
            const titleMatch = (lead.title || "").toLowerCase().includes(q);
            return nameMatch || compMatch || titleMatch;
        }
        return true;
    });

    const handleCopyDm = (id, text, name) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);

        const event = new CustomEvent("trigger-toast", {
            detail: { action: "ADD", companyName: `Outreach message for ${name || "lead"}` },
        });
        window.dispatchEvent(event);
    };

    const handleStatusChange = async (id, newStatus, name) => {
        try {
            await updateDmLeadStatus(id, newStatus);
            const event = new CustomEvent("trigger-toast", {
                detail: { action: "EDIT", companyName: `${name} marked as ${newStatus}` },
            });
            window.dispatchEvent(event);
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    const handleDelete = async (id, name) => {
        try {
            await deleteDmLead(id);
            const event = new CustomEvent("trigger-toast", {
                detail: { action: "DELETE", companyName: name || "Lead" },
            });
            window.dispatchEvent(event);
        } catch (err) {
            console.error("Failed to delete lead:", err);
        }
    };

    return (
        <section className="action-queue-section dm-queue-section">
            <div className="action-queue-header">
                <div className="list-heading-text">
                    <div className="section-title-wrapper">
                        <FiSend className="section-title-icon dm-title-icon" />
                        <h2>DM Outreach Queue</h2>
                    </div>
                    <p className="action-queue-subtitle">
                        {leads.length} {leads.length === 1 ? "decision maker" : "decision makers"} in India (1 contact per company) ready for 1-click outreach
                    </p>
                </div>
                <div className="queue-header-actions">
                    <span className="queue-count-pill dm-count-pill">{leads.length} Leads</span>
                </div>
            </div>

            {/* Category Filter Pills & Search Bar */}
            <div className="dm-toolbar">
                <div className="dm-category-pills">
                    <button
                        className={`dm-pill ${selectedCategory === CATEGORIES.ALL ? "active" : ""}`}
                        onClick={() => setSelectedCategory(CATEGORIES.ALL)}
                    >
                        All ({counts.all})
                    </button>
                    {counts.applied_earlier > 0 && (
                        <button
                            className={`dm-pill pill-applied-star ${selectedCategory === CATEGORIES.APPLIED_EARLIER ? "active" : ""}`}
                            onClick={() => setSelectedCategory(CATEGORIES.APPLIED_EARLIER)}
                        >
                            ⭐ Applied Earlier ({counts.applied_earlier})
                        </button>
                    )}
                    {counts.queued_job > 0 && (
                        <button
                            className={`dm-pill pill-queued ${selectedCategory === CATEGORIES.QUEUED_JOB ? "active" : ""}`}
                            onClick={() => setSelectedCategory(CATEGORIES.QUEUED_JOB)}
                        >
                            📌 Queued Job Contacts ({counts.queued_job})
                        </button>
                    )}
                    {counts.hiring_post > 0 && (
                        <button
                            className={`dm-pill pill-hiring ${selectedCategory === CATEGORIES.HIRING_POST ? "active" : ""}`}
                            onClick={() => setSelectedCategory(CATEGORIES.HIRING_POST)}
                        >
                            🚀 Hiring Posts ({counts.hiring_post})
                        </button>
                    )}
                    {counts.recent_funding > 0 && (
                        <button
                            className={`dm-pill pill-funding ${selectedCategory === CATEGORIES.RECENT_FUNDING ? "active" : ""}`}
                            onClick={() => setSelectedCategory(CATEGORIES.RECENT_FUNDING)}
                        >
                            💰 Recent Funding ({counts.recent_funding})
                        </button>
                    )}
                    {counts.engineering_lead > 0 && (
                        <button
                            className={`dm-pill pill-lead ${selectedCategory === CATEGORIES.ENGINEERING_LEAD ? "active" : ""}`}
                            onClick={() => setSelectedCategory(CATEGORIES.ENGINEERING_LEAD)}
                        >
                            ⚡ Engineering Leads ({counts.engineering_lead})
                        </button>
                    )}
                </div>

                <div className="dm-search-wrapper">
                    <input
                        type="text"
                        placeholder="Search leads by name, company, or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="dm-search-input"
                    />
                </div>
            </div>

            {/* Cards Content */}
            {leads.length === 0 ? (
                <div className="dm-empty-state">
                    <p className="dm-empty-title">🔍 No active DM leads found right now.</p>
                    <p className="dm-empty-desc">Run <code>node scripts/dm-hunter.mjs</code> or wait for the next scheduled executive scan.</p>
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="dm-empty-state">
                    <p className="dm-empty-desc">No leads match the selected filter.</p>
                </div>
            ) : (
                <div className="dm-cards-grid">
                    {filteredLeads.map((lead) => {
                        const meta = CATEGORY_META[lead.category] || CATEGORY_META.queued_job;
                        const matchedApp = getMatchedApplication(lead.company);
                        const isCopied = copiedId === lead.id;
                        const isContacted = lead.status === "Contacted";
                        const isReplied = lead.status === "Replied";
                        const isExpanded = expandedDmIds.has(lead.id);
                        const timeAgo = formatRelativeTime(lead.sourceDate || lead.createdAt);

                        return (
                            <div
                                key={lead.id}
                                className={`dm-card card ${matchedApp ? "card-has-applied" : ""} ${isContacted ? "card-contacted" : ""} ${isReplied ? "card-replied" : ""}`}
                            >
                                {/* Header */}
                                <div className="dm-card-header">
                                    <div className="cell-logo-container">
                                        <CompanyLogo logo={lead.companyLogo} company={lead.company} />
                                    </div>
                                    <div className="cell-name dm-card-name-block">
                                        <div className="queue-row-headline">
                                            <h3>{lead.name}</h3>
                                            <span className={`portal-badge ${meta.class}`}>
                                                {meta.label}
                                            </span>
                                            {matchedApp && (
                                                <span
                                                    className="dm-applied-star-badge"
                                                    title={`You applied to ${matchedApp.company} on ${formateDate(matchedApp.date)} (Current Status: ${matchedApp.status})`}
                                                >
                                                    <FaStar className="star-icon" /> Applied Earlier
                                                </span>
                                            )}
                                        </div>
                                        <div className="dm-title-time-row">
                                            <span className="cell-name-span">{lead.title} • <strong>{lead.company}</strong></span>
                                            <span className="dm-time-ago-tag" title={`Discovered / posted ${timeAgo}`}>
                                                <FiClock className="time-icon" /> {timeAgo}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="dm-large-delete-btn"
                                        onClick={() => handleDelete(lead.id, lead.name)}
                                        title="Dismiss Lead"
                                    >
                                        <FiTrash2 className="dm-trash-icon" />
                                    </button>
                                </div>

                                {/* Applied Earlier Context Callout */}
                                {matchedApp && (
                                    <div className="dm-applied-history-box">
                                        <FaStar className="applied-history-star" />
                                        <span>
                                            You previously applied for <strong>{matchedApp.role || "Frontend"}</strong> on{" "}
                                            <strong>{formateDate(matchedApp.date)}</strong> • Status:{" "}
                                            <span className={`applied-history-status status-${matchedApp.status?.toLowerCase()}`}>
                                                {matchedApp.status}
                                            </span>
                                        </span>
                                    </div>
                                )}

                                {/* Discovery Signal */}
                                {lead.sourceSnippet && (
                                    <div className="dm-signal-callout">
                                        <span className="dm-signal-label">Discovery Signal ({timeAgo})</span>
                                        <p className="dm-signal-text">"{lead.sourceSnippet}"</p>
                                    </div>
                                )}

                                {/* Collapsible Pre-drafted DM Box */}
                                <div className={`dm-message-box ${isExpanded ? "expanded" : "collapsed"}`}>
                                    <div className="dm-message-header">
                                        <button
                                            type="button"
                                            className="dm-expand-toggle-btn"
                                            onClick={() => toggleExpandDm(lead.id)}
                                        >
                                            <span className="dm-message-label">📝 Pre-Drafted DM</span>
                                            {isExpanded ? (
                                                <span className="dm-toggle-text"><FiChevronUp /> Collapse</span>
                                            ) : (
                                                <span className="dm-toggle-text"><FiChevronDown /> Expand message</span>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            className={`action-queue-apply-btn dm-copy-btn ${isCopied ? "copied" : ""}`}
                                            onClick={() => handleCopyDm(lead.id, lead.tailoredDm, lead.name)}
                                        >
                                            {isCopied ? (
                                                <>
                                                    <FiCheck /> Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <FiCopy /> Copy DM
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {isExpanded ? (
                                        <pre className="dm-pre-text">{lead.tailoredDm}</pre>
                                    ) : (
                                        <div
                                            className="dm-collapsed-preview"
                                            onClick={() => toggleExpandDm(lead.id)}
                                            title="Click to expand message"
                                        >
                                            <p className="dm-preview-snippet">
                                                {lead.tailoredDm.split("\n")[0]}... <span className="dm-click-to-read">(click to read full)</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="dm-card-footer">
                                    <a
                                        href={lead.linkedinUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="dm-linkedin-link-btn"
                                    >
                                        <FiExternalLink /> Open LinkedIn ↗
                                    </a>

                                    <div className="dm-status-actions">
                                        {lead.status === "New" && (
                                            <button
                                                type="button"
                                                className="dm-pill-status pill-status-contacted"
                                                onClick={() => handleStatusChange(lead.id, "Contacted", lead.name)}
                                            >
                                                <FiSend /> Mark Contacted
                                            </button>
                                        )}
                                        {lead.status === "Contacted" && (
                                            <button
                                                type="button"
                                                className="dm-pill-status pill-status-replied"
                                                onClick={() => handleStatusChange(lead.id, "Replied", lead.name)}
                                            >
                                                <FiCheckCircle /> Mark Replied
                                            </button>
                                        )}
                                        {lead.status === "Replied" && (
                                            <span className="dm-replied-badge">
                                                🎉 Replied
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}



