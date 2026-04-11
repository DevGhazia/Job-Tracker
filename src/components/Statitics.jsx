import React from 'react'
import { TbClock, TbMessageDots, TbSend, TbXboxX } from 'react-icons/tb'

export const Statitics = ({list, stats}) => {
    function getStatIcon(stat){
        switch(stat){
            case "Applied" : return <TbSend className='stats-icon'/>;break;
            case "Interviewed": return <TbMessageDots className='stats-icon'/>; break;
            case "Rejected": return <TbXboxX className='stats-icon'/>; break;
            case "No-Response": return <TbClock className='stats-icon'/>; break;
        }
    }

    return (
        <div className="stats-container">
            <h2>Statitics</h2>
            <div className="stats">
                {Object.entries(stats).map(([title, value], index)=>{
                    const status = title === "Interviewed"? "Interviewing" : title;
                    return(
                        <div className={`status-${status.toLowerCase()}`} key={index}>
                            {getStatIcon(title)}
                            <h4>{title}</h4>
                            <h1>{value}</h1>
                        </div>
                    ) 
                })}
            </div>
        </div>
    )
}
