import { CiSearch } from "react-icons/ci";
import { useEffect, useState } from "react";
import { PiBuildingOfficeDuotone, PiCalendarDotsFill, PiCalendarFill } from "react-icons/pi";
import { RiDeleteBin2Line } from "react-icons/ri";
import { GoClockFill, GoLocation } from "react-icons/go";
import { HiLocationMarker } from "react-icons/hi";
import { BiSolidMessageSquareCheck, BiSolidMessageSquareDots, BiSolidMessageSquareEdit, BiSolidMessageSquareError, BiSolidMessageSquareX } from "react-icons/bi";
import { FaBusinessTime } from "react-icons/fa6";
import { formateDate, getDaysPassed, getMonthName, STATUSES, TIMEOUT_PERIOD } from "../constants";

const ApplicationsTable = ({list, updateList, handleDelete}) => {
    const tableHeadings = ["Logo", "Company", "Status", "Applied", "Role", "Experience", "Since"];
    const [searchTerm, setSearchTerm] = useState("");
    
    useEffect(() => {
        if(!list) return;
        list.forEach(data => {
            const days = getDaysPassed(data.date);
            if (days > TIMEOUT_PERIOD && data.status === STATUSES.APPLIED) {
                updateList(data.id, "status", "No-Response");
            }
        });
    }, [list]);

    function getTimeElapsed(date, type){
        const days = getDaysPassed(date);
        const months = Math.floor(days/30);
        const years = Math.floor(months/12);
        let timeString = "";
        if(years) return `${years}${type==="long"? (years===1? " year ago": " years ago") : "y"} `; 
        if(months) return `${months}${type==="long"? (months===1? " month ago": " months ago") : "m"}`
        switch(days){
            case 0: timeString = "Today"; break; 
            default: timeString = `${days}${type==="long"? (days===1? " day ago": " days ago") : "d"}`;break;
        }
        return timeString;
    }

    function getRequiredExperience(exp){
        if(exp === 0) return "Entry-level"
        return `${exp}+ years`;
    }

    function getStatusIcon(status){
        switch(status){
            case STATUSES.APPLIED: return <BiSolidMessageSquareEdit />; break;
            case STATUSES.INTERVIEWING: return <BiSolidMessageSquareDots />; break;
            case STATUSES.ACCEPTED: return <BiSolidMessageSquareCheck />; break;
            case STATUSES.REJECTED: return <BiSolidMessageSquareX />; break;
            case STATUSES.NORESPONSE: return <BiSolidMessageSquareError />; break;
        }
    }

    function handleStatusChange(e, id){
        if(e.target.value === "Interviewing")
            updateList(id, "didInterview", true);
        updateList(id, "status", e.target.value)
    }

    if(list.length === 0) return (
        <div className="card" style={{width:"100%", textAlign:"center"}}>
            <p>You haven't added any companies yet</p> 
        </div>
    )    

    const filteredList = list.filter((comp)=> comp.company.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <section className="list-container">
            <div className="list-heading">
                <div className="list-heading-text">
                    <h2>Companies</h2>
                    <p>{`${filteredList.length} ${filteredList.length === 1? "company": "companies"} tracked`}</p>
                </div>
                <div className="search-wrapper">
                    <div className="search-icon-wrapper">
                        <CiSearch className="search-icon"/>
                    </div>
                    <input 
                        type="text" 
                        className="basic" 
                        id="searchbar" 
                        placeholder="Search company"
                        value={searchTerm}
                        onChange={(e)=>setSearchTerm(e.target.value)}
                    />
                </div>
                </div>

            <div className="table">
                <div className="table-header">
                    {tableHeadings.map((heading, index)=>(
                        <span key={index}>{heading}</span>
                    ))}
                </div>

                <div className="table-body">
                    {list.map((app, index)=>(
                        <div className="table-row card" key={index}>

                                {/* --------- LOGO | NAME -------*/}
                                <div className="row-top">
                                    <div className="cell-logo-container">
                                        {app.logo?
                                            <img src={app.logo} alt="company's logo" className="cell-logo"/> :
                                            <PiBuildingOfficeDuotone className="cell-logo" style={{padding:"0.35rem"}}/>
                                        }
                                    </div>
                                    <div className="cell-name">
                                        <h3>{app.company}</h3>
                                        <span className="cell-name-span">{app.role}</span>
                                    </div>
                                    <div className="tag-container">
                                        <GoClockFill className="tag-icon" />
                                        <span className="time-short">{getTimeElapsed(app.date, "short")}</span>
                                        <span className="time-long">{getTimeElapsed(app.date, "long")}</span>
                                    </div>
                                </div>

                                {/* ------ DATE | TIME | LOCATION ------ */}
                                <div className="row-meta">
                                    <div className="tag-container">
                                        <FaBusinessTime className="tag-icon" />
                                        <span>{getRequiredExperience(app.experience)}</span>
                                    </div>
                                    <div className="tag-container">
                                        <HiLocationMarker className="tag-icon" />
                                        <span>{app.location}</span>
                                    </div>
                                    <div className="tag-container">
                                        <PiCalendarDotsFill className="tag-icon"/>
                                        <span>{formateDate(app.date)}</span>
                                    </div>
                                </div>

                                {/* --------- STATUS | DELETE ------- */}
                                <div className="row-bottom">
                                    <div className={`select-preicon status-${app.status.toLowerCase()}`}>
                                        {getStatusIcon(app.status)}
                                    </div>
                                    <select 
                                        className={`basic cell-status status-${app.status.toLowerCase()}`}
                                        value={app.status}
                                        name="status"
                                        onChange={(e)=>handleStatusChange(e, app.id)}
                                        >
                                        {Object.entries(STATUSES).map(([key, value])=> (
                                            <option key={key}>{value}</option>
                                        ))}
                                    </select>
                                    <button className="delete-button" onClick={()=>handleDelete(app.id)}>
                                        <RiDeleteBin2Line className="delete-svg"/>
                                    </button>
                                </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default ApplicationsTable;