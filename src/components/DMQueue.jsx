import { useState, useEffect } from "react";
import { listenToDmLeads, updateDmLeadStatus, deleteDmLead } from "../utils_firebase";
import CompanyLogo from "./CompanyLogo";
import { 
    FiSend, 
    FiCopy, 
    FiCheck, 
    FiExternalLink, 
    FiTrash2, 
    FiCheckCircle, 
    FiChevronDown, 
    FiChevronUp, 
    FiClock, 
    FiGlobe,
    FiMaximize2,
    FiMinimize2
} from "react-icons/fi";

const CATEGORIES = {
    ALL: "all",
    HIRING_POST: "hiring_post",
    RECENT_FUNDING: "recent_funding",
    HR_LEAD: "hr_lead"
};

const CATEGORY_META = {
    hiring_post: { label: "🚀 Hiring Post", class: "badge-hiring" },
    recent_funding: { label: "💰 Recent Funding", class: "badge-funding" },
    hr_lead: { label: "👥 HR / Recruiter", class: "badge-lead" },
    engineering_lead: { label: "⚡ Tech Lead", class: "badge-lead" }
};

// Relative time helper from original source/post/application date
function formatRelativeTime(dateStr) {
    if (!dateStr) return "recent";
    const now = new Date();
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "recent";

    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "just now";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
        const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
        return `${diffMins}m ago`;
    }
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks <= 4) return `${diffWeeks}w ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
}

// Ensure LinkedIn URL always opens the valid profile with https:// protocol
function getValidLinkedInUrl(lead) {
    if (!lead || !lead.linkedinUrl) {
        return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent((lead?.name || "") + " " + (lead?.company || ""))}`;
    }
    const trimmed = lead.linkedinUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
    }
    return `https://${trimmed.replace(/^\/+/, "")}`;
}

// Get the original source URL (funding article / hiring post)
function getValidSourceUrl(lead) {
    if (lead?.sourceUrl && lead.sourceUrl.trim().startsWith("http")) {
        return lead.sourceUrl.trim();
    }
    if (lead?.linkedinUrl && lead.linkedinUrl.trim().startsWith("http")) {
        return lead.linkedinUrl.trim();
    }
    return `https://www.google.com/search?q=${encodeURIComponent((lead?.company || "") + " frontend engineering hiring")}`;
}

