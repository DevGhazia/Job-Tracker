import AddCompany from "./AddCompany";
import ApplicationsTable from "./ApplicationsTable";
import ActionQueue from "./ActionQueue";
import DMQueue from "./DMQueue";
import { useEffect, useState } from "react";
import { addApplication, deleteApplication, dismissApplication, clearAllQueuedApplications, listenToApplications, updateApplication } from "../utils_firebase";
import { Statitics } from "./Statitics";
import { FaPlus } from "react-icons/fa6";
import HeatGraph from "./HeatGraph";
import { ACTIONS, STATUSES } from "../constants";

const Dashboard = () => {
    const INITIAL_STATS = { "Applied": 0, "Interviewed": 0, "Rejected": 0, "No-Response": 0 };
    const [companiesList, setCompaniesList] = useState([]);
    const [showModal, setShowModel] = useState(false);
    const [statsList, setStatsList] = useState(INITIAL_STATS);

    useEffect(() => {
        const unsubscribe = listenToApplications(setCompaniesList);
        return () => unsubscribe && unsubscribe();
    }, []);

    // Filter active applied vs queued applications
    const queuedList = companiesList.filter((comp) => comp.status === STATUSES.QUEUED);
    const activeList = companiesList.filter(
        (comp) => comp.status !== STATUSES.QUEUED && comp.status !== STATUSES.DISMISSED && comp.status !== "Dismissed"
    );

    useEffect(() => {
        if (activeList.length === 0) {
            setStatsList(INITIAL_STATS);
            return;
        }
        const statsUpdate = activeList.reduce((acc, comp) => {
            if (comp.didInterview)
                acc["Interviewed"] = acc["Interviewed"] + 1;
            if (comp.status !== "Interviewing" && comp.status !== "Accepted") {
                acc[comp.status] = (acc[comp.status] || 0) + 1;
            }
            return acc;
        }, { ...INITIAL_STATS });
        statsUpdate.Applied = activeList.length;
        setStatsList(statsUpdate);
    }, [companiesList]);

    async function addToTable(formData) {
        try {
            await addApplication(formData);
        } catch (err) {
            console.error(err);
        }
    }

    function updateList(id, fieldName, fieldValue) {
        updateApplication(id, fieldName, fieldValue);
    }

    function handleMarkApplied(id) {
        const targetApp = companiesList.find((c) => c.id === id);
        const today = new Date().toISOString().split("T")[0];
        updateApplication(id, "status", STATUSES.APPLIED);
        updateApplication(id, "date", today);
        
        const event = new CustomEvent("trigger-toast", {
            detail: { action: ACTIONS.ADD, companyName: targetApp ? targetApp.company : "Application" },
        });
        window.dispatchEvent(event);
    }

    function handleDelete(id, action, name) {
        const event = new CustomEvent("trigger-toast", {
            detail: { action: action, companyName: name },
        });
        window.dispatchEvent(event);
        deleteApplication(id);
    }

    function handleDismissQueue(id, action, name) {
        const targetApp = companiesList.find((c) => c.id === id);
        const event = new CustomEvent("trigger-toast", {
            detail: { action: action || ACTIONS.DELETE, companyName: name },
        });
        window.dispatchEvent(event);
        if (targetApp) {
            dismissApplication(targetApp);
        } else {
            deleteApplication(id);
        }
    }

    function handleClearAllQueue() {
        if (queuedList.length === 0) return;
        const count = queuedList.length;
        clearAllQueuedApplications(queuedList);
        const event = new CustomEvent("trigger-toast", {
            detail: { action: ACTIONS.DELETE, companyName: `${count} queued jobs` },
        });
        window.dispatchEvent(event);
    }

    function getSortedActiveList() {
        return activeList.toSorted((a, b) => {
            const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateDiff !== 0) return dateDiff;
            return activeList.indexOf(b) - activeList.indexOf(a);
        });
    }

    return (
        <section className="hero">
            <Statitics list={activeList} stats={statsList} />
            <HeatGraph list={getSortedActiveList()} />

            {/* ⚡ Action Queue positioned below stats and heat map */}
            <ActionQueue
                queueList={queuedList}
                onMarkApplied={handleMarkApplied}
                onDelete={handleDismissQueue}
                onClearAll={handleClearAllQueue}
            />

            {/* 💬 DM Outreach Queue for direct founder & hiring manager outreach */}
            <DMQueue appliedList={companiesList} />

            {showModal && (
                <div className="overlay" onClick={() => setShowModel(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <AddCompany addToTable={addToTable} list={companiesList} />
                    </div>
                </div>
            )}
            <ApplicationsTable
                updateList={updateList}
                list={getSortedActiveList()}
                handleDelete={handleDelete}
            />
            <button
                className="fab-button"
                onClick={() => setShowModel(true)}
            >
                <FaPlus className="fab-button-icon" fontSize={35} />
            </button>
        </section>
    );
};

export default Dashboard;