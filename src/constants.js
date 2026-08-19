export const TIMEOUT_PERIOD = 14;

export const ROLES = Object.freeze({
    SDE1: "Software Engineer-1",
    SDE2: "Software Engineer-2",
    SDE3: "Software Engineer-3",
})

export const STATUSES = Object.freeze({
    QUEUED: "Queued",
    APPLIED: "Applied", 
    INTERVIEWING: "Interviewing",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    NORESPONSE: "No-Response",
    DISMISSED: "Dismissed",
})

export const LOCATIONS = Object.freeze({
    BANGALORE: "Bangalore",
    REMOTE: "Remote",
    GURGOAN: "Gurgoan",
    NOIDA: "Noida",
    DELHI: "Delhi",
    PUNE: "Pune",
    HYDERABAD: "Hyderabad",
})

export const ACTIONS = Object.freeze({
    ADD: "Added",
    DELETE: "Deleted",
    ALERT: "Alert",
})

export function getMonthName(date){
    return date.toLocaleString('en-US', {month: 'long', timeZone: 'UTC'})
}

export function formateDate(dateString){
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
    });
}

export function getDaysPassed(date){
    const target = new Date(date);
    const today = new Date();
    const difference = today.getTime() - target.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.floor(difference/ oneDay);   
    return totalDays;
}

export function formatLocation(loc){
    if (!loc || typeof loc !== "string") return "Remote";
    const str = loc.trim();
    if (!str) return "Remote";

    // Handle pure remote indicators
    if (/^remote$/i.test(str) || /^(?:india\s*[\/,]\s*remote|remote\s*[\/,]\s*india)$/i.test(str)) return "Remote";
    if (/^india\s*\(\s*remote(?:\s*[\/,]\s*hybrid)?\s*\)$/i.test(str)) return "Remote";

    // Extract the primary city name (split by comma, slash, pipe, bullet, or spaced hyphen)
    let primary = str.split(/[,/|•]|\s+-\s+/)[0].trim();
    primary = primary.replace(/\s*\([^)]*\)/g, "").trim();

    // If first token is only generic "India", fallback to second token if present
    if (/^india$/i.test(primary)) {
        const parts = str.split(/[,/|•]|\s+-\s+/).map(p => p.trim());
        if (parts.length > 1 && parts[1] && !/^india$/i.test(parts[1])) {
            return parts[1].replace(/\s*\([^)]*\)/g, "").trim();
        }
        return "India";
    }

    return primary || "Remote";
}

