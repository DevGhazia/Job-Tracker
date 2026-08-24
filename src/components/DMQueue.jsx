import { useState, useEffect } from "react";
import { listenToDmLeads, updateDmLeadStatus, deleteDmLead } from "../utils_firebase";
import CompanyLogo from "./CompanyLogo";
import { FiCopy, FiCheck, FiExternalLink, FiTrash2, FiUser, FiSend, FiCheckCircle } from "react-icons/fi";
import { PiBuildingsDuotone } from "react-icons/pi";

const CATEGORIES = {
    ALL: "all",
    HIRING_POST: "hiring_post",
    RECENT_FUNDING: "recent_funding",
    QUEUED_JOB: "queued_job",
    ENGINEERING_LEAD: "engineering_lead"
};

const CATEGORY_META = {
    hiring_post: { label: "🚀 Hiring Post", color: "#9333ea", bg: "#f3e8ff", border: "#d8b4fe" },
    recent_funding: { label: "💰 Recent Funding", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
    queued_job: { label: "📌 Queued Job Contact", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
    engineering_lead: { label: "⚡ Engineering Lead", color: "#d97706", bg: "#fef3c7", border: "#fde68a" }
};

export default function DMQueue() {
    const [leads, setLeads] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES.ALL);
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedId, setCopiedId] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const unsubscribe = listenToDmLeads(setLeads);
        return () => unsubscribe && unsubscribe();
    }, []);

    // Category count stats
    const counts = {
        all: leads.length,
        hiring_post: leads.filter(l => l.category === "hiring_post").length,
        recent_funding: leads.filter(l => l.category === "recent_funding").length,
        queued_job: leads.filter(l => l.category === "queued_job").length,
        engineering_lead: leads.filter(l => l.category === "engineering_lead").length
    };

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        // Category filter
        if (selectedCategory !== CATEGORIES.ALL && lead.category !== selectedCategory) {
            return false;
        }
        // Status filter
        if (statusFilter === "new" && lead.status !== "New") return false;
        if (statusFilter === "contacted" && lead.status !== "Contacted") return false;
        if (statusFilter === "replied" && lead.status !== "Replied") return false;

        // Search query
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
        <div className="dm-queue-container">
            <div className="dm-queue-header">
                <div className="dm-queue-title-row">
                    <div className="dm-queue-badge-title">
                        <span className="dm-badge-icon">💬</span>
                        <h2>DM Outreach Queue</h2>
                        <span className="dm-lead-pill-count">{leads.length} Leads</span>
                    </div>
                    <p className="dm-queue-subtitle">
                        Direct founders, CTOs & Engineering Managers with pre-drafted 1-click personalized messages
                    </p>
                </div>

                {/* Category Filter Pills */}
                {leads.length > 0 && (
                    <div className="dm-category-pills">
                        <button
                            className={`dm-pill ${selectedCategory === CATEGORIES.ALL ? "active" : ""}`}
                            onClick={() => setSelectedCategory(CATEGORIES.ALL)}
                        >
                            All ({counts.all})
                        </button>
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
                )}

                {/* Search Bar */}
                {leads.length > 0 && (
                    <div className="dm-search-bar-row">
                        <input
                            type="text"
                            placeholder="Search leads by name, company, or title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="dm-search-input"
                        />
                    </div>
                )}
            </div>

            {leads.length === 0 ? (
                <div className="dm-empty-state" style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted, #64748b)" }}>
                    <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>🔍 No active DM leads found right now.</p>
                    <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.85rem" }}>Run <code>node scripts/dm-hunter.mjs</code> or wait for the next scheduled executive scan.</p>
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="dm-empty-state" style={{ textAlign: "center", padding: "1.5rem 1rem", color: "var(--text-muted, #64748b)" }}>
                    <p style={{ margin: 0, fontSize: "0.9rem" }}>No leads match the selected filter.</p>
                </div>
            ) : (
                <div className="dm-cards-grid">
                {filteredLeads.map((lead) => {
                    const meta = CATEGORY_META[lead.category] || CATEGORY_META.queued_job;
                    const isCopied = copiedId === lead.id;
                    const isContacted = lead.status === "Contacted";
                    const isReplied = lead.status === "Replied";

                    return (
                        <div key={lead.id} className={`dm-card ${isContacted ? "card-contacted" : ""} ${isReplied ? "card-replied" : ""}`}>
                            {/* Card Top */}
                            <div className="dm-card-header">
                                <div className="dm-person-info">
                                    <div className="dm-avatar">
                                        <CompanyLogo logo={lead.companyLogo} company={lead.company} className="dm-company-logo" />
                                    </div>
                                    <div className="dm-person-details">
                                        <div className="dm-name-row">
                                            <h3 className="dm-person-name">{lead.name}</h3>
                                            <span
                                                className="dm-category-tag"
                                                style={{ color: meta.color, backgroundColor: meta.bg, borderColor: meta.border }}
                                            >
                                                {meta.label}
                                            </span>
                                        </div>
                                        <p className="dm-person-title">{lead.title} • <strong>{lead.company}</strong></p>
                                    </div>
                                </div>
                                <button
                                    className="dm-delete-btn"
                                    onClick={() => handleDelete(lead.id, lead.name)}
                                    title="Dismiss Lead"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>

                            {/* Discovery Signal Box */}
                            {lead.sourceSnippet && (
                                <div className="dm-signal-box">
                                    <span className="dm-signal-label">Discovery Signal:</span>
                                    <p className="dm-signal-text">"{lead.sourceSnippet}"</p>
                                </div>
                            )}

                            {/* Pre-Drafted DM Box */}
                            <div className="dm-message-box">
                                <div className="dm-message-header">
                                    <span className="dm-message-label">📝 Pre-Drafted Tailored DM (Ready to Send):</span>
                                    <button
                                        className={`dm-copy-btn ${isCopied ? "copied" : ""}`}
                                        onClick={() => handleCopyDm(lead.id, lead.tailoredDm, lead.name)}
                                    >
                                        {isCopied ? (
                                            <>
                                                <FiCheck className="dm-btn-icon" /> Copied to Clipboard!
                                            </>
                                        ) : (
                                            <>
                                                <FiCopy className="dm-btn-icon" /> Copy 1-Click DM
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="dm-message-body">
                                    <pre className="dm-pre-text">{lead.tailoredDm}</pre>
                                </div>
                            </div>

                            {/* Card Actions Footer */}
                            <div className="dm-card-footer">
                                <a
                                    href={lead.linkedinUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="dm-linkedin-btn"
                                >
                                    <FiExternalLink className="dm-btn-icon" /> Open LinkedIn Profile ↗
                                </a>

                                <div className="dm-status-actions">
                                    {lead.status === "New" && (
                                        <button
                                            className="dm-action-pill pill-mark-contacted"
                                            onClick={() => handleStatusChange(lead.id, "Contacted", lead.name)}
                                        >
                                            <FiSend className="dm-btn-icon" /> Mark as Contacted
                                        </button>
                                    )}
                                    {lead.status === "Contacted" && (
                                        <button
                                            className="dm-action-pill pill-mark-replied"
                                            onClick={() => handleStatusChange(lead.id, "Replied", lead.name)}
                                        >
                                            <FiCheckCircle className="dm-btn-icon" /> Mark as Replied
                                        </button>
                                    )}
                                    {lead.status === "Replied" && (
                                        <span className="dm-status-badge replied">
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
        </div>
    );
}
