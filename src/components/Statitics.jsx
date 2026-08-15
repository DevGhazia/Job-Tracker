import React from 'react';
import { TbClock, TbMessageDots, TbSend, TbXboxX, TbChartBar } from 'react-icons/tb';

export const Statitics = ({list, stats}) => {
    function getStatIcon(stat){
        switch(stat){
            case "Applied" : return <TbSend className='stats-icon'/>;
            case "Interviewed": return <TbMessageDots className='stats-icon'/>;
            case "Rejected": return <TbXboxX className='stats-icon'/>;
            case "No-Response": return <TbClock className='stats-icon'/>;
            default: return <TbSend className='stats-icon'/>;
        }
    }

    return (
        <div className="stats-container">
            <div>
                <div className="section-title-wrapper">
                    <TbChartBar className="section-title-icon" />
                    <h2>Statistics</h2>
                </div>
                <small>Visual overview of your active job search stages</small>
            </div>
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
    );
};
