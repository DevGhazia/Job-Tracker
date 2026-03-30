import AddCompany from "./AddCompany"
import ApplicationsTable from "./ApplicationsTable"
import { useEffect, useState } from "react";
import { addApplication, deleteApplication, listenToApplications, updateApplication } from "../utils_firebase";

const Dashboard = () => {
    const [companiesList, setCompaniesList] = useState([]); 

    useEffect(() => {
        const unsubscribe = listenToApplications(setCompaniesList);
        return () => unsubscribe && unsubscribe();
    }, []);

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
            <AddCompany addToTable={addToTable} list={companiesList}/>
            <ApplicationsTable updateList={updateList} list={companiesList} handleDelete={handleDelete}/>
        </section>
    )
}

export default Dashboard