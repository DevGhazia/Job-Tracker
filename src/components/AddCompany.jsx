import { useEffect, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { PiBuildingOfficeDuotone } from "react-icons/pi";
import { ROLES, LOCATIONS, STATUSES} from "../constants";

export default function AddCompany({list, addToTable}){
    const FETCH_API = import.meta.env.VITE_API_BASE_URL;
    const getToday = ()=> new Date().toISOString().split("T")[0];
    const [today, setToday] = useState(getToday());
    const initialForm = {
        logo: null,
        company: "",
        date: getToday(),
        status: STATUSES.APPLIED,
        role: ROLES.SDE1,
        experience: 1,
        location: LOCATIONS.BANGALORE,
        didInterview: false,
    }
    const [companies, setCompanies] = useState([]);
    const [isTyping, setIsTyping] = useState(true);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [form, setForm] = useState(initialForm);

    //UPDATE DATE ON TAB FOCUS
    // useEffect(()=>{
    //     console.log("this is a listerner");
    //     const updateDateOnFocus = ()=>{
    //         if(document.visibilityState === "visible"){
    //             console.log("now changing");
    //             const now = new Date().toLocaleDateString('en-CA');
    //             setToday(now);
    //             setFormField("date", now);
    //         }
    //     }
    //     document.addEventListener("visibilitychange", updateDateOnFocus);
    //     return ()=> document.removeEventListener("visibilitychange", updateDateOnFocus);
    // },[]);

    // SEARCH WITH DELAY
    useEffect(()=>{
        if(!form.company.trim() || !isTyping) return;
        const timer = setTimeout(()=>{
            fetchData();        
        }, 200);
        return ()=>clearTimeout(timer);
    }, [form.company]);

    // HIGHLIGHT SUGGESTION
    useEffect(()=>{
        if(highlightIndex === -1) 
            return;
        const highlightedComp = companies[highlightIndex]; 
        setIsTyping(false);
        setForm((prev)=>({
            ...prev, 
            company: highlightedComp.name, 
            logo: highlightedComp.logo_url
        }));
    }, [highlightIndex]);

    const  fetchData = async() => {
        const data = await fetch(`${FETCH_API}${form.company}`);
        const result = await data.json();
        setCompanies(result.data);
        setHighlightIndex(-1);
    };

    function onSuggestionClick(comp){
        setIsTyping(false);
        setForm((prev)=> ({
            ...prev, 
            company: comp.name, 
            logo: comp.logo_url
        }));
        setCompanies([]);
    }

    function handleSuggestionKeyDown(e){
        if(companies.length === 0) return;
        switch(e.key){
            case "ArrowDown" : 
                setHighlightIndex(prev => prev === companies.length - 1? 0 : prev + 1); 
                break;
            case "ArrowUp": 
                setHighlightIndex(prev => prev - 1 < 0? companies.length - 1: prev - 1); 
                break;
            case "Enter":
                setCompanies([]);
                break;
        }
    }

    function handleAdd(){
        const exists = list.some((item)=>item.company === form.company);
        if(exists){
            console.log("already added");
            setForm(initialForm);
                return;
        } 
        const updatedForm = {...form, didInterview: form.status==="Interviewing"? true: false};
        addToTable(updatedForm);
        setForm(initialForm);
    }

    function handleFormChange(e){
        const {name, value} = e.target;
        setForm(prev=> ({...prev, [name]: value}));
    }
    
    function setFormField(name, value){
        setForm(prev => ({...prev, [name]: value}));
    }

    function handleInputChange(e){
        setIsTyping(true);
        handleFormChange(e);
        setFormField("logo", null);
    }

    function handleKeyDown(e){
        if(e.key==='Enter'){
            e.preventDefault();
        }
    }

    return(
        <form className="form card" onSubmit={(e)=>e.preventDefault()} onKeyDown={handleKeyDown}>

            {/* ------ SEARCH BAR ------- */}
            <div className="search-container item1">
                <label htmlFor="searchbar">Company Name</label>
                <div className="searchbar-wrapper">
                    <div className="search-icon-wrapper">
                        {form.logo? 
                            <img src={form.logo} alt="company logo" className="search-icon"/> :
                            form.company?
                                <PiBuildingOfficeDuotone className="search-icon"/> :
                                <CiSearch className="search-icon"/> 
                        }
                    </div>
                    <input 
                        id="searchbar" 
                        className="basic" 
                        type="search" 
                        name="company"
                        value={form.company}
                        onChange={handleInputChange}
                        onKeyDown={handleSuggestionKeyDown}
                        autoComplete="off"
                        placeholder="Enter company's name"
                    />

                    {/* ------ SUGGESTION BOX ------ */}
                    {
                        form.company &&
                        <div className="dropdown">
                            {companies.map((comp, index)=>(
                                <div 
                                    key={index} 
                                    className={`dropdown-item ${index === highlightIndex? "highlight" : ""}`}
                                    onClick={()=>onSuggestionClick(comp)}
                                >
                                    <img src={comp.logo_url} alt="" />
                                    <span>{comp.name}</span>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </div>

            {/* ------ STATUS ------- */}
            <div className="search-container item2">
                <label htmlFor="status">Status</label>
                <select 
                    name="status" 
                    id="status" 
                    className="basic" 
                    value={form.status}
                    onChange={handleFormChange}
                >
                    {Object.entries(STATUSES).map(([key, value])=>(
                        <option value={value} key={key}>{value}</option>
                    ))}
                </select>
            </div>

            {/* ------ ROLE ------- */}
            <div className="search-container item3">
                <label htmlFor="role">Role</label>
                <select 
                    name="role" 
                    id="role" 
                    className="basic"
                    value={form.role}
                    onChange={handleFormChange}
                >
                    {Object.entries(ROLES).map(([key, value])=>(
                        <option key={key} value={value}>{value}</option>
                    ))}
                </select>
            </div>

            
            {/* ------ EXPERIENCE ------- */}
            <div className="search-container item4">
                <label htmlFor="experience">Experience Required</label>
                <div className="experience-input">
                    <button 
                        onClick={()=> setForm(prev=> ({...prev, experience: Math.max(0, Number(prev.experience) -1)}))}
                        type="button"
                        disabled={form.experience === 0}
                    >-</button>
                    <input 
                        type="number" 
                        id="experience"
                        name="experience"
                        className="basic"
                        value={form.experience}
                        onChange={handleFormChange}
                    />
                        <button 
                            onClick={()=>setForm(prev => ({...prev, experience: Number(prev.experience) + 1}))}
                            type="button"
                        >+</button>
                </div>
            </div>

            {/* ------ Location ------- */}
            <div className="search-container item5">
                <label htmlFor="location">Location</label>
                <select 
                    name="location" 
                    id="location" 
                    className="basic"
                    value={form.location}
                    onChange={handleFormChange}
                >
                    {Object.entries(LOCATIONS).map(([key, value])=>(
                        <option key={key} value={value}>{value}</option>
                    ))}
                </select>
            </div>

            {/* ------ DATE ------- */}
            <div className="search-container item6">
                <label htmlFor="date">Date</label>
                <input 
                    type="date" 
                    id="date"
                    name="date"
                    className="basic"
                    value={form.date}
                    max={today}
                    onChange={handleFormChange}
                />
            </div>


            {/* ------ ADD BUTTON ------- */}
            <div className="search-container item7">
                <label htmlFor="add" style={{visibility:"hidden"}}>Add</label>
                <button 
                    className="add-button basic" 
                    type="submit" 
                    id="add"
                    onClick={handleAdd}
                >Add Company</button>
            </div>
        </form>
    )
};