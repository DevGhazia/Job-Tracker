import { CiSearch } from "react-icons/ci";
import { useEffect, useState } from "react";
import { PiCalendarDotsFill } from "react-icons/pi";
import { RiDeleteBin2Line } from "react-icons/ri";
import { GoClockFill } from "react-icons/go";
import { HiLocationMarker, HiBriefcase, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import {
    BiSolidMessageSquareCheck,
    BiSolidMessageSquareDots,
    BiSolidMessageSquareEdit,
    BiSolidMessageSquareError,
    BiSolidMessageSquareX,
} from "react-icons/bi";
import { FaBusinessTime } from "react-icons/fa6";
import { ACTIONS, formateDate, formatLocation, getDaysPassed, STATUSES, TIMEOUT_PERIOD } from "../constants";
import CompanyLogo from "./CompanyLogo";

const ITEMS_PER_PAGE = 10;

const ApplicationsTable = ({ list, updateList, handleDelete }) => {
    const tableHeadings = ["Logo", "Company", "Status", "Applied", "Role", "Experience", "Since"];
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!list) return;
        list.forEach((data) => {
            const days = getDaysPassed(data.date);
            if (days > TIMEOUT_PERIOD && data.status === STATUSES.APPLIED) {
                updateList(data.id, "status", "No-Response");
            }
        });
    }, [list]);

    // Reset pagination when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    function getTimeElapsed(date, type) {
        const days = getDaysPassed(date);
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);
        let timeString = "";
        if (years) return `${years}${type === "long" ? (years === 1 ? " year ago" : " years ago") : "y"} `;
        if (months) return `${months}${type === "long" ? (months === 1 ? " month ago" : " months ago") : "m"}`;
        switch (days) {
            case 0:
                timeString = "Today";
                break;
            default:
                timeString = `${days}${type === "long" ? (days === 1 ? " day ago" : " days ago") : "d"}`;
                break;
        }
        return timeString;
    }

    function getRequiredExperience(exp) {
        if (exp === 0) return "Entry-level";
        return `${exp}+ years`;
    }

    function getStatusIcon(status) {
        switch (status) {
            case STATUSES.QUEUED:
                return <BiSolidMessageSquareDots />;
            case STATUSES.APPLIED:
                return <BiSolidMessageSquareEdit />;
            case STATUSES.INTERVIEWING:
                return <BiSolidMessageSquareDots />;
            case STATUSES.ACCEPTED:
                return <BiSolidMessageSquareCheck />;
            case STATUSES.REJECTED:
                return <BiSolidMessageSquareX />;
            case STATUSES.NORESPONSE:
                return <BiSolidMessageSquareError />;
            default:
                return <BiSolidMessageSquareEdit />;
        }
    }

    function handleStatusChange(e, id) {
        if (e.target.value === "Interviewing") updateList(id, "didInterview", true);
        updateList(id, "status", e.target.value);
    }

    if (!list || list.length === 0) {
        return (
            <div className="card" style={{ width: "100%", textAlign: "center", padding: "2rem" }}>
                <p>No submitted applications tracked yet.</p>
            </div>
        );
    }

    const filteredList = list.filter((comp) =>
        comp.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE) || 1;
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredList.length);
    const paginatedList = filteredList.slice(startIndex, endIndex);

    return (
        <section className="list-container">
            <div className="list-heading">
                <div className="list-heading-text">
                    <div className="section-title-wrapper">
                        <HiBriefcase className="section-title-icon" />
                        <h2>Companies</h2>
                    </div>
                    <p>{`${filteredList.length} ${filteredList.length === 1 ? "company" : "companies"} tracked`}</p>
                </div>
                <div className="search-wrapper">
                    <div className="search-icon-wrapper">
                        <CiSearch className="search-icon" />
                    </div>
                    <input
                        type="text"
                        className="basic"
                        id="searchbar"
                        placeholder="Search company"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table">
                <div className="table-header">
                    {tableHeadings.map((heading, index) => (
                        <span key={index}>{heading}</span>
                    ))}
                </div>

                <div className="table-body">
                    {paginatedList.map((app, index) => (
                        <div className="table-row card" key={app.id || index}>
                            {/* --------- LEFT: LOGO | NAME & ROLE -------*/}
                            <div className="row-top">
                                <div className="cell-logo-container">
                                    <CompanyLogo logo={app.logo} company={app.company} />
                                </div>
                                <div className="cell-name">
                                    <h3>{app.company}</h3>
                                    {app.jobUrl ? (
                                        <a
                                            className="cell-name-span job-link"
                                            href={app.jobUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {app.role}
                                        </a>
                                    ) : (
                                        <span className="cell-name-span">{app.role}</span>
                                    )}
                                </div>
                            </div>

                            {/* ------ RIGHT: PINNED DETAILS + STATUS / DELETE ------ */}
                            <div className="row-right">
                                {/* ------ TIME ELAPSED | LOCATION | EXPERIENCE | DATE ------ */}
                                <div className="row-meta">
                                    <div className="tag-container">
                                        <GoClockFill className="tag-icon" />
                                        <span className="time-short">{getTimeElapsed(app.date, "short")}</span>
                                        <span className="time-long">{getTimeElapsed(app.date, "long")}</span>
                                    </div>
                                    <div className="tag-container">
                                        <HiLocationMarker className="tag-icon" />
                                        <span>{formatLocation(app.location)}</span>
                                    </div>
                                    <div className="tag-container">
                                        <FaBusinessTime className="tag-icon" />
                                        <span>{getRequiredExperience(app.experience)}</span>
                                    </div>
                                    <div className="tag-container">
                                        <PiCalendarDotsFill className="tag-icon" />
                                        <span>{formateDate(app.date)}</span>
                                    </div>
                                </div>

                                {/* --------- STATUS | DELETE ------- */}
                                <div className="row-bottom">
                                    <div className="status-select-wrapper">
                                        <div className={`select-preicon status-${app.status.toLowerCase()}`}>
                                            {getStatusIcon(app.status)}
                                        </div>
                                        <select
                                            className={`basic cell-status status-${app.status.toLowerCase()}`}
                                            value={app.status}
                                            name="status"
                                            onChange={(e) => handleStatusChange(e, app.id)}
                                        >
                                            {Object.entries(STATUSES).map(([key, value]) => (
                                                <option key={key}>{value}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(app.id, ACTIONS.DELETE, app.company)}
                                        title="Delete application"
                                    >
                                        <RiDeleteBin2Line className="delete-svg" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --------- PAGINATION CONTROLS ------- */}
            {filteredList.length > ITEMS_PER_PAGE && (
                <div className="pagination-container">
                    <div className="pagination-info">
                        Showing <span>{startIndex + 1}</span>–<span>{endIndex}</span> of <span>{filteredList.length}</span> companies
                    </div>
                    <div className="pagination-controls">
                        <button
                            type="button"
                            className="pagination-btn"
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={activePage === 1}
                            title="Previous page"
                        >
                            <HiChevronLeft className="pagination-icon" />
                            <span>Prev</span>
                        </button>

                        <div className="pagination-pages">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                if (
                                    totalPages <= 7 ||
                                    pageNum === 1 ||
                                    pageNum === totalPages ||
                                    (pageNum >= activePage - 1 && pageNum <= activePage + 1)
                                ) {
                                    return (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            className={`pagination-page-btn ${activePage === pageNum ? "active" : ""}`}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                } else if (
                                    (pageNum === activePage - 2 && pageNum > 1) ||
                                    (pageNum === activePage + 2 && pageNum < totalPages)
                                ) {
                                    return <span key={pageNum} className="pagination-ellipsis">…</span>;
                                }
                                return null;
                            })}
                        </div>

                        <button
                            type="button"
                            className="pagination-btn"
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={activePage === totalPages}
                            title="Next page"
                        >
                            <span>Next</span>
                            <HiChevronRight className="pagination-icon" />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ApplicationsTable;
