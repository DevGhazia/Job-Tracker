import React from 'react'
import { BiSolidMessageSquareCheck, BiSolidMessageSquareDots, BiSolidMessageSquareEdit, BiSolidMessageSquareError, BiSolidMessageSquareX } from 'react-icons/bi';

export const Statitics = ({list}) => {
    return (
        <div className="stats-container">
            <h2>Statitics</h2>
            <div className="stats">
                <div className="status-applied card">
                    <div className='stats-title'>
                        <BiSolidMessageSquareCheck />
                        <h4>APPLIED</h4>
                    </div>
                    <h1>{list.length}</h1>
                </div>
                <div className="status-interviewing card">
                    <div className='stats-title'>
                        <BiSolidMessageSquareDots />
                        <h4>INTERVIEWED</h4>
                    </div>
                    <h1>0</h1>
                </div>
                <div className="status-rejected card">
                    <div className='stats-title'>
                        <BiSolidMessageSquareX />
                        <h4>REJECTED</h4>
                    </div>
                    <h1>3</h1>
                </div>
                <div className="status-no-response card">
                    <div className='stats-title'>
                        <BiSolidMessageSquareEdit />
                        <h4>NO RESPONSE</h4>
                    </div>
                    <h1>3</h1>
                </div>
            </div>
        </div>
    )
}