export default function DMQueue() {
    const [rawLeads, setRawLeads] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES.ALL);
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedId, setCopiedId] = useState(null);
    const [expandedLeadIds, setExpandedLeadIds] = useState(new Set());

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

    // STRICT REQUIREMENT: 1 Person per Company & filter out obsolete queued_job category
    const leads = [];
    const seenCompanyKeys = new Set();
    rawLeads.forEach(lead => {
        if (lead.category === "queued_job") return; // exclude any leftover queued job contacts
        const compKey = normalizeComp(lead.company || "Other");
        if (!seenCompanyKeys.has(compKey)) {
            seenCompanyKeys.add(compKey);
            leads.push(lead);
        }
    });

    const toggleExpandLead = (id) => {
        setExpandedLeadIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleExpandAll = () => {
        setExpandedLeadIds(new Set(filteredLeads.map(l => l.id)));
    };

    const handleCollapseAll = () => {
        setExpandedLeadIds(new Set());
    };

    // Category count stats
    const counts = {
        all: leads.length,
        hiring_post: leads.filter(l => l.category === "hiring_post").length,
        recent_funding: leads.filter(l => l.category === "recent_funding").length,
        hr_lead: leads.filter(l => l.category === "hr_lead").length
    };

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        if (selectedCategory !== CATEGORIES.ALL && lead.category !== selectedCategory) {
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

    const handleCopyDm = (id, text, name, e) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);

        const event = new CustomEvent("trigger-toast", {
            detail: { action: "ADD", companyName: `Outreach message for ${name || "lead"}` },
        });
        window.dispatchEvent(event);
    };

    const handleStatusChange = async (id, newStatus, name, e) => {
        if (e) e.stopPropagation();
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

    const handleDelete = async (id, name, e) => {
        if (e) e.stopPropagation();
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

    const allExpanded = filteredLeads.length > 0 && filteredLeads.every(l => expandedLeadIds.has(l.id));

    return (
        <section className="action-queue-section dm-queue-section">
            {/* Header */}
            <div className="action-queue-header">
                <div className="list-heading-text">
                    <div className="section-title-wrapper">
                        <FiSend className="section-title-icon dm-title-icon" />
                        <h2>DM Outreach Queue</h2>
                    </div>
                    <p className="action-queue-subtitle">
                        {leads.length} {leads.length === 1 ? "lead" : "leads"} from funded startups, founder hiring posts & HR recruiters in India
                    </p>
                </div>
                <div className="queue-header-actions">
                    {filteredLeads.length > 0 && (
                        <button
                            type="button"
                            className="dm-toggle-all-btn"
                            onClick={allExpanded ? handleCollapseAll : handleExpandAll}
                            title={allExpanded ? "Collapse all rows" : "Expand all rows"}
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
                    )}
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
                    {counts.hr_lead > 0 && (
                        <button
                            className={`dm-pill pill-lead ${selectedCategory === CATEGORIES.HR_LEAD ? "active" : ""}`}
                            onClick={() => setSelectedCategory(CATEGORIES.HR_LEAD)}
                        >
                            👥 HR & Recruiters ({counts.hr_lead})
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

            {/* Minimal Horizontal Collapsed List View */}
            {leads.length === 0 ? (
                <div className="dm-empty-state">
                    <p className="dm-empty-title">🔍 No startup or hiring leads found right now.</p>
                    <p className="dm-empty-desc">Run <code>node scripts/dm-hunter.mjs</code> or wait for the morning 9:47 AM startup scan.</p>
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="dm-empty-state">
                    <p className="dm-empty-desc">No leads match the selected filter.</p>
                </div>
            ) : (
                <div className="dm-queue-list">
                    {filteredLeads.map((lead) => {
                        const meta = CATEGORY_META[lead.category] || CATEGORY_META.hiring_post;
                        const isCopied = copiedId === lead.id;
                        const isContacted = lead.status === "Contacted";
                        const isReplied = lead.status === "Replied";
                        const isExpanded = expandedLeadIds.has(lead.id);
                        
                        const timeAgo = formatRelativeTime(lead.sourceDate || lead.createdAt);
                        const linkedinUrl = getValidLinkedInUrl(lead);
                        const sourceUrl = getValidSourceUrl(lead);

                        return (
                            <div
                                key={lead.id}
                                className={`dm-queue-row card ${isExpanded ? "row-expanded" : "row-collapsed"} ${isContacted ? "card-contacted" : ""} ${isReplied ? "card-replied" : ""}`}
                            >
                                {/* 1. Collapsed Horizontal Bar (Minimal Default Look) */}
                                <div 
                                    className="dm-row-collapsed-bar"
                                    onClick={() => toggleExpandLead(lead.id)}
                                    title="Click to expand / collapse details"
                                >
                                    {/* Left: Logo & Person Details */}
                                    <div className="dm-row-left">
                                        <div className="cell-logo-container dm-row-logo">
                                            <CompanyLogo logo={lead.companyLogo} company={lead.company} />
                                        </div>
                                        <div className="dm-row-name-block">
                                            <div className="dm-row-headline">
                                                <h3 className="dm-row-person-name">{lead.name}</h3>
                                                <span className={`portal-badge ${meta.class}`}>
                                                    {meta.label}
                                                </span>
                                            </div>
                                            <p className="dm-row-subtitle">
                                                {lead.title} • <strong>{lead.company}</strong>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Meta Tags, Quick Actions & Chevron Dropdown */}
                                    <div className="dm-row-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="dm-row-meta">
                                            <span className="dm-time-ago-tag" title={`Source publication date: ${timeAgo}`}>
                                                <FiClock className="time-icon" /> {timeAgo}
                                            </span>

                                            {lead.status === "New" && (
                                                <span className="dm-status-tag tag-new">New</span>
                                            )}
                                            {lead.status === "Contacted" && (
                                                <span className="dm-status-tag tag-contacted">Contacted</span>
                                            )}
                                            {lead.status === "Replied" && (
                                                <span className="dm-status-tag tag-replied">🎉 Replied</span>
                                            )}
                                        </div>

                                        <div className="dm-row-quick-actions">
                                            {/* Quick 1-click Copy */}
                                            <button
                                                type="button"
                                                className={`action-queue-apply-btn dm-compact-action-btn ${isCopied ? "copied" : ""}`}
                                                onClick={(e) => handleCopyDm(lead.id, lead.tailoredDm, lead.name, e)}
                                                title="Copy pre-drafted DM message"
                                            >
                                                {isCopied ? (
                                                    <>
                                                        <FiCheck /> <span>Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiCopy /> <span>Copy DM</span>
                                                    </>
                                                )}
                                            </button>

                                            {/* Direct LinkedIn Profile Link */}
                                            <a
                                                href={linkedinUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="dm-compact-link-btn"
                                                title={`Open ${lead.name}'s profile on LinkedIn`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <FiExternalLink /> <span>LinkedIn ↗</span>
                                            </a>

                                            {/* Dropdown Expand / Collapse Trigger */}
                                            <button
                                                type="button"
                                                className={`dm-dropdown-toggle-btn ${isExpanded ? "active" : ""}`}
                                                onClick={() => toggleExpandLead(lead.id)}
                                                title={isExpanded ? "Collapse details" : "Expand details"}
                                            >
                                                <span>{isExpanded ? "Hide" : "Details"}</span>
                                                {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                            </button>

                                            {/* Delete / Dismiss Button */}
                                            <button
                                                type="button"
                                                className="dm-compact-delete-btn"
                                                onClick={(e) => handleDelete(lead.id, lead.name, e)}
                                                title="Dismiss Lead"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Expanded Drawer (Shows on Dropdown Click) */}
                                {isExpanded && (
                                    <div className="dm-row-expanded-drawer">
                                        {/* Discovery Signal Callout */}
                                        {lead.sourceSnippet && (
                                            <div className="dm-signal-callout">
                                                <span className="dm-signal-label">Discovery Signal ({timeAgo})</span>
                                                <p className="dm-signal-text">"{lead.sourceSnippet}"</p>
                                            </div>
                                        )}

                                        {/* Pre-Drafted DM Box */}
                                        <div className="dm-message-box expanded">
                                            <div className="dm-message-header">
                                                <span className="dm-message-label">📝 Pre-Drafted Personalized Message</span>
                                                <button
                                                    type="button"
                                                    className={`action-queue-apply-btn dm-copy-btn ${isCopied ? "copied" : ""}`}
                                                    onClick={(e) => handleCopyDm(lead.id, lead.tailoredDm, lead.name, e)}
                                                >
                                                    {isCopied ? (
                                                        <>
                                                            <FiCheck /> Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiCopy /> Copy Message
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <pre className="dm-pre-text">{lead.tailoredDm}</pre>
                                        </div>

                                        {/* Full Action Footer */}
                                        <div className="dm-card-footer">
                                            <div className="dm-footer-links">
                                                <a
                                                    href={linkedinUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="dm-footer-btn dm-linkedin-btn"
                                                    title={`Open ${lead.name}'s profile on LinkedIn`}
                                                >
                                                    <FiExternalLink className="dm-footer-btn-icon" /> LinkedIn Profile ↗
                                                </a>

                                                <a
                                                    href={sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="dm-footer-btn dm-source-btn"
                                                    title="View original hiring post or funding announcement"
                                                >
                                                    <FiGlobe className="dm-footer-btn-icon" /> View Source Announcement ↗
                                                </a>
                                            </div>

                                            <div className="dm-status-actions">
                                                {lead.status === "New" && (
                                                    <button
                                                        type="button"
                                                        className="dm-pill-status pill-status-contacted"
                                                        onClick={(e) => handleStatusChange(lead.id, "Contacted", lead.name, e)}
                                                    >
                                                        <FiSend /> Mark Contacted
                                                    </button>
                                                )}
                                                {lead.status === "Contacted" && (
                                                    <button
                                                        type="button"
                                                        className="dm-pill-status pill-status-replied"
                                                        onClick={(e) => handleStatusChange(lead.id, "Replied", lead.name, e)}
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
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
