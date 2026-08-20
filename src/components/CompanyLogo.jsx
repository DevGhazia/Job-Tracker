import { useState, useEffect } from "react";
import { PiBuildingOfficeDuotone } from "react-icons/pi";

function getCompanyDomain(company = "") {
    if (!company) return "";
    return company
        .toLowerCase()
        .replace(/\s*(?:in india|technologies|solutions|inc|pvt|ltd|interactive|software|tech|llc|gmbh).*$/i, "")
        .replace(/[^a-z0-9]/g, "")
        .concat(".com");
}

function getInitialColor(company = "") {
    const colors = [
        { bg: "#E0E7FF", text: "#3730A3" }, // Indigo
        { bg: "#DBEAFE", text: "#1E40AF" }, // Blue
        { bg: "#DCFCE7", text: "#166534" }, // Green
        { bg: "#FEF3C7", text: "#92400E" }, // Amber
        { bg: "#FCE7F3", text: "#9D174D" }, // Pink
        { bg: "#F3E8FF", text: "#6B21A8" }, // Purple
        { bg: "#FFEDD5", text: "#9A3412" }, // Orange
        { bg: "#CCFBF1", text: "#115E59" }, // Teal
    ];
    let hash = 0;
    for (let i = 0; i < company.length; i++) {
        hash = company.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

export default function CompanyLogo({ logo, company = "", className = "cell-logo" }) {
    const cleanLogo = logo && logo !== "null" && logo !== "undefined" ? logo : null;
    const [imgSrc, setImgSrc] = useState(cleanLogo);
    const [fallbackStep, setFallbackStep] = useState(0);

    useEffect(() => {
        const validLogo = logo && logo !== "null" && logo !== "undefined" ? logo : null;
        if (validLogo) {
            setImgSrc(validLogo);
            setFallbackStep(0);
        } else if (company) {
            const domain = getCompanyDomain(company);
            setImgSrc(`https://unavatar.io/${domain}?fallback=https://logo.clearbit.com/${domain}`);
            setFallbackStep(1);
        } else {
            setImgSrc(null);
            setFallbackStep(2);
        }
    }, [logo, company]);

    const handleError = () => {
        if (fallbackStep === 0 && company) {
            const domain = getCompanyDomain(company);
            setImgSrc(`https://unavatar.io/${domain}?fallback=https://logo.clearbit.com/${domain}`);
            setFallbackStep(1);
        } else if (fallbackStep === 1 && company) {
            const domain = getCompanyDomain(company);
            setImgSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
            setFallbackStep(2);
        } else {
            setImgSrc(null);
            setFallbackStep(3);
        }
    };

    if (!imgSrc || fallbackStep >= 3) {
        if (company) {
            const initial = company.trim().charAt(0).toUpperCase();
            const colorScheme = getInitialColor(company);
            return (
                <div
                    className={`${className} company-initial-badge`}
                    style={{
                        backgroundColor: colorScheme.bg,
                        color: colorScheme.text,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        userSelect: "none"
                    }}
                    title={company}
                >
                    {initial}
                </div>
            );
        }
        return (
            <PiBuildingOfficeDuotone
                className={className}
                style={{ padding: "0.35rem" }}
            />
        );
    }

    return (
        <img
            src={imgSrc}
            alt={company ? `${company} logo` : "Company logo"}
            className={className}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={handleError}
        />
    );
}

