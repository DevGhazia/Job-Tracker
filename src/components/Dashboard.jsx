import AddCompany from "./AddCompany"
import ApplicationsTable from "./ApplicationsTable"
import { useEffect, useState } from "react";
import { addApplication, deleteApplication, listenToApplications, updateApplication } from "../utils_firebase";
import { Statitics } from "./Statitics";
import { TiPlus } from "react-icons/ti";
import { FaPlus } from "react-icons/fa6";

const Dashboard = () => {
    const INITIAL_STATS = {"Applied": 0, "Interviewed" : 0, "Rejected": 0, "No-Response" : 0};
    const [companiesList, setCompaniesList] = useState([]); 
    const [statsList, setStatsList] = useState(INITIAL_STATS);

    useEffect(() => {
        const unsubscribe = listenToApplications(setCompaniesList);
        return () => unsubscribe && unsubscribe();
    }, []);

    useEffect(()=>{
        if(companiesList.length ===0) return;
        setStatsList(INITIAL_STATS);
        companiesList.map((comp)=>{
            if(comp.didInterview) setStatsList(prev=> ({...prev, "Interviewed" : prev["Interviewed"] + 1}));
            setStatusStats(comp.status);
        })
    }, [companiesList]);

    function setStatusStats(status){
        if(status === "Interviewing" || status === "accepted") return;
        switch(status){
            case "Applied" : setStatsList(prev=> ({...prev, "Applied": companiesList.length})); break;
            default : setStatsList(prev=> ({...prev, [status] : prev[status] + 1})); break;
        }
    }

    async function addToTable(formData){
        try {
            await addApplication(formData);
        } catch (err) {
            console.error(err);
        }
    }

    function updateList(id, fieldName, fieldValue){
        updateApplication(id, fieldName, fieldValue);
    }

    function handleDelete(id){
        deleteApplication(id);
    }

    return (
        <section className="hero">
            <Statitics list={companiesList} stats={statsList}/>
            <AddCompany addToTable={addToTable} list={companiesList}/>
            <ApplicationsTable updateList={updateList} list={companiesList} handleDelete={handleDelete}/>
            <button className="fab-button">
                <FaPlus className="fab-button-icon" fontSize={35}/>
            </button>
        </section>
    )
}

export default Dashboard