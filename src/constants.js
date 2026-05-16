const TIMEOUT_PERIOD = 14;

const ROLES = Object.freeze({
    SDE1: "Software Engineer-1",
    SDE2: "Software Engineer-2",
    SDE3: "Software Engineer-3",
})
const STATUSES = Object.freeze({
    APPLIED: "Applied", 
    INTERVIEWING: "Interviewing",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    NORESPONSE: "No-Response",
})
const LOCATIONS = Object.freeze({
    BANGALORE: "Bangalore",
    REMOTE: "Remote",
    GURGOAN: "Gurgoan",
    NOIDA: "Noida",
    DELHI: "Delhi",
    PUNE: "Pune",
    HYDERABAD: "Hyderabad",
})

function getMonthName(date){
    return date.toLocaleString('en-US', {month: 'long', timeZone: 'UTC'})
}

function formateDate(dateString){
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
    });
}

function getDaysPassed(date){
    const target = new Date(date);
    const today = new Date();
    const difference = today.getTime() - target.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.floor(difference/ oneDay);   
    return totalDays;
}

export {ROLES, STATUSES, LOCATIONS, TIMEOUT_PERIOD, getMonthName, getDaysPassed, formateDate};