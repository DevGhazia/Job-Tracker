import React from 'react'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { BiMessageEdit } from 'react-icons/bi'
import { FiSend } from 'react-icons/fi'
import { TbClock, TbClockX, TbMessageDots, TbMessageOff, TbSend, TbXboxX } from 'react-icons/tb'
import { VscSend } from 'react-icons/vsc'

export const Statitics = ({list}) => {
    return (
        <div className="stats-container">
            <h2>Statitics</h2>
            <div className="stats">
                <div className="status-applied ">
                    <TbSend className='stats-icon'/>
                    <h4>Applied</h4>
                    <h1>{list.length}</h1>
                </div>
                <div className="status-interviewing ">
                    <TbMessageDots className='stats-icon'/>
                    <h4>Interviewed</h4>
                    <h1>0</h1>
                </div>
                <div className="status-rejected ">
                    <TbXboxX className='stats-icon'/>
                    <h4>Rejected</h4>
                    <h1>3</h1>
                </div>
                <div className="status-no-response ">
                    <TbClock className='stats-icon'/>
                    <h4>No-Response</h4>
                    <h1>3</h1>
                </div>
            </div>
        </div>
    )
}
