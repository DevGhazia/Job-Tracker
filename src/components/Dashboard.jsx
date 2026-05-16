import AddCompany from "./AddCompany"
import ApplicationsTable from "./ApplicationsTable"
import { useEffect, useState } from "react";
import { addApplication, deleteApplication, listenToApplications, updateApplication } from "../utils_firebase";
import { Statitics } from "./Statitics";
import { TiPlus } from "react-icons/ti";
import { FaPlus } from "react-icons/fa6";
import HeatGraph from "./HeatGraph";

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
        const statsUpdate = companiesList.reduce((acc, comp)=>{
            if(comp.didInterview) 
                acc["Interviewed"] = acc["Interviewed"] + 1;
            if(comp.status != "Interviewing" && comp.status != "Accepted"){
                if(comp.status === "Applied") acc["Applied"] = companiesList.length;
                else{
                    acc[comp.status] = acc[comp.status] + 1;
                }
            }
            return acc;
        }, INITIAL_STATS);
        setStatsList(prev=> ({...prev, ...statsUpdate}));
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

    function getSortedList(){
        return companiesList.toSorted((a,b)=>{
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
    }

    return (
        <section className="hero">
            <Statitics list={companiesList} stats={statsList}/>
            <HeatGraph list={getSortedList()}/>
            <AddCompany addToTable={addToTable} list={companiesList}/>
            <ApplicationsTable updateList={updateList} list={getSortedList()} handleDelete={handleDelete}/>
            <button className="fab-button">
                <FaPlus className="fab-button-icon" fontSize={35}/>
            </button>
        </section>
    )
}

export default Dashboard