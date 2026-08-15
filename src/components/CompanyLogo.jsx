import { useState, useEffect } from "react";
import { PiBuildingOfficeDuotone } from "react-icons/pi";

export default function CompanyLogo({ logo, company, className = "cell-logo" }) {
    const [hasError, setHasError] = useState(false);

    // Reset error state if logo prop changes
    useEffect(() => {
        setHasError(false);
    }, [logo]);

    if (!logo || hasError) {
        return (
            <PiBuildingOfficeDuotone
                className={className}
                style={{ padding: "0.35rem" }}
            />
        );
    }

    return (
        <img
            src={logo}
            alt={company ? `${company} logo` : "Company logo"}
            className={className}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setHasError(true)}
        />
    );
}
