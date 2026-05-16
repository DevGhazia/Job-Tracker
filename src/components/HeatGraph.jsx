import { Tracker, Card } from "@tremor/react";
import { formateDate, getDaysPassed, getMonthName } from "../constants";
import { useEffect, useState } from "react";

export default function HeatGraph({ list }) {

    // List not populated -> return

    const [width, setWidth] = useState(window.innerWidth);

    useEffect(()=>{
        function handleResize(){
            setWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);
        return ()=> window.removeEventListener('resize', handleResize);
    }, []);

    function getLevel(count) {
        if (count === 0) return 'level-0';
        if (count <= 4)  return 'level-1';
        if (count <= 9)  return 'level-2';
        return 'level-3';
    }

    function getCutOffDaysCount(){
        let count = 60;
        if(width <= 450) count = 20;
        else if(width <= 640) count = 30; 
        else if(width <= 800) count = 45;
        return count;
    }

    function generateGraphData() {
        const today = new Date();
        const result = [];
        const counts = {};
        let peakDayDate = "";
        let maxCount = 0;

        const cutoffDate = new Date();
        cutoffDate.setDate(today.getDate() - getCutOffDaysCount());
        list.forEach((app) => {
            counts[app.date] = (counts[app.date] || 0) + 1;
            if(counts[app.date] > maxCount){
                maxCount = counts[app.date];
                peakDayDate = app.date;
            }
        });
        let rollingDate = new Date(cutoffDate);
        while (rollingDate <= today) {
            const dateStr = rollingDate.toISOString().split('T')[0];
            const count = counts[dateStr] || 0;
            result.push({
                tooltip: `${rollingDate.getDate()} ${getMonthName(rollingDate)}, Applied: ${count}`,
                color: getLevel(count), 
            });
            rollingDate.setDate(rollingDate.getDate() + 1);
        }
        return {result, maxCount, peakDayDate};
    }

    const {result, maxCount, peakDayDate} = generateGraphData();

    if(!list.length) return;

    return (
        <section className="section-heatmap">
            <div>
                <h2>Activity Map</h2>
                <small>Visual timeline for the applications sent</small>
            </div>
            <div className="card graph-container">
                <div className="graph-stats-container">
                    <div>
                        <span>🔥 Current streak : </span>
                        <span> 2 days</span>
                    </div>
                    <div>
                        <p>{`⚡ Peak acitivity : 
                            ${maxCount} ${maxCount > 0? "applications" : "job"} 
                            (${formateDate(peakDayDate)})`}
                        </p>
                    </div>
                </div>
                <Tracker 
                    data={result} 
                    className="heat-graph" 
                />
                <div className="graph-subtext-wrapper">
                    <small>{getCutOffDaysCount()} days ago</small>
                    <small>Today</small>
                </div>
            </div>
        </section>
    );
}