import { IoIosAlert } from "react-icons/io";
import { TbCircleCheckFilled, TbSend, TbXboxXFilled } from "react-icons/tb";

export default function Notification({action, companyName, isLeaving}){
    function renderNotification(action){
        switch(action){
            case "Added" : return <TbCircleCheckFilled fontSize={24}/>
            case "Deleted" : return <TbXboxXFilled fontSize={24} />
            default : return <IoIosAlert fontSize={24} />
        }
    }
    return (
        <div className={`notification card ${isLeaving? "leaving" : "entering"}`} data-action={action}>
            {renderNotification(action)}
            <div className="noti-text-container">
                <span>{action} : </span>
                <span className="noti-name-span">{companyName}</span>
            </div>
        </div>
    )
}