import { useEffect, useState } from "react";
import Notification from "./Notification";

export default function GlobalNotificationLayout(){
    const [toast, setToast] = useState(null);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(()=>{
        function handleToastEvent(event){
            setToast(event.detail);
            setIsLeaving(false);
            const exitTimer = setTimeout(()=>{setIsLeaving(true)}, 2000);
            const removeTimer = setTimeout(()=>{
                setToast(null);
                setIsLeaving(false);
            }, 2250);
            return ()=>{
                clearTimeout(exitTimer);
                clearTimeout(removeTimer);
            }
        }
        window.addEventListener("trigger-toast", handleToastEvent);
        return ()=> window.removeEventListener("trigger-toast", handleToastEvent);
    },[]);

    if(!toast) return null;

    return (
        <Notification action={toast.action} companyName={toast.companyName} isLeaving={isLeaving}/>
    )

}